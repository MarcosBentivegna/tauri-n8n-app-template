import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";
import { formatDuration, formatRelativeTime } from "../lib/format";
import { isDesktop } from "../lib/n8nClient";
import { useAppStore } from "../store/appStore";

const STATUS_META = {
  online: {
    label: "Conectado",
    dot: "bg-emerald-400",
    ring: "bg-emerald-400/30",
    className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  },
  auth_required: {
    label: "Credenciales",
    dot: "bg-amber-400",
    ring: "bg-amber-400/30",
    className: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  },
  offline: {
    label: "Sin conexión",
    dot: "bg-rose-400",
    ring: "bg-rose-400/30",
    className: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  },
  unknown: {
    label: "Sin verificar",
    dot: "bg-slate-500",
    ring: "bg-slate-500/20",
    className: "border-white/10 bg-white/[0.04] text-slate-400",
  },
  checking: {
    label: "Verificando",
    dot: "bg-slate-400",
    ring: "bg-slate-400/20",
    className: "border-white/10 bg-white/[0.04] text-slate-300",
  },
} as const;

interface StatusBadgeProps {
  showLatency?: boolean;
  className?: string;
}

export default function StatusBadge({ showLatency = false, className }: StatusBadgeProps) {
  const health = useAppStore((state) => state.health);
  const healthChecking = useAppStore((state) => state.healthChecking);
  const checkHealth = useAppStore((state) => state.checkHealth);

  const status = healthChecking ? "checking" : (health?.status ?? "unknown");
  const meta = STATUS_META[status];

  const title = health?.message
    ? health.message
    : health
      ? `Última verificación ${formatRelativeTime(health.checkedAt)}`
      : "Todavía no se verificó la conexión";

  return (
    <button
      type="button"
      onClick={() => void checkHealth({ record: true })}
      disabled={!isDesktop || healthChecking}
      title={title}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 disabled:cursor-default",
        meta.className,
        className,
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {status === "online" ? (
          <span
            aria-hidden
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full",
              meta.ring,
            )}
          />
        ) : null}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", meta.dot)} />
      </span>
      {status === "checking" ? <Loader2 aria-hidden className="h-3 w-3 animate-spin" /> : null}
      <span>{meta.label}</span>
      {showLatency && status === "online" && typeof health?.latencyMs === "number" ? (
        <span className="text-emerald-200/60">{formatDuration(health.latencyMs)}</span>
      ) : null}
    </button>
  );
}
