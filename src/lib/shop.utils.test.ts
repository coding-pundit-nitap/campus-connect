import { describe, expect, it } from "vitest";

import type { SellerVerificationStatus } from "@/types/prisma.types";

import { getVerificationStatusInfo } from "./shop.utils";

describe("getVerificationStatusInfo", () => {
  it.each([
    ["VERIFIED", "Verified", "text-green-600", "bg-green-500"],
    ["PENDING", "Pending Review", "text-blue-600", "bg-blue-500"],
    ["REQUIRES_ACTION", "Action Required", "text-orange-600", "bg-orange-500"],
    ["REJECTED", "Rejected", "text-red-600", "bg-red-500"],
    ["NOT_STARTED", "Not Started", "text-yellow-600", "bg-yellow-500"],
  ] as const)("describes %s", (status, label, colorClassName, bgClassName) => {
    const info = getVerificationStatusInfo(status as SellerVerificationStatus);

    expect(info).toMatchObject({ label, colorClassName, bgClassName });
    expect(info.Icon).toBeDefined();
  });
});
