import { useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  HardDrive,
  KeyRound,
  Loader2,
  RotateCcw,
  Save,
  Server,
  ShieldCheck,
  Trash2,
  UserRound,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { cn } from "../lib/cn";
import { isDesktop } from "../lib/n8nClient";
import { formatDuration, formatRelativeTime } from "../lib/format";
import { useCopy } from "../lib/useCopy";
import { useOpenN8n } from "../lib/useOpenN8n";
import { isValidHttpUrl, normalizeBaseUrl } from "../lib/validation";
import { useAppStore } from "../store/appStore";
import type { AppInfo, HealthReport, SettingsView } from "../types";

const INPUT_CLASS =
  "h-10 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-rose-400/40 focus:ring-2 focus:ring-rose-400/20 disabled:cursor-not-allowed disabled:opacity-60";

function Field({
  label,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
        {Icon ? <Icon aria-hidden className="h-3 w-3 text-slate-500" /> : null}
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[10px] leading-relaxed text-slate-600">{hint}</p> : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.05] py-2 last:border-0 last:pb-0 first:pt-0">
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="text-right text-[11px] font-medium text-slate-300">{value}</dd>
    </div>
  );
}

function ConnectionCard({
  settings,
  health,
  healthChecking,
}: {
  settings: SettingsView;
  health: HealthReport | null;
  healthChecking: boolean;
}) {
  const saveSettings = useAppStore((state) => state.saveSettings);
  const checkHealth = useAppStore((state) => state.checkHealth);
  const notify = useAppStore((state) => state.notify);

  const [form, setForm] = useState(() => ({
    baseUrl: settings.baseUrl,
    username: settings.username,
    password: "",
    timeoutSecs: settings.timeoutSecs,
  }));
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty =
    form.baseUrl !== settings.baseUrl ||
    form.username !== settings.username ||
    form.password.length > 0 ||
    form.timeoutSecs !== settings.timeoutSecs;

  const urlValid = isValidHttpUrl(form.baseUrl);
  const timeoutValid =
    Number.isFinite(form.timeoutSecs) && form.timeoutSecs >= 3 && form.timeoutSecs <= 120;
  const canSave = dirty && urlValid && timeoutValid && !saving;

  const handleSave = async () => {
    if (!urlValid) {
      notify("Ingresá una URL válida que empiece con http:// o https://.", "error");
      return;
    }

    if (!timeoutValid) {
      notify("El timeout debe estar entre 3 y 120 segundos.", "error");
      return;
    }

    setSaving(true);
    const saved = await saveSettings({
      baseUrl: normalizeBaseUrl(form.baseUrl),
      username: form.username.trim(),
      ...(form.password ? { password: form.password } : {}),
      clearPassword: false,
      timeoutSecs: form.timeoutSecs,
    });
    setSaving(false);

    if (saved) {
      setForm((current) => ({ ...current, password: "" }));
    }
  };

  const handleTest = async () => {
    if (dirty) {
      notify("Guardá los cambios antes de probar la nueva configuración.", "info");
      return;
    }

    const report = await checkHealth({ record: true });
    if (!report) {
      return;
    }

    if (report.status === "online") {
      notify(
        `Conexión OK${report.version ? ` · n8n ${report.version}` : ""}${
          typeof report.latencyMs === "number" ? ` · ${formatDuration(report.latencyMs)}` : ""
        }`,
        "success",
      );
    } else {
      notify(report.message ?? "No se pudo conectar con n8n.", "error");
    }
  };

  const handleClearPassword = async () => {
    await saveSettings({
      baseUrl: settings.baseUrl,
      username: settings.username,
      clearPassword: true,
      timeoutSecs: settings.timeoutSecs,
    });
    setForm((current) => ({ ...current, password: "" }));
  };

  const timeoutHint =
    health?.status === "online" && typeof health.latencyMs === "number"
      ? `La última verificación tardó ${formatDuration(health.latencyMs)}.`
      : "Tiempo máximo de espera por request. Entre 3 y 120 segundos.";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Server aria-hidden className="h-4 w-4 text-slate-500" />
            Conexión con n8n
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            La app usa estos datos para el health check y para enviar webhooks.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            dirty
              ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
              : "border-white/[0.07] bg-white/[0.03] text-slate-500",
          )}
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full", dirty ? "bg-amber-400" : "bg-slate-600")}
          />
          {dirty ? "Cambios sin guardar" : "Sincronizado"}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <Field
          label="URL base"
          icon={Server}
          hint="Incluí el protocolo. Si n8n corre en Docker, normalmente es http://localhost:5678."
        >
          <input
            value={form.baseUrl}
            onChange={(event) =>
              setForm((current) => ({ ...current, baseUrl: event.target.value }))
            }
            spellCheck={false}
            placeholder="http://localhost:5678"
            aria-invalid={!urlValid}
            className={cn(INPUT_CLASS, !urlValid && "border-rose-400/40 focus:border-rose-400/60")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Usuario"
            icon={UserRound}
            hint="Opcional. Se envía como Basic Auth si n8n lo requiere."
          >
            <input
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({ ...current, username: event.target.value }))
              }
              spellCheck={false}
              autoComplete="username"
              placeholder="admin"
              className={INPUT_CLASS}
            />
          </Field>

          <Field
            label="Contraseña"
            icon={KeyRound}
            hint={
              settings.hasPassword ? (
                <span className="inline-flex flex-wrap items-center gap-1">
                  Hay una contraseña guardada. Dejá el campo vacío para conservarla.
                  <button
                    type="button"
                    onClick={() => void handleClearPassword()}
                    className="font-medium text-rose-300 transition hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
                  >
                    Olvidar
                  </button>
                </span>
              ) : (
                "Opcional. Se guarda en el archivo local de configuración con permisos restringidos."
              )
            }
          >
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                autoComplete="current-password"
                placeholder={settings.hasPassword ? "•••••••• (guardada)" : "Sin contraseña"}
                className={cn(INPUT_CLASS, "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
              >
                {showPassword ? (
                  <EyeOff aria-hidden className="h-3.5 w-3.5" />
                ) : (
                  <Eye aria-hidden className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </Field>
        </div>

        <Field label="Timeout de red" icon={Wifi} hint={timeoutHint}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={3}
              max={120}
              value={form.timeoutSecs}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  timeoutSecs: Number.parseInt(event.target.value, 10) || 0,
                }))
              }
              aria-invalid={!timeoutValid}
              className={cn(INPUT_CLASS, "max-w-[120px]", !timeoutValid && "border-rose-400/40")}
            />
            <span className="text-[11px] text-slate-500">segundos</span>
          </div>
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-4">
        <p className="text-[10px] text-slate-600">
          {health
            ? `Último chequeo ${formatRelativeTime(health.checkedAt)}`
            : "Todavía no se verificó la conexión"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleTest()}
            loading={healthChecking}
            disabled={dirty || !urlValid}
            title={
              dirty
                ? "Guardá los cambios antes de probar la configuración"
                : "Verificar la conexión con n8n"
            }
          >
            <Wifi aria-hidden className="h-3.5 w-3.5" />
            Probar conexión
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSave()}
            loading={saving}
            disabled={!canSave}
          >
            <Save aria-hidden className="h-3.5 w-3.5" />
            Guardar cambios
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SecurityCard({ configPath }: { configPath: string }) {
  const { copied, copy } = useCopy();

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
        <ShieldCheck aria-hidden className="h-4 w-4 text-emerald-400" />
        Seguridad
      </h2>
      <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-slate-400">
        <li className="flex gap-2">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/70" />
          La contraseña se guarda en el backend de Rust y nunca se devuelve al webview.
        </li>
        <li className="flex gap-2">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/70" />
          En macOS y Linux el archivo de configuración se escribe con permisos{" "}
          <code className="font-mono text-slate-300">0600</code>.
        </li>
        <li className="flex gap-2">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/70" />
          El webview no puede hacer requests externos: todas las llamadas a n8n pasan por Rust.
        </li>
      </ul>

      <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/25 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
            Archivo de configuración
          </p>
          <button
            type="button"
            onClick={() => void copy(configPath)}
            aria-label="Copiar ruta de configuración"
            className="rounded p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
          >
            {copied ? (
              <Check aria-hidden className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy aria-hidden className="h-3 w-3" />
            )}
          </button>
        </div>
        <p className="mt-1 break-all font-mono text-[10px] leading-relaxed text-slate-500">
          {configPath}
        </p>
      </div>
    </Card>
  );
}

function AppInfoCard({ appInfo }: { appInfo: AppInfo | null }) {
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
        <HardDrive aria-hidden className="h-4 w-4 text-slate-500" />
        Información de la app
      </h2>
      <dl className="mt-3">
        <InfoRow label="Aplicación" value={appInfo?.name ?? "n8n Studio"} />
        <InfoRow label="Versión" value={appInfo?.version ?? "1.0.0"} />
        <InfoRow label="Tauri" value={appInfo?.tauriVersion ?? "2"} />
        <InfoRow label="Plataforma" value={appInfo ? `${appInfo.os} · ${appInfo.arch}` : "—"} />
        <InfoRow
          label="Modo"
          value={
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px]",
                appInfo?.debug
                  ? "bg-amber-400/10 text-amber-300"
                  : "bg-emerald-400/10 text-emerald-300",
              )}
            >
              {appInfo?.debug ? "Desarrollo" : "Producción"}
            </span>
          }
        />
      </dl>
    </Card>
  );
}

function ActionsCard({ configPath }: { configPath: string }) {
  const resetSettings = useAppStore((state) => state.resetSettings);
  const { open: openN8n, opening } = useOpenN8n();
  const { copied, copy } = useCopy();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    const reset = await resetSettings();
    setResetting(false);
    if (reset) {
      setConfirmReset(false);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-white">Acciones</h2>
      <div className="mt-3 space-y-2">
        <Button
          variant="secondary"
          className="w-full justify-start"
          onClick={() => void openN8n()}
          loading={opening}
        >
          <ExternalLink aria-hidden className="h-4 w-4" />
          Abrir n8n en el navegador
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => void copy(configPath)}
        >
          {copied ? (
            <Check aria-hidden className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy aria-hidden className="h-4 w-4" />
          )}
          Copiar ruta de configuración
        </Button>
      </div>

      <div className="mt-5 border-t border-white/[0.05] pt-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
          Zona sensible
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          Restablece la configuración a los valores por defecto de{" "}
          <code className="font-mono text-slate-400">.env</code> y elimina las credenciales
          guardadas.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {confirmReset ? (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={() => void handleReset()}
                loading={resetting}
              >
                <Trash2 aria-hidden className="h-3.5 w-3.5" />
                Confirmar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmReset(false)}
                disabled={resetting}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
              <RotateCcw aria-hidden className="h-3.5 w-3.5" />
              Restablecer configuración
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function Settings() {
  const settings = useAppStore((state) => state.settings);
  const settingsLoading = useAppStore((state) => state.settingsLoading);
  const settingsError = useAppStore((state) => state.settingsError);
  const refreshSettings = useAppStore((state) => state.refreshSettings);
  const health = useAppStore((state) => state.health);
  const healthChecking = useAppStore((state) => state.healthChecking);
  const appInfo = useAppStore((state) => state.appInfo);

  if (!isDesktop) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <HardDrive aria-hidden className="mt-0.5 h-5 w-5 text-slate-500" />
          <div>
            <h2 className="text-sm font-semibold text-white">Configuración no disponible</h2>
            <p className="mt-1 max-w-lg text-xs leading-relaxed text-slate-400">
              La configuración y las credenciales se administran desde Rust. Abrí la app con{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
                npm run dev:app
              </code>{" "}
              para editarlas.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (settingsLoading && !settings) {
    return (
      <Card className="flex items-center gap-3 p-6 text-sm text-slate-400">
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
        Cargando configuración…
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white">No se pudo cargar la configuración</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {settingsError ?? "Intentá recargar la configuración."}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => void refreshSettings()}
            >
              Reintentar
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const settingsKey = [
    settings.baseUrl,
    settings.username,
    settings.timeoutSecs,
    settings.hasPassword,
  ].join("|");

  return (
    <div className="space-y-6">
      {settingsError ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-[11px] leading-relaxed text-rose-200">
          <AlertCircle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {settingsError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <ConnectionCard
            key={settingsKey}
            settings={settings}
            health={health}
            healthChecking={healthChecking}
          />
          <SecurityCard configPath={settings.configPath} />
        </div>

        <div className="space-y-6">
          <AppInfoCard appInfo={appInfo} />
          <ActionsCard configPath={settings.configPath} />
        </div>
      </div>
    </div>
  );
}
