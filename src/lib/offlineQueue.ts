export interface OfflineMutation {
  id: string;
  type: string;
  payload: unknown;
  version: number;
}

export type ReplayResult = { status: "applied" | "conflict"; id?: string };

export class OfflineMutationQueue {
  private readonly items: OfflineMutation[] = [];

  enqueue(input: Omit<OfflineMutation, "id"> & { id?: string }) {
    const mutation = { ...input, id: input.id ?? crypto.randomUUID() };
    if (!this.items.some((item) => item.id === mutation.id)) this.items.push(mutation);
    return mutation;
  }

  async replay(apply: (mutation: OfflineMutation) => Promise<ReplayResult>) {
    const results: ReplayResult[] = [];
    for (const mutation of [...this.items]) {
      const result = await apply(mutation);
      const normalized = { ...result, id: result.id || mutation.id };
      results.push(normalized);
      if (result.status === "applied") this.items.splice(this.items.indexOf(mutation), 1);
    }
    return results;
  }
}
