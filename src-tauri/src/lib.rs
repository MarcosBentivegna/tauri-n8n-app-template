mod commands;
mod config;
mod error;
mod n8n;
mod state;

use tauri::Manager;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenvy::dotenv().ok();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let config_path = app.path().app_config_dir()?.join("settings.json");
            app.manage(AppState::new(config_path));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::save_settings,
            commands::reset_settings,
            commands::health_check,
            commands::run_webhook,
            commands::open_url,
            commands::app_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running n8n Studio");
}
