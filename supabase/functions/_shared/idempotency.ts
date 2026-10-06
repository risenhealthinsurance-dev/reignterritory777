export interface IdempotencyStore<T> {
  get(organizationId: string, key: string): Promise<T | null>;
  put(organizationId: string, key: string, value: T): Promise<void>;
}

export async function withIdempotency<T>(
  store: IdempotencyStore<T>,
  organizationId: string,
  key: string,
  operation: () => Promise<T>,
) {
  const existing = await store.get(organizationId, key);
  if (existing) return existing;
  const result = await operation();
  await store.put(organizationId, key, result);
  return result;
}
