import { describe, expect, it, vi } from "vitest";
import { FunctionError } from "../_shared/errors";
import { requireActor } from "../_shared/auth";

function request(token?: string) {
  return new Request("https://functions.test/field-ai", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

describe("requireActor", () => {
  it("rejects a missing bearer token before querying membership", async () => {
    const client = {
      getUser: vi.fn(),
      findMembership: vi.fn(),
      findRep: vi.fn(),
    };

    await expect(requireActor(request(), client)).rejects.toMatchObject<FunctionError>({
      status: 401,
      code: "unauthorized",
    });
    expect(client.getUser).not.toHaveBeenCalled();
  });

  it("derives organization and rep identity from the authenticated membership", async () => {
    const client = {
      getUser: vi.fn().mockResolvedValue({ id: "user-a" }),
      findMembership: vi.fn().mockResolvedValue({ organizationId: "org-a" }),
      findRep: vi.fn().mockResolvedValue({ id: "rep-a" }),
    };

    await expect(requireActor(request("valid-token"), client)).resolves.toEqual({
      userId: "user-a",
      organizationId: "org-a",
      repId: "rep-a",
    });
    expect(client.findMembership).toHaveBeenCalledWith("user-a");
    expect(client.findRep).toHaveBeenCalledWith("org-a", "user-a");
  });

  it("rejects a valid user without an organization membership", async () => {
    const client = {
      getUser: vi.fn().mockResolvedValue({ id: "foreign-user" }),
      findMembership: vi.fn().mockResolvedValue(null),
      findRep: vi.fn(),
    };

    await expect(requireActor(request("foreign-token"), client)).rejects.toMatchObject({
      status: 403,
      code: "membership_required",
    });
    expect(client.findRep).not.toHaveBeenCalled();
  });
});
