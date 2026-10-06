import { describe, expect, it, vi } from "vitest";
import { withIdempotency } from "../_shared/idempotency";

describe("withIdempotency", () => {
  it("returns a stored result without executing the operation again", async () => {
    const store = {
      get: vi.fn().mockResolvedValue({ id: "existing" }),
      put: vi.fn(),
    };
    const operation = vi.fn();

    await expect(withIdempotency(store, "org-a", "request-1", operation)).resolves.toEqual({
      id: "existing",
    });
    expect(operation).not.toHaveBeenCalled();
    expect(store.put).not.toHaveBeenCalled();
  });

  it("stores the first successful operation result under the tenant-scoped key", async () => {
    const store = { get: vi.fn().mockResolvedValue(null), put: vi.fn() };
    const operation = vi.fn().mockResolvedValue({ id: "created" });

    await expect(withIdempotency(store, "org-a", "request-2", operation)).resolves.toEqual({
      id: "created",
    });
    expect(store.put).toHaveBeenCalledWith("org-a", "request-2", { id: "created" });
  });
});
