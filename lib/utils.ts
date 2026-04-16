export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function roundNumber(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

export function averageNumber(values: Array<number | null | undefined>) {
  const valid = values.filter(
    (value): value is number => typeof value === "number" && !Number.isNaN(value)
  );

  if (!valid.length) return null;

  const total = valid.reduce((sum, value) => sum + value, 0);
  return roundNumber(total / valid.length, 2);
}

export function asNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;

  if (typeof value !== "string") return null;

  const cleaned = value.trim().replace(/,/g, "");
  if (!cleaned) return null;

  const matched = cleaned.match(/-?\d+(\.\d+)?/);
  if (!matched) return null;

  const parsed = Number(matched[0]);
  return Number.isNaN(parsed) ? null : parsed;
}

export function scoreFromMixed(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number" && !Number.isNaN(value)) {
    if (value >= 0 && value <= 1) return clamp(roundNumber(value * 100, 2));
    if (value > 1 && value <= 5) return clamp(roundNumber((value / 5) * 100, 2));
    if (value > 5 && value <= 10) return clamp(roundNumber((value / 10) * 100, 2));
    return clamp(roundNumber(value, 2));
  }

  if (typeof value !== "string") return null;

  const text = value.trim().toLowerCase();
  if (!text) return null;

  if (text.includes("%")) {
    const percent = asNumber(text);
    return percent === null ? null : clamp(roundNumber(percent, 2));
  }

  const numeric = asNumber(text);
  if (numeric !== null) {
    if (numeric >= 0 && numeric <= 1) return clamp(roundNumber(numeric * 100, 2));
    if (numeric > 1 && numeric <= 5) return clamp(roundNumber((numeric / 5) * 100, 2));
    if (numeric > 5 && numeric <= 10) return clamp(roundNumber((numeric / 10) * 100, 2));
    return clamp(roundNumber(numeric, 2));
  }

  const high = [
    "yes",
    "available",
    "good",
    "reliable",
    "functional",
    "regular",
    "paved",
    "safe",
    "connected",
    "full",
    "adequate",
  ];

  const medium = [
    "partial",
    "shared",
    "fair",
    "moderate",
    "intermittent",
    "sometimes",
    "limited",
    "mixed",
  ];

  const low = [
    "no",
    "poor",
    "bad",
    "unsafe",
    "broken",
    "unavailable",
    "none",
    "open",
    "kutcha",
    "unpaved",
  ];

  if (high.some((item) => text.includes(item))) return 90;
  if (medium.some((item) => text.includes(item))) return 60;
  if (low.some((item) => text.includes(item))) return 25;

  return null;
}

export function severityBand(score: number) {
  if (score >= 65) return "critical";
  if (score >= 45) return "high";
  if (score >= 25) return "moderate";
  return "stable";
}

export function toPlainJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unknown server error";
}