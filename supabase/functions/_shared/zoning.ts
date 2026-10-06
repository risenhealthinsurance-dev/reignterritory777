export type ZoningClassification =
  | "business_priority"
  | "business_permitted_mixed"
  | "conditional_verify"
  | "residential_non_target";

export interface ZoningOverlap {
  code?: string | null;
  description?: string | null;
}

function classifyOne(overlap: ZoningOverlap): ZoningClassification {
  const code = (overlap.code ?? "").trim().toUpperCase();
  const description = (overlap.description ?? "").trim().toLowerCase();
  if (/mixed|mixed.use/.test(`${code} ${description}`) || /^MU/.test(code)) {
    return "business_permitted_mixed";
  }
  if (/planned|conditional|special|pud/.test(`${code} ${description}`)) {
    return "conditional_verify";
  }
  if (
    /commercial|industrial|business|office/.test(description) ||
    /^(C|I|IND|B|O)[-\d]/.test(code)
  ) {
    return "business_priority";
  }
  if (/residential|agricultural|conservation/.test(description) || /^(R|AG|CON)/.test(code)) {
    return "residential_non_target";
  }
  return "conditional_verify";
}

export function classifyZoning(overlaps: ZoningOverlap[]): ZoningClassification {
  if (overlaps.length === 0) return "residential_non_target";
  const classifications = new Set(overlaps.map(classifyOne));
  if (classifications.size > 1) return "conditional_verify";
  return classifications.values().next().value ?? "conditional_verify";
}
