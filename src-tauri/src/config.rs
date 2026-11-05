use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};
use url::Url;

use crate::error::AppError;

pub const DEFAULT_BASE_URL: &str = "http://localhost:5678";
pub const DEFAULT_TIMEOUT_SECS: u64 = 15;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub base_url: String,
    #[serde(default)]
    pub username: String,
    #[serde(default)]
    pub password: String,
    #[serde(default = "default_timeout")]
    pub timeout_secs: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsInput {
    pub base_url: String,
    #[serde(default)]
    pub username: String,
    /// `None` keeps the stored password, `Some("")` clears it.
    #[serde(default)]
    pub password: Option<String>,
    #[serde(default)]
    pub clear_password: bool,
    #[serde(default = "default_timeout")]
    pub timeout_secs: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsView {
    pub base_url: String,
    pub username: String,
    pub has_password: bool,
    pub timeout_secs: u64,
    pub config_path: String,
}

fn default_timeout() -> u64 {
    DEFAULT_TIMEOUT_SECS
}

fn env_or(name: &str, fallback: &str) -> String {
    std::env::var(name)
        .ok()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| fallback.to_string())
}

impl Default for Settings {
    fn default() -> Self {
        let timeout_secs = std::env::var("N8N_TIMEOUT_SECS")
            .ok()
            .and_then(|value| value.parse::<u64>().ok())
            .unwrap_or(DEFAULT_TIMEOUT_SECS)
            .clamp(3, 120);

        Self {
            base_url: env_or("N8N_BASE_URL", DEFAULT_BASE_URL),
            username: env_or("N8N_USER", ""),
            password: env_or("N8N_PASSWORD", ""),
            timeout_secs,
        }
    }
}

impl Settings {
    pub fn timeout_secs(&self) -> u64 {
        self.timeout_secs.clamp(3, 120)
    }

    pub fn parsed_base_url(&self) -> Result<Url, AppError> {
        normalize_base_url(&self.base_url)
            .and_then(|value| Url::parse(&value).map_err(|_| AppError::InvalidUrl))
    }

    pub fn apply(&mut self, input: SettingsInput) -> Result<(), AppError> {
        self.base_url = normalize_base_url(&input.base_url)?;
        self.username = input.username.trim().to_string();
        self.timeout_secs = input.timeout_secs.clamp(3, 120);

        if input.clear_password {
            self.password.clear();
        } else if let Some(password) = input.password {
            if !password.is_empty() {
                self.password = password;
            }
        }

        Ok(())
    }

    pub fn view(&self, config_path: &Path) -> SettingsView {
        SettingsView {
            base_url: self.base_url.clone(),
            username: self.username.clone(),
            has_password: !self.password.is_empty(),
            timeout_secs: self.timeout_secs(),
            config_path: config_path.display().to_string(),
        }
    }

    pub fn load(config_path: &Path) -> Self {
        let text = match fs::read_to_string(config_path) {
            Ok(text) => text,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Settings::default();
            }
            Err(error) => {
                eprintln!(
                    "No se pudo leer {}: {error}. Se usarán los valores por defecto.",
                    config_path.display()
                );
                return Settings::default();
            }
        };

        match serde_json::from_str::<Settings>(&text) {
            Ok(settings) if settings.parsed_base_url().is_ok() => settings,
            Ok(_) => {
                eprintln!(
                    "La configuración guardada en {} es inválida. Se usarán los valores por defecto.",
                    config_path.display()
                );
                Settings::default()
            }
            Err(error) => {
                eprintln!(
                    "No se pudo interpretar {}: {error}. Se usarán los valores por defecto.",
                    config_path.display()
                );
                Settings::default()
            }
        }
    }

    pub fn save(&self, config_path: &Path) -> Result<(), AppError> {
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let serialized = serde_json::to_vec_pretty(self)?;
        let temporary_path = config_path.with_extension("json.tmp");

        fs::write(&temporary_path, serialized)?;
        set_private_permissions(&temporary_path)?;

        #[cfg(target_os = "windows")]
        if config_path.exists() {
            fs::remove_file(config_path)?;
        }

        fs::rename(temporary_path, config_path)?;
        Ok(())
    }
}

#[cfg(unix)]
fn set_private_permissions(path: &Path) -> Result<(), AppError> {
    use std::os::unix::fs::PermissionsExt;

    fs::set_permissions(path, fs::Permissions::from_mode(0o600))?;
    Ok(())
}

#[cfg(not(unix))]
fn set_private_permissions(_path: &Path) -> Result<(), AppError> {
    Ok(())
}

/// Normalizes a base URL and rejects anything that is not plain http(s).
pub fn normalize_base_url(value: &str) -> Result<String, AppError> {
    let mut url = Url::parse(value.trim()).map_err(|_| AppError::InvalidUrl)?;

    if !matches!(url.scheme(), "http" | "https")
        || url.host_str().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
    {
        return Err(AppError::InvalidUrl);
    }

    url.set_query(None);
    url.set_fragment(None);

    let mut normalized = url.to_string();
    while normalized.ends_with('/') && normalized.len() > "https://".len() {
        normalized.pop();
    }

    Ok(normalized)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_trailing_slashes() {
        assert_eq!(
            normalize_base_url(" http://localhost:5678/// ").unwrap(),
            "http://localhost:5678"
        );
    }

    #[test]
    fn keeps_subpaths() {
        assert_eq!(
            normalize_base_url("https://example.com/n8n/").unwrap(),
            "https://example.com/n8n"
        );
    }

    #[test]
    fn rejects_unsafe_urls() {
        assert!(normalize_base_url("ftp://localhost").is_err());
        assert!(normalize_base_url("localhost:5678").is_err());
        assert!(normalize_base_url("http://user:pass@localhost:5678").is_err());
    }

    #[test]
    fn apply_keeps_password_when_omitted() {
        let mut settings = Settings {
            base_url: "http://localhost:5678".into(),
            username: "admin".into(),
            password: "secret".into(),
            timeout_secs: 15,
        };

        settings
            .apply(SettingsInput {
                base_url: "http://localhost:5678".into(),
                username: "admin".into(),
                password: None,
                clear_password: false,
                timeout_secs: 30,
            })
            .unwrap();

        assert_eq!(settings.password, "secret");
        assert_eq!(settings.timeout_secs, 30);
    }

    #[test]
    fn saves_and_loads_settings() {
        let dir = std::env::temp_dir().join(format!("n8n-studio-test-{}", std::process::id()));
        let path = dir.join("settings.json");
        let settings = Settings {
            base_url: "http://localhost:5678".into(),
            username: "admin".into(),
            password: "secret".into(),
            timeout_secs: 30,
        };

        settings.save(&path).unwrap();
        let loaded = Settings::load(&path);

        assert_eq!(loaded.base_url, settings.base_url);
        assert_eq!(loaded.username, settings.username);
        assert_eq!(loaded.password, settings.password);
        assert_eq!(loaded.timeout_secs, settings.timeout_secs);

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;

            let mode = fs::metadata(&path).unwrap().permissions().mode() & 0o777;
            assert_eq!(mode, 0o600);
        }

        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn apply_can_clear_password() {
        let mut settings = Settings {
            base_url: "http://localhost:5678".into(),
            username: "admin".into(),
            password: "secret".into(),
            timeout_secs: 15,
        };

        settings
            .apply(SettingsInput {
                base_url: "http://localhost:5678".into(),
                username: "admin".into(),
                password: None,
                clear_password: true,
                timeout_secs: 15,
            })
            .unwrap();

        assert!(settings.password.is_empty());
    }
}
