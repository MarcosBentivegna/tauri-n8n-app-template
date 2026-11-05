export function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.length > 0 &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export type JsonParseResult = { ok: true; value: unknown } | { ok: false; error: string };

export function parseJson(value: string): JsonParseResult {
  if (!value.trim()) {
    return { ok: false, error: "El payload no puede estar vacío." };
  }

  try {
    return { ok: true, value: JSON.parse(value) as unknown };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof SyntaxError ? error.message : "JSON inválido.",
    };
  }
}

export function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? "null";
  } catch {
    return String(value);
  }
}
