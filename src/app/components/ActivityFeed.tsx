import { CheckCircle2, CircleSlash2, Users, Wifi, XCircle, Zap } from "lucide-react";
import { cn } from "../lib/cn";
import { formatDuration, formatRelativeTime } from "../lib/format";
import { useAppStore } from "../store/appStore";
import type { ActivityKind } from "../types";
import { EmptyState } from "./ui/EmptyState";

const KIND_META: Record<ActivityKind, { icon: typeof Zap; className: string; label: string }> = {
  echo: {
    icon: Zap,
    className: "bg-rose-400/10 text-rose-300",
    label: "Echo",
  },
  sync: {
    icon: Users,
    className: "bg-amber-400/10 text-amber-300",
    label: "Sync",
  },
  connection: {
    icon: Wifi,
    className: "bg-sky-400/10 text-sky-300",
    label: "Conexión",
  },
};

interface ActivityFeedProps {
  limit?: number;
  kinds?: ActivityKind[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ActivityFeed({
  limit = 8,
  kinds,
  emptyTitle = "Todavía no hay actividad",
  emptyDescription = "Ejecutá un webhook o verificá la conexión para ver resultados acá.",
}: ActivityFeedProps) {
  const activity = useAppStore((state) => state.activity);

  const filtered = (
    kinds ? activity.filter((entry) => kinds.includes(entry.kind)) : activity
  ).slice(0, limit);

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={CircleSlash2}
        title={emptyTitle}
        description={emptyDescription}
        className="border-0 bg-white/[0.015]"
      />
    );
  }

  return (
    <ol className="divide-y divide-white/[0.05]">
      {filtered.map((entry) => {
        const meta = KIND_META[entry.kind];
        const Icon = meta.icon;

        return (
          <li key={entry.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                meta.className,
              )}
            >
              <Icon aria-hidden className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-xs font-medium text-slate-200">{entry.label}</p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    entry.ok
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-rose-400/10 text-rose-300",
                  )}
                >
                  {entry.ok ? (
                    <CheckCircle2 aria-hidden className="h-2.5 w-2.5" />
                  ) : (
                    <XCircle aria-hidden className="h-2.5 w-2.5" />
                  )}
                  {entry.status ? `HTTP ${entry.status}` : entry.ok ? "OK" : "Error"}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                {meta.label}
                {entry.detail ? ` · ${entry.detail}` : ""}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-slate-500">{formatRelativeTime(entry.at)}</p>
              {typeof entry.durationMs === "number" ? (
                <p className="text-[10px] text-slate-600">{formatDuration(entry.durationMs)}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
