export class FunctionError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryAfter?: string,
  ) {
    super(message);
    this.name = "FunctionError";
  }
}

export function classifySourceError(cause: unknown) {
  if (cause instanceof FunctionError) return cause.code;
  if (cause && typeof cause === "object" && "code" in cause && typeof cause.code === "string") {
    return cause.code;
  }
  return "unavailable";
}
