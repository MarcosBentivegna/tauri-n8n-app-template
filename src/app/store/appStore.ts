import { create } from "zustand";
import { errorMessage, createId } from "../lib/errors";
import { isDesktop, n8nClient } from "../lib/n8nClient";
import type {
  ActivityEntry,
  ActivityKind,
  AppInfo,
  HealthReport,
  Notification,
  NotificationType,
  SettingsInput,
  SettingsView,
  View,
  WebhookResponse,
} from "../types";

const ACTIVITY_KEY = "n8n-studio:activity:v1";
const MAX_ACTIVITY = 30;
const MAX_NOTIFICATIONS = 4;
const TOAST_DURATION_MS = 4500;

const toastTimers = new Map<string, number>();

function isActivityEntry(value: unknown): value is ActivityEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.label === "string" &&
    typeof entry.ok === "boolean" &&
    typeof entry.at === "number" &&
    (entry.kind === "echo" || entry.kind === "sync" || entry.kind === "connection")
  );
}

function loadActivity(): ActivityEntry[] {
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isActivityEntry).slice(0, MAX_ACTIVITY) : [];
  } catch {
    return [];
  }
}

function persistActivity(activity: ActivityEntry[]): void {
  try {
    window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
  } catch {
    // Persistence is best-effort; the in-memory history still works.
  }
}

function offlineReport(message: string): HealthReport {
  return {
    status: "offline",
    baseUrl: "",
    latencyMs: null,
    version: null,
    message,
    checkedAt: Date.now(),
  };
}

interface AppStore {
  view: View;
  initialized: boolean;
  settings: SettingsView | null;
  settingsLoading: boolean;
  settingsError: string | null;
  appInfo: AppInfo | null;
  health: HealthReport | null;
  healthChecking: boolean;
  activity: ActivityEntry[];
  notifications: Notification[];

  setView: (view: View) => void;
  init: () => Promise<void>;
  loadAppInfo: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  saveSettings: (input: SettingsInput) => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
  checkHealth: (options?: { record?: boolean }) => Promise<HealthReport | null>;
  runWebhook: (
    kind: Exclude<ActivityKind, "connection">,
    path: string,
    payload: unknown,
  ) => Promise<WebhookResponse | null>;
  recordActivity: (entry: Omit<ActivityEntry, "id" | "at">) => void;
  clearActivity: (kinds?: ActivityKind[]) => void;
  notify: (message: string, type?: NotificationType) => void;
  dismissNotification: (id: string) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  view: "home",
  initialized: false,
  settings: null,
  settingsLoading: false,
  settingsError: null,
  appInfo: null,
  health: null,
  healthChecking: false,
  activity: loadActivity(),
  notifications: [],

  setView: (view) => set({ view }),

  init: async () => {
    if (get().initialized) {
      return;
    }
    set({ initialized: true, settingsLoading: isDesktop });

    if (!isDesktop) {
      return;
    }

    await get().refreshSettings();
    await get().loadAppInfo();
    await get().checkHealth();
  },

  loadAppInfo: async () => {
    if (!isDesktop) {
      return;
    }
    try {
      set({ appInfo: await n8nClient.appInfo() });
    } catch {
      // App info is informative only; a failure should not break the UI.
    }
  },

  refreshSettings: async () => {
    set({ settingsLoading: true, settingsError: null });
    try {
      set({ settings: await n8nClient.getSettings(), settingsLoading: false });
    } catch (error) {
      set({ settingsLoading: false, settingsError: errorMessage(error) });
    }
  },

  saveSettings: async (input) => {
    try {
      const settings = await n8nClient.saveSettings(input);
      set({ settings, settingsError: null });
      get().notify("Configuración guardada.", "success");
      await get().checkHealth();
      return true;
    } catch (error) {
      get().notify(errorMessage(error), "error");
      return false;
    }
  },

  resetSettings: async () => {
    try {
      const settings = await n8nClient.resetSettings();
      set({ settings, settingsError: null });
      get().notify("Configuración restablecida.", "success");
      await get().checkHealth();
      return true;
    } catch (error) {
      get().notify(errorMessage(error), "error");
      return false;
    }
  },

  checkHealth: async ({ record = false } = {}) => {
    if (!isDesktop) {
      return null;
    }

    if (get().healthChecking) {
      return get().health;
    }

    set({ healthChecking: true });
    try {
      const report = await n8nClient.health();
      set({ health: report, healthChecking: false });

      if (record) {
        get().recordActivity({
          kind: "connection",
          label: "Verificación de conexión",
          ok: report.status === "online",
          status: null,
          durationMs: report.latencyMs,
          detail:
            report.status === "online"
              ? [report.version ? `n8n ${report.version}` : null, report.message]
                  .filter(Boolean)
                  .join(" · ") || "Conexión establecida"
              : (report.message ?? "Sin conexión"),
        });
      }

      return report;
    } catch (error) {
      const report = offlineReport(errorMessage(error));
      set({ health: report, healthChecking: false });
      if (record) {
        get().recordActivity({
          kind: "connection",
          label: "Verificación de conexión",
          ok: false,
          status: null,
          durationMs: null,
          detail: report.message ?? "Error desconocido",
        });
      }
      return report;
    }
  },

  runWebhook: async (kind, path, payload) => {
    try {
      const response = await n8nClient.runWebhook({ path, payload });
      get().recordActivity({
        kind,
        label: kind === "echo" ? "Webhook echo" : "Sync contacts",
        ok: response.ok,
        status: response.status,
        durationMs: response.durationMs,
        detail: response.ok ? undefined : `HTTP ${response.status}`,
      });

      get().notify(
        response.ok
          ? `Webhook ejecutado en ${response.durationMs} ms.`
          : `El webhook respondió HTTP ${response.status}.`,
        response.ok ? "success" : "error",
      );

      return response;
    } catch (error) {
      const message = errorMessage(error);
      get().recordActivity({
        kind,
        label: kind === "echo" ? "Webhook echo" : "Sync contacts",
        ok: false,
        status: null,
        durationMs: null,
        detail: message,
      });
      get().notify(message, "error");
      return null;
    }
  },

  recordActivity: (entry) => {
    const next = [{ ...entry, id: createId(), at: Date.now() }, ...get().activity].slice(
      0,
      MAX_ACTIVITY,
    );
    set({ activity: next });
    persistActivity(next);
  },

  clearActivity: (kinds) => {
    const next = kinds ? get().activity.filter((entry) => !kinds.includes(entry.kind)) : [];
    set({ activity: next });
    persistActivity(next);
  },

  notify: (message, type = "info") => {
    const id = createId();
    set((state) => ({
      notifications: [...state.notifications, { id, type, message }].slice(-MAX_NOTIFICATIONS),
    }));

    const timer = window.setTimeout(() => {
      toastTimers.delete(id);
      get().dismissNotification(id);
    }, TOAST_DURATION_MS);
    toastTimers.set(id, timer);
  },

  dismissNotification: (id) => {
    const timer = toastTimers.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      toastTimers.delete(id);
    }
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id),
    }));
  },
}));
