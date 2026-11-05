import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  MonitorUp,
  RefreshCw,
  Settings2,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/cn";
import { isDesktop } from "../lib/n8nClient";
import { MOD_KEY } from "../lib/platform";
import { useAppStore } from "../store/appStore";
import type { View } from "../types";
import StatusBadge from "./StatusBadge";
import ToastViewport from "./ToastViewport";
import { Button } from "./ui/Button";

const NAV_ITEMS: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "home", label: "Resumen", icon: LayoutDashboard },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "settings", label: "Ajustes", icon: Settings2 },
];

const PAGE_META: Record<View, { eyebrow: string; title: string }> = {
  home: { eyebrow: "Panel de control", title: "Resumen" },
  workflows: { eyebrow: "Integración", title: "Workflows" },
  settings: { eyebrow: "Sistema", title: "Ajustes" },
};

const shortcut = (index: number) => `${MOD_KEY}${index + 1}`;

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const view = useAppStore((state) => state.view);
  const setView = useAppStore((state) => state.setView);
  const settings = useAppStore((state) => state.settings);
  const appInfo = useAppStore((state) => state.appInfo);
  const healthChecking = useAppStore((state) => state.healthChecking);
  const checkHealth = useAppStore((state) => state.checkHealth);

  const mainRef = useRef<HTMLElement>(null);
  const meta = PAGE_META[view];

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void checkHealth();
      }
    }, 30_000);

    const onFocus = () => void checkHealth();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [checkHealth]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) {
        return;
      }

      const index = Number.parseInt(event.key, 10) - 1;
      const target = NAV_ITEMS[index];
      if (target) {
        event.preventDefault();
        setView(target.id);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setView]);

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950 text-slate-200">
      <aside className="hidden w-[252px] shrink-0 flex-col border-r border-white/[0.06] bg-ink-900/60 md:flex">
        <div className="px-5 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.svg"
              alt=""
              className="h-9 w-9 rounded-[11px] ring-1 ring-white/10"
            />
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">n8n Studio</p>
              <p className="text-[11px] text-slate-500">Tauri 2 · desktop</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-3" aria-label="Navegación principal">
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const active = view === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                aria-current={active ? "page" : undefined}
                title={`${item.label} (${shortcut(index)})`}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50",
                  active
                    ? "bg-white/[0.06] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                    : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-100",
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-rose-400"
                  />
                ) : null}
                <Icon
                  aria-hidden
                  className={cn(
                    "h-4 w-4 transition",
                    active ? "text-rose-400" : "text-slate-500 group-hover:text-slate-300",
                  )}
                />
                <span className="font-medium">{item.label}</span>
                <span className="ml-auto text-[10px] text-slate-600">{shortcut(index)}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4 border-t border-white/[0.06] p-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <StatusBadge showLatency />
            <p
              className="mt-2 truncate font-mono text-[10px] text-slate-500"
              title={settings?.baseUrl}
            >
              {settings?.baseUrl ?? "Sin configurar"}
            </p>
          </div>
          <p className="px-1 text-[10px] text-slate-600">
            v{appInfo?.version ?? "1.0.0"} · Tauri {appInfo?.tauriVersion ?? "2"}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-ink-950/80 px-4 backdrop-blur md:h-20 md:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 md:hidden">
              <img src="/favicon.svg" alt="" className="h-6 w-6 rounded-md ring-1 ring-white/10" />
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                n8n Studio
              </span>
            </div>
            <p className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 md:block">
              {meta.eyebrow}
            </p>
            <h1 className="truncate text-base font-semibold tracking-tight text-white md:text-xl">
              {meta.title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="md:hidden">
              <StatusBadge />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void checkHealth({ record: true })}
              loading={healthChecking}
              className="text-slate-400"
              title="Verificar la conexión con n8n"
            >
              {!healthChecking ? <RefreshCw aria-hidden className="h-3.5 w-3.5" /> : null}
              <span className="hidden sm:inline">Verificar</span>
            </Button>
            {view !== "settings" ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setView("settings")}
                className="hidden sm:inline-flex"
              >
                <Settings2 aria-hidden className="h-3.5 w-3.5" />
                Ajustes
              </Button>
            ) : null}
          </div>
        </header>

        <nav
          className="flex gap-1 overflow-x-auto border-b border-white/[0.06] bg-ink-950/80 px-3 py-2 md:hidden"
          aria-label="Navegación principal"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  active
                    ? "bg-white/[0.07] text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
                )}
              >
                <Icon aria-hidden className={cn("h-3.5 w-3.5", active && "text-rose-400")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-8 md:py-8">
            {!isDesktop ? (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
                <MonitorUp aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <div className="text-xs leading-relaxed">
                  <p className="font-medium text-amber-200">Modo navegador</p>
                  <p className="mt-0.5 text-amber-200/70">
                    La interfaz está disponible, pero la integración con n8n necesita Tauri. Ejecutá{" "}
                    <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[11px] text-amber-200">
                      npm run dev:app
                    </code>{" "}
                    para abrir la app de escritorio.
                  </p>
                </div>
              </div>
            ) : null}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <ToastViewport />
    </div>
  );
}
