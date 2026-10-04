import { describe, expect, it } from "vitest";
import { classifyZoning } from "./zoning";

describe("classifyZoning", () => {
  it("classifies a commercial or industrial district as business priority", () => {
    expect(classifyZoning([{ code: "C-2", description: "General Commercial" }])).toBe(
      "business_priority",
    );
    expect(classifyZoning([{ code: "I-1", description: "Light Industrial" }])).toBe(
      "business_priority",
    );
  });

  it("keeps mixed-use and conditional districts qualified", () => {
    expect(classifyZoning([{ code: "MU", description: "Mixed Use" }])).toBe(
      "business_permitted_mixed",
    );
    expect(classifyZoning([{ code: "PUD", description: "Planned Unit Development" }])).toBe(
      "conditional_verify",
    );
  });

  it("never promotes a parcel spanning materially different zoning classes", () => {
    expect(
      classifyZoning([
        { code: "C-2", description: "General Commercial" },
        { code: "R-1", description: "Low Density Residential" },
      ]),
    ).toBe("conditional_verify");
  });

  it("uses the non-target class for missing or residential-only zoning", () => {
    expect(classifyZoning([])).toBe("residential_non_target");
    expect(classifyZoning([{ code: "R-2", description: "Residential" }])).toBe(
      "residential_non_target",
    );
  });
});
