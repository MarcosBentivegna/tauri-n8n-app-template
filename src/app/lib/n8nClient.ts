import { invoke, isTauri } from "@tauri-apps/api/core";
import type {
  AppInfo,
  HealthReport,
  SettingsInput,
  SettingsView,
  WebhookRequest,
  WebhookResponse,
} from "../types";

export const isDesktop = isTauri();

const NOT_RUNNING_MESSAGE =
  "Esta función necesita la app de escritorio. Ejecutá `npm run dev:app` (o la build instalada).";

function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isDesktop) {
    return Promise.reject(new Error(NOT_RUNNING_MESSAGE));
  }
  return invoke<T>(command, args);
}

export const n8nClient = {
  getSettings: () => call<SettingsView>("get_settings"),
  saveSettings: (settings: SettingsInput) => call<SettingsView>("save_settings", { settings }),
  resetSettings: () => call<SettingsView>("reset_settings"),
  health: () => call<HealthReport>("health_check"),
  runWebhook: (request: WebhookRequest) => call<WebhookResponse>("run_webhook", { request }),
  openUrl: (url: string) => call<void>("open_url", { url }),
  appInfo: () => call<AppInfo>("app_info"),
};
