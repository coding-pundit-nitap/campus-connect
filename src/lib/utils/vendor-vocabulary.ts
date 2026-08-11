import { ShopType } from "@/generated/client";

export interface VendorVocabulary {
  prepSectionTitle: string;
  prepKpiLabel: string;
  prepEmptyStateTitle: string;
  prepEmptyStateDescription: string;
  prepSummaryHeading: string;
  printButtonLabel: string;
  printDocTitle: string;
  milestoneClimbStarted: string;
  milestoneMidway: string;
  milestoneArrived: string;
}

const FOOD_VOCABULARY: VendorVocabulary = {
  prepSectionTitle: "Prep & Kitchen Queue",
  prepKpiLabel: "Prepping Console",
  prepEmptyStateTitle: "Nothing in Prep",
  prepEmptyStateDescription:
    "Accepted orders appear here until they move to dispatch.",
  prepSummaryHeading: "Prep List & Kitchen Queue",
  printButtonLabel: "Print KOT",
  printDocTitle: "Kitchen Order Ticket (KOT)",
  milestoneClimbStarted: "Climb Started",
  milestoneMidway: "Midway Hill",
  milestoneArrived: "Arrived",
};

const RETAIL_VOCABULARY: VendorVocabulary = {
  prepSectionTitle: "Picking & Packing",
  prepKpiLabel: "Packing Console",
  prepEmptyStateTitle: "Nothing to pack",
  prepEmptyStateDescription:
    "Accepted orders appear here until they move to dispatch.",
  prepSummaryHeading: "Items to Pick & Pack",
  printButtonLabel: "Print Pick List",
  printDocTitle: "Pick List",
  milestoneClimbStarted: "Delivery Started",
  milestoneMidway: "In Transit",
  milestoneArrived: "Arrived",
};

/**
 * Vendor-facing labels that differ by shop type.
 *
 * Two variants: food (CANTEEN) and retail (STATIONERY, GROCERY). Retail types
 * share wording because both fulfil orders the same way — pick items off a
 * shelf and pack them.
 *
 * Defaults to the food vocabulary, matching the `shop_type` column default of
 * CANTEEN, so existing shops see no change.
 */
export function getVendorVocabulary(shopType?: ShopType): VendorVocabulary {
  switch (shopType) {
    case "STATIONERY":
    case "GROCERY":
      return RETAIL_VOCABULARY;
    case "CANTEEN":
    default:
      return FOOD_VOCABULARY;
  }
}
