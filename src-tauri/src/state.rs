use std::path::PathBuf;

use tokio::sync::RwLock;

use crate::config::{Settings, SettingsView};

pub struct AppState {
    pub settings: RwLock<Settings>,
    pub config_path: PathBuf,
}

impl AppState {
    pub fn new(config_path: PathBuf) -> Self {
        let settings = Settings::load(&config_path);
        Self {
            settings: RwLock::new(settings),
            config_path,
        }
    }

    pub async fn view(&self) -> SettingsView {
        self.settings.read().await.view(&self.config_path)
    }
}
