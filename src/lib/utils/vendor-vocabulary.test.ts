import { describe, expect, it } from "vitest";

import { getVendorVocabulary } from "./vendor-vocabulary";

describe("getVendorVocabulary", () => {
  it("uses kitchen language for canteens", () => {
    const v = getVendorVocabulary("CANTEEN");
    expect(v.prepSectionTitle).toBe("Prep & Kitchen Queue");
    expect(v.printButtonLabel).toBe("Print KOT");
    expect(v.printDocTitle).toBe("Kitchen Order Ticket (KOT)");
    expect(v.milestoneClimbStarted).toBe("Climb Started");
  });

  it("uses packing language for stationery shops", () => {
    const v = getVendorVocabulary("STATIONERY");
    expect(v.prepSectionTitle).toBe("Picking & Packing");
    expect(v.printButtonLabel).toBe("Print Pick List");
    expect(v.printDocTitle).toBe("Pick List");
    expect(v.milestoneClimbStarted).toBe("Delivery Started");
  });

  it("gives grocery shops the same retail vocabulary as stationery", () => {
    expect(getVendorVocabulary("GROCERY")).toEqual(
      getVendorVocabulary("STATIONERY")
    );
  });

  it("defaults to canteen vocabulary when shop type is undefined", () => {
    expect(getVendorVocabulary(undefined)).toEqual(
      getVendorVocabulary("CANTEEN")
    );
  });

  it("never leaks kitchen words into the retail vocabulary", () => {
    const retail = getVendorVocabulary("GROCERY");
    const banned = ["kitchen", "kot", "cook", "prep &", "canteen"];
    for (const value of Object.values(retail)) {
      for (const word of banned) {
        expect(value.toLowerCase()).not.toContain(word);
      }
    }
  });
});
