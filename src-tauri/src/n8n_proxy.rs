use reqwest::blocking::{Client, Response};
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde_json::Value;
use std::time::Duration;

pub struct N8nClient {
    base: String,
    user: String,
    pass: String,
    http: Client,
}

impl N8nClient {
    pub fn new(base: String, user: String, pass: String) -> Self {
        let http = Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .unwrap();
        Self { base, user, pass, http }
    }

    fn auth_header(&self) -> String {
        let raw = format!("{}:{}", self.user, self.pass);
        format!("Basic {}", base64::encode(raw))
    }

    pub fn health(&self) -> anyhow::Result<String> {
        // No todas las rutas /rest son públicas; si falla, probamos /.
        let url = format!("{}/", self.base.trim_end_matches("/"));
        let res = self.http.get(&url).header(AUTHORIZATION, self.auth_header()).send()?;
        Ok(format!("HTTP {}", res.status()))
    }

    pub fn post_webhook(&self, path: &str, payload: Value) -> anyhow::Result<Value> {
        let url = format!("{}/webhook/{}", self.base.trim_end_matches("/"), path.trim_start_matches("/"));
        let res = self.http
            .post(&url)
            .header(AUTHORIZATION, self.auth_header())
            .header(CONTENT_TYPE, "application/json")
            .json(&payload)
            .send()?;

        let status = res.status();
        let text = res.text()?;
        if status.is_success() {
            let v: Value = serde_json::from_str(&text).unwrap_or(serde_json::json!({ "raw": text }));
            Ok(v)
        } else {
            Err(anyhow::anyhow!("n8n error {}: {}", status, text))
        }
    }
}
