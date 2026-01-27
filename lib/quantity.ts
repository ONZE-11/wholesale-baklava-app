export type MultipleMode = "none" | "floor" | "ceil" | "nearest";

export type QuantityRules = {
  min: number;
  step: number;
  multipleOf: number | null;
  mode: MultipleMode;
};

export function normalize(value: unknown, rules: QuantityRules) {
  const min = Math.max(1, Math.floor(rules.min || 1));
  const step = Math.max(1, Math.floor(rules.step || 1));
  const multipleOf = rules.multipleOf ? Math.max(1, Math.floor(rules.multipleOf)) : null;
  const mode: MultipleMode = rules.mode ?? (multipleOf ? "ceil" : "none");

  let v = Number(value);
  if (!Number.isFinite(v)) return min;

  v = Math.floor(v);
  if (v < min) v = min;

  if (multipleOf && mode !== "none") {
    const q = v / multipleOf;
    if (mode === "ceil") v = Math.ceil(q) * multipleOf;
    else if (mode === "floor") v = Math.floor(q) * multipleOf;
    else v = Math.round(q) * multipleOf;

    if (v < min) v = min;
  }

  return v;
}

export function parseRaw(raw: string, rules: QuantityRules) {
  const cleaned = (raw ?? "").replace(/[^\d]/g, "");
  return normalize(cleaned ? Number(cleaned) : NaN, rules);
}
