import { describe, expect, it } from "vitest";
import { isValidHttpUrl, normalizeBaseUrl, parseJson, prettyJson } from "./validation";

describe("normalizeBaseUrl", () => {
  it("trims whitespace and trailing slashes", () => {
    expect(normalizeBaseUrl("  http://localhost:5678/// ")).toBe("http://localhost:5678");
  });
});

describe("isValidHttpUrl", () => {
  it("accepts http and https URLs", () => {
    expect(isValidHttpUrl("http://localhost:5678")).toBe(true);
    expect(isValidHttpUrl("https://n8n.example.com")).toBe(true);
  });

  it("rejects unsafe or malformed URLs", () => {
    expect(isValidHttpUrl("ftp://localhost")).toBe(false);
    expect(isValidHttpUrl("localhost:5678")).toBe(false);
    expect(isValidHttpUrl("http://user:pass@localhost:5678")).toBe(false);
  });
});

describe("parseJson", () => {
  it("parses valid JSON", () => {
    const result = parseJson('{"ok":true}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ ok: true });
    }
  });

  it("reports empty and invalid payloads", () => {
    expect(parseJson("  ").ok).toBe(false);
    expect(parseJson("{oops}").ok).toBe(false);
  });
});

describe("prettyJson", () => {
  it("pretty prints JSON", () => {
    expect(prettyJson({ a: 1 })).toBe('{\n  "a": 1\n}');
  });
});
