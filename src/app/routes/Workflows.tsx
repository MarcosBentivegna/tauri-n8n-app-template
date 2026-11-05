import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  Play,
  RotateCcw,
  Terminal,
  Trash2,
  Workflow,
} from "lucide-react";
import { ActivityFeed } from "../components/ActivityFeed";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { cn } from "../lib/cn";
import { formatDuration } from "../lib/format";
import { MOD_ENTER } from "../lib/platform";
import { useCopy } from "../lib/useCopy";
import { useOpenN8n } from "../lib/useOpenN8n";
import { parseJson, prettyJson } from "../lib/validation";
import { useAppStore } from "../store/appStore";
import type { WebhookResponse } from "../types";

type PresetId = "echo" | "sync";

const PRESETS: Record<PresetId, { label: string; path: string; description: string }> = {
  echo: {
    label: "Echo",
    path: "echo",
    description: "Devuelve el JSON recibido. Ideal para validar la conectividad.",
  },
  sync: {
    label: "Sync contacts",
    path: "sync-contacts",
    description: "Simula una sincronización de altas, bajas y actualizaciones.",
  },
};

function buildPayload(preset: PresetId): string {
  if (preset === "echo") {
    return JSON.stringify(
      {
        message: "Hola desde n8n Studio",
        source: "tauri-desktop",
        sentAt: new Date().toISOString(),
      },
      null,
      2,
    );
  }

  return JSON.stringify(
    {
      altas: [
        {
          id: "demo-1",
          nombre: "Ana Pérez",
          email: "ana@example.com",
          telefono: "+54 11 5555-1234",
        },
      ],
      bajas: ["demo-0"],
      updates: [
        {
          id: "demo-2",
          nombre: "Bruno Díaz",
          email: "bruno@example.com",
          telefono: "+54 11 5555-9876",
        },
      ],
    },
    null,
    2,
  );
}

function StatusPill({ response }: { response: WebhookResponse }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        response.ok
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : "border-rose-400/20 bg-rose-400/10 text-rose-300",
      )}
    >
      {response.ok ? (
        <CheckCircle2 aria-hidden className="h-3 w-3" />
      ) : (
        <AlertCircle aria-hidden className="h-3 w-3" />
      )}
      HTTP {response.status}
    </span>
  );
}

export default function Workflows() {
  const runWebhook = useAppStore((state) => state.runWebhook);
  const notify = useAppStore((state) => state.notify);
  const activity = useAppStore((state) => state.activity);
  const clearActivity = useAppStore((state) => state.clearActivity);
  const { open: openN8n, opening } = useOpenN8n();
  const { copied, copy } = useCopy();

  const [preset, setPreset] = useState<PresetId>("echo");
  const [path, setPath] = useState(PRESETS.echo.path);
  const [payloadText, setPayloadText] = useState(() => buildPayload("echo"));
  const [response, setResponse] = useState<WebhookResponse | null>(null);
  const [running, setRunning] = useState(false);

  const validation = useMemo(() => parseJson(payloadText), [payloadText]);
  const pathValid = path.trim().length > 0 && !/\s/.test(path.trim());
  const canRun = validation.ok && pathValid && !running;
  const hasHistory = activity.some((entry) => entry.kind === "echo" || entry.kind === "sync");

  const selectPreset = (next: PresetId) => {
    setPreset(next);
    setPath(PRESETS[next].path);
    setPayloadText(buildPayload(next));
    setResponse(null);
  };

  const handleRun = async () => {
    if (!validation.ok) {
      notify(validation.error, "error");
      return;
    }

    if (!pathValid) {
      notify("Ingresá una ruta de webhook válida, sin espacios.", "error");
      return;
    }

    setRunning(true);
    const result = await runWebhook(preset, path.trim(), validation.value);
    if (result) {
      setResponse(result);
    }
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Ejecutá y verificá webhooks
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
            Enviá un payload a tu instancia local y revisá la respuesta sin salir de la app. Los
            presets están listos para usar con los workflows de ejemplo.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void openN8n()} loading={opening}>
          <ExternalLink aria-hidden className="h-4 w-4" />
          Abrir n8n
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Solicitud</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">{PRESETS[preset].description}</p>
            </div>
            <div className="inline-flex rounded-xl border border-white/[0.07] bg-black/20 p-1">
              {(Object.keys(PRESETS) as PresetId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectPreset(id)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50",
                    preset === id
                      ? "bg-white/[0.08] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-200",
                  )}
                >
                  {PRESETS[id].label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="webhook-path"
              className="mb-1.5 block text-[11px] font-medium text-slate-400"
            >
              Ruta del webhook
            </label>
            <div className="flex items-center gap-2">
              <input
                id="webhook-path"
                value={path}
                onChange={(event) => setPath(event.target.value)}
                spellCheck={false}
                placeholder="echo"
                className="h-9 w-full rounded-lg border border-white/10 bg-black/25 px-3 font-mono text-xs text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-rose-400/40 focus:ring-2 focus:ring-rose-400/20"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-600">
              Acepta <code className="font-mono text-slate-500">echo</code> o{" "}
              <code className="font-mono text-slate-500">webhook/echo</code>. Se usa la URL base
              configurada.
            </p>
          </div>

          <div className="mt-4 flex flex-1 flex-col">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label htmlFor="webhook-payload" className="text-[11px] font-medium text-slate-400">
                Payload JSON
              </label>
              {validation.ok ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                  <CheckCircle2 aria-hidden className="h-3 w-3" />
                  JSON válido
                </span>
              ) : (
                <span className="inline-flex max-w-[60%] items-center gap-1 truncate text-[10px] font-medium text-rose-400">
                  <AlertCircle aria-hidden className="h-3 w-3 shrink-0" />
                  {validation.error}
                </span>
              )}
            </div>

            <textarea
              id="webhook-payload"
              value={payloadText}
              onChange={(event) => setPayloadText(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void handleRun();
                }
              }}
              aria-invalid={!validation.ok}
              spellCheck={false}
              className={cn(
                "min-h-[180px] flex-1 resize-y rounded-xl border bg-black/25 p-3 font-mono text-[11px] leading-relaxed text-slate-300 outline-none transition placeholder:text-slate-600 focus:ring-2",
                validation.ok
                  ? "border-white/10 focus:border-rose-400/40 focus:ring-rose-400/20"
                  : "border-rose-400/30 focus:border-rose-400/50 focus:ring-rose-400/20",
              )}
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[10px] text-slate-600">
                {payloadText.length.toLocaleString("es-AR")} caracteres · {MOD_ENTER} para ejecutar
              </span>
              <button
                type="button"
                onClick={() => {
                  setPayloadText(buildPayload(preset));
                  setResponse(null);
                }}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-slate-500 transition hover:bg-white/5 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
              >
                <RotateCcw aria-hidden className="h-3 w-3" />
                Restaurar preset
              </button>
            </div>
          </div>

          <Button
            variant="primary"
            className="mt-4 w-full"
            onClick={() => void handleRun()}
            loading={running}
            disabled={!canRun}
          >
            {!running ? <Play aria-hidden className="h-4 w-4" /> : null}
            Ejecutar webhook
          </Button>
        </Card>

        <Card className="flex flex-col p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Respuesta</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                El body se muestra tal como lo devolvió n8n.
              </p>
            </div>
            {response ? (
              <button
                type="button"
                onClick={() => void copy(prettyJson(response.body))}
                aria-label="Copiar respuesta"
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-slate-500 transition hover:bg-white/5 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
              >
                {copied ? (
                  <Check aria-hidden className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy aria-hidden className="h-3 w-3" />
                )}
                {copied ? "Copiado" : "Copiar"}
              </button>
            ) : null}
          </div>

          {response ? (
            <div className="mt-4 flex flex-1 flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill response={response} />
                <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-400">
                  {formatDuration(response.durationMs)}
                </span>
                <span
                  className="min-w-0 truncate font-mono text-[10px] text-slate-600"
                  title={response.url}
                >
                  {response.url}
                </span>
              </div>

              <pre className="mt-3 max-h-[420px] flex-1 overflow-auto rounded-xl border border-white/[0.06] bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
                {prettyJson(response.body)}
              </pre>

              {!response.ok ? (
                <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-rose-300/80">
                  <AlertCircle aria-hidden className="mt-0.5 h-3 w-3 shrink-0" />
                  n8n respondió con un status que no es 2xx. Revisá que el workflow esté activo y
                  que la ruta coincida.
                </p>
              ) : null}
            </div>
          ) : (
            <EmptyState
              icon={Terminal}
              title="Todavía no hay respuesta"
              description={
                running
                  ? "Ejecutando el webhook…"
                  : "Elegí un preset, ajustá el payload y ejecutá para ver el resultado acá."
              }
              className="mt-4 flex-1"
            />
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Historial de ejecuciones</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Se guarda localmente, junto con la duración y el status de cada llamada.
            </p>
          </div>
          {hasHistory ? (
            <Button variant="ghost" size="sm" onClick={() => clearActivity(["echo", "sync"])}>
              <Trash2 aria-hidden className="h-3.5 w-3.5" />
              Limpiar
            </Button>
          ) : null}
        </div>
        <div className="mt-4">
          <ActivityFeed
            limit={10}
            kinds={["echo", "sync"]}
            emptyTitle="Sin ejecuciones todavía"
            emptyDescription="Cuando ejecutes un webhook, el resultado va a aparecer en este historial."
          />
        </div>
      </Card>

      <details className="group rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-sm font-medium text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <Workflow aria-hidden className="h-4 w-4 text-slate-500" />
            Cómo preparar los workflows en n8n
          </span>
          <ChevronDown
            aria-hidden
            className="h-4 w-4 text-slate-500 transition group-open:rotate-180"
          />
        </summary>

        <div className="border-t border-white/[0.06] p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-200">Webhook echo</p>
                <code className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                  POST /webhook/echo
                </code>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                Respondé con el JSON recibido para validar que la app y n8n se comunican.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-200">Sync contacts</p>
                <code className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                  POST /webhook/sync-contacts
                </code>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                Procesá altas, bajas y updates. El preset ya incluye datos de ejemplo.
              </p>
            </div>
          </div>

          <ol className="mt-4 list-decimal space-y-1.5 pl-4 text-[11px] leading-relaxed text-slate-500">
            <li>
              Creá un workflow en n8n y agregá un nodo{" "}
              <strong className="text-slate-300">Webhook</strong> con método POST y la ruta
              indicada.
            </li>
            <li>
              Conectá un nodo <strong className="text-slate-300">Respond to Webhook</strong> que
              devuelva el JSON (por ejemplo{" "}
              <code className="font-mono text-slate-400">{"{{ $json }}"}</code>).
            </li>
            <li>
              Activá el workflow. La app usa la URL base de Ajustes, así que no hace falta tocar
              código.
            </li>
          </ol>
        </div>
      </details>
    </div>
  );
}
