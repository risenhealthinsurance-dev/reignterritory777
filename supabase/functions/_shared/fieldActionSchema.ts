export const APPROVED_FIELD_ACTION_TYPES = [
  "save_visit_note",
  "record_disposition",
  "schedule_follow_up",
] as const;

export type ApprovedFieldActionType = (typeof APPROVED_FIELD_ACTION_TYPES)[number];

export interface ValidatedFieldAction {
  id: string;
  type: ApprovedFieldActionType;
  status: "queued" | "confirmed";
  accountId: string;
  payload: Record<string, unknown>;
  sourceMessageId: string;
  createdAt: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateFieldAction(input: unknown): ValidatedFieldAction {
  if (!input || typeof input !== "object") throw new Error("Action is required.");
  const action = input as Record<string, unknown>;
  if (typeof action.id !== "string" || !action.id.trim()) throw new Error("Action id is required.");
  if (!APPROVED_FIELD_ACTION_TYPES.includes(action.type as ApprovedFieldActionType)) throw new Error("Unsupported field action type.");
  if (action.status !== "queued" && action.status !== "confirmed") throw new Error("Action status must be queued or confirmed.");
  if (typeof action.accountId !== "string" || !UUID_PATTERN.test(action.accountId)) throw new Error("Action accountId must be a live business UUID.");
  if (!action.payload || typeof action.payload !== "object" || Array.isArray(action.payload)) throw new Error("Action payload must be an object.");
  if (typeof action.sourceMessageId !== "string" || !action.sourceMessageId.trim()) throw new Error("Action sourceMessageId is required.");
  if (typeof action.createdAt !== "string" || !action.createdAt.trim()) throw new Error("Action createdAt is required.");
  return {
    id: action.id,
    type: action.type as ApprovedFieldActionType,
    status: action.status,
    accountId: action.accountId,
    payload: action.payload as Record<string, unknown>,
    sourceMessageId: action.sourceMessageId,
    createdAt: action.createdAt,
  };
}
