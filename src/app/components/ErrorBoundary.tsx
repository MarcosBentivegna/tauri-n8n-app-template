import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error no controlado en la interfaz", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink-950 p-6 text-slate-200">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300">
              <AlertTriangle aria-hidden className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-lg font-semibold text-white">Algo salió mal</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              La interfaz encontró un error inesperado. Podés recargar la ventana para volver a
              empezar; tu configuración guardada no se modificó.
            </p>
            <pre className="mt-4 max-h-32 overflow-auto rounded-lg border border-white/5 bg-black/30 p-3 font-mono text-[11px] text-rose-200/80">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500 px-4 text-sm font-medium text-white transition hover:bg-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
            >
              Recargar ventana
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
