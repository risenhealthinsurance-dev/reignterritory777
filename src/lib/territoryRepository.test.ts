import { describe, expect, it, vi } from "vitest";
import { createTerritoryRepository } from "./territoryRepository";

describe("territory repository", () => {
  it("loads the organization plan and persists the active plan", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { payload: { plan: null, savedTerritories: [] } }, error: null });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select, upsert }));
    const repository = createTerritoryRepository({ from });
    await expect(repository.load()).resolves.toEqual({ plan: null, savedTerritories: [] });
    const payload = { plan: null, savedTerritories: [] };
    await repository.save(payload);
    expect(from).toHaveBeenCalledWith("territory_plans");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ plan_key: "active", payload }), { onConflict: "organization_id,plan_key" });
  });
});
