import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "../lib/cn";
import { useAppStore } from "../store/appStore";
import type { NotificationType } from "../types";

const TOAST_META: Record<
  NotificationType,
  { icon: typeof CheckCircle2; iconClass: string; barClass: string }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
    barClass: "bg-emerald-400",
  },
  error: {
    icon: AlertCircle,
    iconClass: "text-rose-400",
    barClass: "bg-rose-400",
  },
  info: {
    icon: Info,
    iconClass: "text-sky-400",
    barClass: "bg-sky-400",
  },
};

export default function ToastViewport() {
  const notifications = useAppStore((state) => state.notifications);
  const dismissNotification = useAppStore((state) => state.dismissNotification);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[min(380px,calc(100vw-2.5rem))] flex-col gap-2">
      <AnimatePresence initial={false}>
        {notifications.map((notification) => {
          const meta = TOAST_META[notification.type];
          const Icon = meta.icon;

          return (
            <motion.div
              key={notification.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pointer-events-auto relative overflow-hidden rounded-xl border border-white/10 bg-ink-800/95 p-3.5 shadow-2xl shadow-black/40 backdrop-blur"
              role="status"
            >
              <div className="flex items-start gap-3">
                <Icon aria-hidden className={cn("mt-0.5 h-4 w-4 shrink-0", meta.iconClass)} />
                <p className="flex-1 text-xs leading-relaxed text-slate-200">
                  {notification.message}
                </p>
                <button
                  type="button"
                  onClick={() => dismissNotification(notification.id)}
                  aria-label="Cerrar notificación"
                  className="rounded-md p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
                >
                  <X aria-hidden className="h-3.5 w-3.5" />
                </button>
              </div>
              <span
                aria-hidden
                className={cn("absolute inset-x-0 bottom-0 h-px opacity-60", meta.barClass)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
