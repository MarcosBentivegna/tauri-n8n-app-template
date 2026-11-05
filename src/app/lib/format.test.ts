import { describe, expect, it } from "vitest";
import { formatClockTime, formatDuration, formatRelativeTime, truncate } from "./format";

describe("formatDuration", () => {
  it("formats sub-second durations in milliseconds", () => {
    expect(formatDuration(0)).toBe("0 ms");
    expect(formatDuration(248.4)).toBe("248 ms");
  });

  it("formats longer durations in seconds", () => {
    expect(formatDuration(1_250)).toBe("1.3 s");
    expect(formatDuration(12_400)).toBe("12 s");
  });

  it("handles invalid values", () => {
    expect(formatDuration(-1)).toBe("—");
    expect(formatDuration(Number.NaN)).toBe("—");
  });
});

describe("formatRelativeTime", () => {
  const now = Date.parse("2026-01-01T12:00:00.000Z");

  it("uses recent buckets", () => {
    expect(formatRelativeTime("2026-01-01T11:59:55.000Z", now)).toBe("ahora");
    expect(formatRelativeTime("2026-01-01T11:59:30.000Z", now)).toBe("hace 30 s");
    expect(formatRelativeTime("2026-01-01T11:45:00.000Z", now)).toBe("hace 15 min");
    expect(formatRelativeTime("2026-01-01T09:00:00.000Z", now)).toBe("hace 3 h");
    expect(formatRelativeTime("2025-12-30T12:00:00.000Z", now)).toBe("hace 2 d");
  });

  it("accepts epoch milliseconds", () => {
    expect(formatRelativeTime(now - 30_000, now)).toBe("hace 30 s");
  });

  it("handles invalid input", () => {
    expect(formatRelativeTime("not-a-date", now)).toBe("—");
  });
});

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("hola", 10)).toBe("hola");
  });

  it("adds an ellipsis when truncating", () => {
    expect(truncate("abcdefghij", 5)).toBe("abcd…");
  });
});

describe("formatClockTime", () => {
  it("returns a placeholder for invalid dates", () => {
    expect(formatClockTime("nope")).toBe("—");
  });
});
