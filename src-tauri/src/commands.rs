use serde::Serialize;
use tauri::{AppHandle, State};
use tauri_plugin_opener::OpenerExt;
use url::Url;

use crate::config::{SettingsInput, SettingsView};
use crate::error::AppError;
use crate::n8n::{self, HealthReport, WebhookRequest, WebhookResponse};
use crate::state::AppState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub tauri_version: String,
    pub os: String,
    pub arch: String,
    pub debug: bool,
    pub config_path: String,
}

#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<SettingsView, AppError> {
    Ok(state.view().await)
}

#[tauri::command]
pub async fn save_settings(
    state: State<'_, AppState>,
    settings: SettingsInput,
) -> Result<SettingsView, AppError> {
    let mut current = state.settings.write().await;
    current.apply(settings)?;
    current.save(&state.config_path)?;
    Ok(current.view(&state.config_path))
}

#[tauri::command]
pub async fn reset_settings(state: State<'_, AppState>) -> Result<SettingsView, AppError> {
    let defaults = crate::config::Settings::default();
    defaults.save(&state.config_path)?;

    let mut current = state.settings.write().await;
    *current = defaults;
    Ok(current.view(&state.config_path))
}

#[tauri::command]
pub async fn health_check(state: State<'_, AppState>) -> Result<HealthReport, AppError> {
    let settings = state.settings.read().await.clone();
    Ok(n8n::check_health(&settings).await)
}

#[tauri::command]
pub async fn run_webhook(
    state: State<'_, AppState>,
    request: WebhookRequest,
) -> Result<WebhookResponse, AppError> {
    let settings = state.settings.read().await.clone();
    n8n::run_webhook(&settings, &request.path, request.payload).await
}

#[tauri::command]
pub async fn open_url(app: AppHandle, url: String) -> Result<(), AppError> {
    let parsed = Url::parse(&url).map_err(|_| AppError::InvalidUrl)?;

    if !matches!(parsed.scheme(), "http" | "https") {
        return Err(AppError::Message(
            "Solo se pueden abrir enlaces http o https.".into(),
        ));
    }

    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|error| AppError::Message(format!("No se pudo abrir el enlace: {error}")))
}

#[tauri::command]
pub fn app_info(app: AppHandle, state: State<'_, AppState>) -> AppInfo {
    let package = app.package_info();

    AppInfo {
        name: package.name.clone(),
        version: package.version.to_string(),
        tauri_version: tauri::VERSION.to_string(),
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        debug: cfg!(debug_assertions),
        config_path: state.config_path.display().to_string(),
    }
}
