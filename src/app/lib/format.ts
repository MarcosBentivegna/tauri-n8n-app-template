/**
 * Formats a duration in milliseconds for display in the UI.
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    return "—";
  }

  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }

  const seconds = ms / 1000;
  return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
}

/**
 * Returns a compact, human readable relative time in Spanish.
 */
export function formatRelativeTime(isoDate: string, now: number = Date.now()): string {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) {
    return "—";
  }

  const diff = Math.max(0, now - timestamp);
  if (diff < 10_000) return "ahora";
  if (diff < 60_000) return `hace ${Math.floor(diff / 1000)} s`;
  if (diff < 3_600_000) return `hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `hace ${Math.floor(diff / 3_600_000)} h`;
  return `hace ${Math.floor(diff / 86_400_000)} d`;
}

/**
 * Formats a timestamp as a short local clock time.
 */
export function formatClockTime(isoDate: string): string {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) {
    return "—";
  }

  return new Date(timestamp).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Truncates long strings while preserving a readable preview.
 */
export function truncate(value: string, maxLength = 120): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
