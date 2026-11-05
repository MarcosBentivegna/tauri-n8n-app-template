import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Gauge,
  Play,
  Server,
  Sparkles,
  Terminal,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/cn";
import { formatDuration, formatRelativeTime } from "../lib/format";
import { useCopy } from "../lib/useCopy";
import { useOpenN8n } from "../lib/useOpenN8n";
import { useAppStore } from "../store/appStore";
import type { HealthStatus } from "../types";
import { ActivityFeed } from "../components/ActivityFeed";
import StatusBadge from "../components/StatusBadge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const STATUS_LABEL: Record<HealthStatus | "unknown" | "checking", string> = {
  online: "En línea",
  auth_required: "Auth pendiente",
  offline: "Fuera de línea",
  unknown: "Sin verificar",
  checking: "Verificando…",
};

const STATUS_TONE: Record<HealthStatus | "unknown" | "checking", string> = {
  online: "text-emerald-300",
  auth_required: "text-amber-300",
  offline: "text-rose-300",
  unknown: "text-slate-300",
  checking: "text-slate-300",
};

const STATUS_DOT: Record<HealthStatus | "unknown" | "checking", string> = {
  online: "bg-emerald-400",
  auth_required: "bg-amber-400",
  offline: "bg-rose-400",
  unknown: "bg-slate-500",
  checking: "bg-slate-400",
};

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "text-white",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
        <Icon aria-hidden className="h-4 w-4 text-slate-600" />
      </div>
      <p className={cn("mt-3 truncate text-2xl font-semibold tracking-tight", tone)}>{value}</p>
      <p className="mt-1 truncate text-[11px] text-slate-500" title={detail}>
        {detail}
      </p>
    </Card>
  );
}

function ConnectionOrb({ status }: { status: HealthStatus | "unknown" | "checking" }) {
  return (
    <div aria-hidden className="relative mx-auto hidden h-52 w-52 shrink-0 lg:block">
      <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
      <div className="absolute inset-6 rounded-full border border-dashed border-white/[0.08]" />
      <div className="absolute inset-14 rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/10 blur-xl" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-ink-900/80 shadow-2xl shadow-black/50">
          <img src="/favicon.svg" alt="" className="h-14 w-14 rounded-xl" />
          <span
            className={cn(
              "absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-ink-900",
              STATUS_DOT[status],
            )}
          />
        </div>
      </div>
      <span className="absolute left-5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-rose-400 shadow-[0_0_14px_rgba(251,113,133,0.9)]" />
      <span className="absolute right-8 top-8 h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
      <span className="absolute bottom-10 right-4 h-1.5 w-1.5 rounded-full bg-sky-400/80" />
    </div>
  );
}

export default function Home() {
  const settings = useAppStore((state) => state.settings);
  const health = useAppStore((state) => state.health);
  const healthChecking = useAppStore((state) => state.healthChecking);
  const activity = useAppStore((state) => state.activity);
  const setView = useAppStore((state) => state.setView);
  const clearActivity = useAppStore((state) => state.clearActivity);
  const { open: openN8n, opening } = useOpenN8n();
  const { copied, copy } = useCopy();

  const status = healthChecking ? "checking" : (health?.status ?? "unknown");
  const statusLabel = STATUS_LABEL[status];

  const statusCopy =
    status === "online"
      ? "Instancia disponible"
      : status === "auth_required"
        ? "Credenciales rechazadas"
        : status === "offline"
          ? "Instancia sin conexión"
          : status === "checking"
            ? "Verificando instancia…"
            : "Instancia sin verificar";

  const detail = health?.message
    ? health.message
    : health
      ? `Verificado ${formatRelativeTime(health.checkedAt)}`
      : settings
        ? `Timeout de ${settings.timeoutSecs}s`
        : "Configurá tu instancia de n8n";

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.055] via-white/[0.02] to-transparent p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-amber-500/[0.06] blur-3xl" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
              <Sparkles aria-hidden className="h-3 w-3 text-rose-300" />
              Tauri 2 · n8n local
            </span>

            <h2 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl">
              Tus automatizaciones,
              <br />
              <span className="text-gradient">a un clic.</span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400">
              Una consola de escritorio rápida y segura para probar webhooks, monitorear tu
              instancia y mantener las credenciales fuera del navegador.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Button variant="primary" onClick={() => setView("workflows")}>
                <Play aria-hidden className="h-4 w-4" />
                Probar un webhook
              </Button>
              <Button variant="secondary" onClick={() => void openN8n()} loading={opening}>
                <ExternalLink aria-hidden className="h-4 w-4" />
                Abrir n8n
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
                {statusCopy}
              </span>
              <span className="text-slate-700">·</span>
              <span>Credenciales guardadas solo en tu equipo</span>
            </div>
          </div>

          <ConnectionOrb status={status} />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Wifi}
          label="Estado de n8n"
          value={statusLabel}
          detail={detail}
          tone={STATUS_TONE[status]}
        />
        <StatCard
          icon={Gauge}
          label="Latencia"
          value={typeof health?.latencyMs === "number" ? formatDuration(health.latencyMs) : "—"}
          detail={
            typeof health?.latencyMs === "number"
              ? `Última medición ${formatRelativeTime(health.checkedAt)}`
              : health
                ? "No se pudo medir"
                : "Sin medir"
          }
        />
        <StatCard
          icon={Server}
          label="Versión de n8n"
          value={health?.version ?? "—"}
          detail={settings?.baseUrl ?? "Configurá tu instancia"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Actividad reciente</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Ejecuciones y verificaciones guardadas en este equipo
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge showLatency />
              {activity.length > 0 ? (
                <button
                  type="button"
                  onClick={() => clearActivity()}
                  className="rounded-md px-1.5 py-1 text-[10px] text-slate-500 transition hover:bg-white/5 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
                >
                  Limpiar
                </button>
              ) : null}
            </div>
          </div>

          <ActivityFeed limit={6} />

          <button
            type="button"
            onClick={() => setView("workflows")}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] py-2 text-[11px] font-medium text-slate-400 transition hover:border-white/10 hover:bg-white/[0.03] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
          >
            Ver historial completo
            <ArrowRight aria-hidden className="h-3 w-3" />
          </button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Terminal aria-hidden className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-white">Primeros pasos</h2>
          </div>

          <ol className="mt-4 space-y-4">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-[10px] font-semibold text-slate-400">
                1
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200">Levantá n8n con Docker</p>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-1.5">
                  <code className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-400">
                    docker compose up -d
                  </code>
                  <button
                    type="button"
                    onClick={() => void copy("docker compose up -d")}
                    aria-label="Copiar comando"
                    className="rounded p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
                  >
                    {copied ? (
                      <Check aria-hidden className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy aria-hidden className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-[10px] font-semibold text-slate-400">
                2
              </span>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-200">Conectá tu instancia</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  Definí la URL, el usuario y el timeout de red.
                </p>
                <button
                  type="button"
                  onClick={() => setView("settings")}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-rose-300 transition hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
                >
                  Ir a ajustes
                  <ArrowRight aria-hidden className="h-3 w-3" />
                </button>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-[10px] font-semibold text-slate-400">
                3
              </span>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-200">Ejecutá tu primer webhook</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  Usá los presets de echo y sync-contacts incluidos.
                </p>
                <button
                  type="button"
                  onClick={() => setView("workflows")}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-rose-300 transition hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
                >
                  Abrir workflows
                  <ArrowRight aria-hidden className="h-3 w-3" />
                </button>
              </div>
            </li>
          </ol>

          <div className="mt-5 flex flex-wrap gap-1.5 border-t border-white/[0.05] pt-4">
            {["Tauri 2", "React 19", "Rust", "Tailwind 4"].map((tech) => (
              <span
                key={tech}
                className="rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[10px] text-slate-500"
              >
                {tech}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
