#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod n8n_proxy;

use n8n_proxy::N8nClient;
use serde_json::Value;
use std::sync::Mutex;

struct AppState { 
    n8n: Mutex<Option<N8nClient>> 
}

#[tauri::command]
fn n8n_health_check(state: tauri::State<AppState>) -> Result<String, String> {
    let client = state.n8n.lock().unwrap();
    let cli = client.as_ref().ok_or("N8nClient not initialized")?;
    cli.health().map_err(|e| e.to_string())
}

#[tauri::command]
fn n8n_trigger_echo(state: tauri::State<AppState>, payload: Value) -> Result<Value, String> {
    let client = state.n8n.lock().unwrap();
    let cli = client.as_ref().ok_or("N8nClient not initialized")?;
    cli.post_webhook("echo", payload).map_err(|e| e.to_string())
}

#[tauri::command]
fn n8n_trigger_contacts_sync(state: tauri::State<AppState>, payload: Value) -> Result<Value, String> {
    let client = state.n8n.lock().unwrap();
    let cli = client.as_ref().ok_or("N8nClient not initialized")?;
    cli.post_webhook("sync-contacts", payload).map_err(|e| e.to_string())
}

fn main() {
    dotenvy::dotenv().ok();
    let base = std::env::var("N8N_BASE_URL").unwrap_or_else(|_| "http://localhost:5678".into());
    let user = std::env::var("N8N_USER").unwrap_or_else(|_| "admin".into());
    let pass = std::env::var("N8N_PASSWORD").unwrap_or_else(|_| "adminadmin".into());

    let client = N8nClient::new(base, user, pass);

    tauri::Builder::default()
        .manage(AppState { n8n: Mutex::new(Some(client)) })
        .invoke_handler(tauri::generate_handler![
            n8n_health_check,
            n8n_trigger_echo,
            n8n_trigger_contacts_sync
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
