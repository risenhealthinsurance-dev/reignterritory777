import { describe, expect, it } from "vitest";
import { filterBusinesses } from "./businessFilters";
import { accounts } from "../data/accounts";

describe("business filters", () => {
  it("keeps only open businesses when requested", () => {
    const data = [{ ...accounts[0], isOpen: true }, { ...accounts[1], isOpen: false }];
    expect(filterBusinesses(data, { openOnly: true, userPinsOnly: false }).map((item) => item.id)).toEqual([accounts[0].id]);
  });
  it("keeps only rep-created pins", () => {
    const data = [{ ...accounts[0], source: "seed" as const }, { ...accounts[1], source: "user" as const }];
    expect(filterBusinesses(data, { openOnly: false, userPinsOnly: true }).map((item) => item.id)).toEqual([accounts[1].id]);
  });
});
