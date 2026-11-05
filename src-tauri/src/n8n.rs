use reqwest::Client;
use serde::Serialize;
use url::Url;

use crate::config::Settings;
use crate::error::AppError;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum HealthStatus {
    Online,
    AuthRequired,
    Offline,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthReport {
    pub status: HealthStatus,
    pub base_url: String,
    pub latency_ms: Option<u64>,
    pub version: Option<String>,
    pub message: Option<String>,
    pub checked_at: u64,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebhookRequest {
    pub path: String,
    pub payload: serde_json::Value,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WebhookResponse {
    pub ok: bool,
    pub status: u16,
    pub duration_ms: u64,
    pub url: String,
    pub body: serde_json::Value,
}

/// Builds the HTTP client used for every request, honouring the configured timeout.
pub fn build_client(settings: &Settings) -> Result<Client, AppError> {
    Client::builder()
        .timeout(std::time::Duration::from_secs(
            settings.timeout_secs().clamp(3, 120),
        ))
        .user_agent(concat!("n8n-studio/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|_| AppError::Connection)
}

fn endpoint(base: &Url, path: &str) -> String {
    format!(
        "{}/{}",
        base.as_str().trim_end_matches('/'),
        path.trim_start_matches('/')
    )
}

fn with_auth(request: reqwest::RequestBuilder, settings: &Settings) -> reqwest::RequestBuilder {
    if settings.username.is_empty() && settings.password.is_empty() {
        return request;
    }

    request.basic_auth(
        &settings.username,
        (!settings.password.is_empty()).then_some(settings.password.as_str()),
    )
}

/// Checks if n8n is reachable and, when possible, reads its version.
pub async fn check_health(settings: &Settings) -> HealthReport {
    let checked_at = now_ms();
    let base_url = settings.base_url.clone();

    let base = match settings.parsed_base_url() {
        Ok(base) => base,
        Err(error) => {
            return HealthReport {
                status: HealthStatus::Offline,
                base_url,
                latency_ms: None,
                version: None,
                message: Some(error.to_string()),
                checked_at,
            };
        }
    };

    let client = match build_client(settings) {
        Ok(client) => client,
        Err(error) => {
            return HealthReport {
                status: HealthStatus::Offline,
                base_url,
                latency_ms: None,
                version: None,
                message: Some(error.to_string()),
                checked_at,
            };
        }
    };

    let started = std::time::Instant::now();
    let health_url = endpoint(&base, "healthz");
    let response = with_auth(client.get(&health_url), settings).send().await;

    // Older n8n versions do not expose /healthz; fall back to the root page.
    let response = match response {
        Ok(response) if response.status() == reqwest::StatusCode::NOT_FOUND => {
            with_auth(client.get(base.as_str()), settings).send().await
        }
        other => other,
    };

    let latency_ms = Some(started.elapsed().as_millis() as u64);

    match response {
        Ok(response) if response.status().is_success() => {
            let version = fetch_version(&client, &base, settings).await;
            HealthReport {
                status: HealthStatus::Online,
                base_url,
                latency_ms,
                version,
                message: None,
                checked_at,
            }
        }
        Ok(response)
            if response.status() == reqwest::StatusCode::UNAUTHORIZED
                || response.status() == reqwest::StatusCode::FORBIDDEN =>
        {
            HealthReport {
                status: HealthStatus::AuthRequired,
                base_url,
                latency_ms,
                version: None,
                message: Some(
                    "n8n está en línea pero rechazó las credenciales configuradas.".into(),
                ),
                checked_at,
            }
        }
        Ok(response) => HealthReport {
            status: HealthStatus::Offline,
            base_url,
            latency_ms,
            version: None,
            message: Some(format!("n8n respondió HTTP {}.", response.status())),
            checked_at,
        },
        Err(error) => HealthReport {
            status: HealthStatus::Offline,
            base_url,
            latency_ms: None,
            version: None,
            message: Some(friendly_request_error(&error)),
            checked_at,
        },
    }
}

async fn fetch_version(client: &Client, base: &Url, settings: &Settings) -> Option<String> {
    // Authenticated instances expose the CLI version in /rest/settings.
    if let Some(version) = fetch_version_from_settings(client, base, settings).await {
        return Some(version);
    }

    // Public instances hide it, but the editor HTML embeds a base64-encoded
    // Sentry config with the release name (`n8n@x.y.z`).
    fetch_version_from_homepage(client, base).await
}

async fn fetch_version_from_settings(
    client: &Client,
    base: &Url,
    settings: &Settings,
) -> Option<String> {
    let response = with_auth(client.get(endpoint(base, "rest/settings")), settings)
        .header(reqwest::header::ACCEPT, "application/json")
        .timeout(std::time::Duration::from_secs(3))
        .send()
        .await
        .ok()?;

    if !response.status().is_success() {
        return None;
    }

    let json: serde_json::Value = response.json().await.ok()?;
    json.pointer("/data/versionCli")
        .or_else(|| json.pointer("/versionCli"))
        .or_else(|| json.pointer("/data/version"))
        .and_then(serde_json::Value::as_str)
        .map(ToOwned::to_owned)
}

async fn fetch_version_from_homepage(client: &Client, base: &Url) -> Option<String> {
    let html = client
        .get(base.as_str())
        .timeout(std::time::Duration::from_secs(3))
        .send()
        .await
        .ok()?
        .text()
        .await
        .ok()?;

    parse_version_from_html(&html)
}

fn parse_version_from_html(html: &str) -> Option<String> {
    use base64::Engine as _;

    let marker = "name=\"n8n:config:sentry\" content=\"";
    let start = html.find(marker)? + marker.len();
    let end = html[start..].find('"')? + start;
    let decoded = base64::engine::general_purpose::STANDARD
        .decode(&html[start..end])
        .ok()?;
    let json: serde_json::Value = serde_json::from_slice(&decoded).ok()?;
    let release = json.get("release")?.as_str()?;

    Some(release.strip_prefix("n8n@").unwrap_or(release).to_string())
}

/// Sends a JSON payload to an n8n webhook and returns the response verbatim.
pub async fn run_webhook(
    settings: &Settings,
    path: &str,
    payload: serde_json::Value,
) -> Result<WebhookResponse, AppError> {
    let base = settings.parsed_base_url()?;
    let client = build_client(settings)?;
    let normalized_path = normalize_webhook_path(path)?;
    let url = endpoint(&base, &normalized_path);

    let started = std::time::Instant::now();
    let response = with_auth(client.post(&url), settings)
        .header(reqwest::header::CONTENT_TYPE, "application/json")
        .json(&payload)
        .send()
        .await?;

    let status = response.status();
    let text = response.text().await?;
    let body = serde_json::from_str(&text).unwrap_or(serde_json::Value::String(text));

    Ok(WebhookResponse {
        ok: status.is_success(),
        status: status.as_u16(),
        duration_ms: started.elapsed().as_millis() as u64,
        url,
        body,
    })
}

/// Accepts either a bare webhook path (`echo`) or a full path (`webhook/echo`).
pub fn normalize_webhook_path(input: &str) -> Result<String, AppError> {
    let trimmed = input.trim().trim_matches('/');

    if trimmed.is_empty() || trimmed.len() > 200 {
        return Err(AppError::InvalidWebhookPath);
    }

    if trimmed
        .split('/')
        .any(|segment| segment.is_empty() || segment == "." || segment == "..")
    {
        return Err(AppError::InvalidWebhookPath);
    }

    if !trimmed
        .bytes()
        .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'/'))
    {
        return Err(AppError::InvalidWebhookPath);
    }

    if trimmed.starts_with("webhook/") || trimmed.starts_with("webhook-test/") {
        Ok(trimmed.to_string())
    } else {
        Ok(format!("webhook/{trimmed}"))
    }
}

fn friendly_request_error(error: &reqwest::Error) -> String {
    if error.is_timeout() {
        "n8n tardó demasiado en responder. Revisá el timeout y que la instancia esté activa.".into()
    } else if error.is_connect() {
        "No se pudo conectar con n8n. Verificá que esté corriendo y que la URL sea correcta.".into()
    } else if error.is_decode() {
        "n8n devolvió una respuesta que no se pudo interpretar.".into()
    } else {
        format!("Error de red: {error}")
    }
}

pub fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_bare_webhook_paths() {
        assert_eq!(normalize_webhook_path("echo").unwrap(), "webhook/echo");
        assert_eq!(
            normalize_webhook_path(" /sync-contacts/ ").unwrap(),
            "webhook/sync-contacts"
        );
    }

    #[test]
    fn preserves_explicit_webhook_prefixes() {
        assert_eq!(
            normalize_webhook_path("webhook/echo").unwrap(),
            "webhook/echo"
        );
        assert_eq!(
            normalize_webhook_path("webhook-test/echo").unwrap(),
            "webhook-test/echo"
        );
    }

    #[test]
    fn rejects_unsafe_webhook_paths() {
        assert!(normalize_webhook_path("").is_err());
        assert!(normalize_webhook_path("http://evil.test").is_err());
        assert!(normalize_webhook_path("echo?x=1").is_err());
        assert!(normalize_webhook_path("webhook/../admin").is_err());
        assert!(normalize_webhook_path("hello world").is_err());
    }

    #[test]
    fn reads_n8n_version_from_the_editor_html() {
        // {"dsn":"","environment":"development","release":"n8n@2.46.6"}
        let html = r#"<meta name="n8n:config:sentry" content="eyJkc24iOiIiLCJlbnZpcm9ubWVudCI6ImRldmVsb3BtZW50IiwicmVsZWFzZSI6Im44bkAyLjQ2LjYifQ==">"#;
        assert_eq!(parse_version_from_html(html).as_deref(), Some("2.46.6"));
    }

    #[test]
    fn ignores_html_without_a_version() {
        assert!(parse_version_from_html("<html></html>").is_none());
    }
}
