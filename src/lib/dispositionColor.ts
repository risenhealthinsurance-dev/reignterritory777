export type DispositionColor = "red" | "green" | "yellow" | "blue" | "gray";

export function dispositionColor(outcome: string | null | undefined): DispositionColor {
  const value = outcome?.trim().toLowerCase() ?? "";
  if (["not interested", "lost", "deal lost", "no longer pursuing"].includes(value)) return "red";
  if (["connected", "qualified", "won", "closed won"].includes(value)) return "green";
  if (["callback requested", "no answer", "follow-up required"].includes(value)) return "yellow";
  if (["discovery", "proposal", "negotiation", "active opportunity"].includes(value)) return "blue";
  return "gray";
}

export function dispositionColorLabel(color: DispositionColor) {
  return {
    red: "Lost or not progressing",
    green: "Connected or qualified",
    yellow: "Follow-up needed",
    blue: "Active opportunity",
    gray: "No disposition recorded",
  }[color];
}
