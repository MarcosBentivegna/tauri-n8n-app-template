use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("La URL de n8n no es válida. Usá una dirección http:// o https:// sin credenciales.")]
    InvalidUrl,
    #[error("La ruta del webhook no es válida.")]
    InvalidWebhookPath,
    #[error("No se pudo conectar con n8n. Verificá que esté corriendo.")]
    Connection,
    #[error("n8n tardó demasiado en responder.")]
    Timeout,
    #[error("No se pudo guardar la configuración: {0}")]
    Io(#[from] std::io::Error),
    #[error("No se pudo leer la configuración: {0}")]
    Json(#[from] serde_json::Error),
    #[error("{0}")]
    Message(String),
}

impl From<reqwest::Error> for AppError {
    fn from(error: reqwest::Error) -> Self {
        if error.is_timeout() {
            AppError::Timeout
        } else if error.is_connect() {
            AppError::Connection
        } else {
            AppError::Message(format!("Error de red: {error}"))
        }
    }
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
