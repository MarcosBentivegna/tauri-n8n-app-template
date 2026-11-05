export type View = "home" | "workflows" | "settings";

export interface SettingsView {
  baseUrl: string;
  username: string;
  hasPassword: boolean;
  timeoutSecs: number;
  configPath: string;
}

export interface SettingsInput {
  baseUrl: string;
  username: string;
  password?: string;
  clearPassword?: boolean;
  timeoutSecs: number;
}

export type HealthStatus = "online" | "auth_required" | "offline";

export interface HealthReport {
  status: HealthStatus;
  baseUrl: string;
  latencyMs: number | null;
  version: string | null;
  message: string | null;
  checkedAt: number;
}

export interface WebhookRequest {
  path: string;
  payload: unknown;
}

export interface WebhookResponse {
  ok: boolean;
  status: number;
  durationMs: number;
  url: string;
  body: unknown;
}

export interface AppInfo {
  name: string;
  version: string;
  tauriVersion: string;
  os: string;
  arch: string;
  debug: boolean;
  configPath: string;
}

export type ActivityKind = "echo" | "sync" | "connection";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  label: string;
  ok: boolean;
  status: number | null;
  durationMs: number | null;
  at: number;
  detail?: string;
}

export type NotificationType = "success" | "error" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}
