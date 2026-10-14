import { describe, expect, it } from "vitest";

import shopUIServices, { shopUIServices as named } from "./shop.utils";

describe("shopUIServices", () => {
  it("exports one singleton", () => {
    expect(shopUIServices).toBe(named);
  });

  it("builds the link form fields in display order", () => {
    const fields = shopUIServices.createShopLinkFormFields();

    expect(fields.map((f) => f.name)).toEqual([
      "name",
      "description",
      "location",
      "opening",
      "closing",
      "image_key",
    ]);
    expect(fields.find((f) => f.name === "image_key")).toMatchObject({
      type: "file",
      required: false,
    });
  });

  it("builds the update form fields including payment and fee settings", () => {
    const fields = shopUIServices.createShopUpdateFormFields();

    expect(fields.map((f) => f.name)).toEqual([
      "name",
      "description",
      "location",
      "opening",
      "closing",
      "upi_id",
      "min_order_value",
      "default_delivery_fee",
      "direct_delivery_fee",
      "image",
      "qr_image",
    ]);
    expect(fields.find((f) => f.name === "description")?.type).toBe("richtext");
  });

  it.each([true, false])("submit button reflects loading=%s", (loading) => {
    expect(shopUIServices.createShopSubmitButton(loading)).toEqual({
      text: "Link Shop",
      type: "submit",
      variant: "default",
      loading,
    });
  });

  it("provides the default link card config", () => {
    expect(shopUIServices.getDefaultShopLinkCardConfig()).toEqual({
      className: "mx-4 w-full md:w-1/2 lg:w-1/3",
      title: "Link Your Shop",
      description: "Please enter the shop details to get started.",
    });
  });

  it.each<[Error | null, string | null]>([
    [null, null],
    [new Error("Shop already exists"), "A shop with this name already exists."],
    [new Error("boom"), "An unexpected error occurred. Please try again."],
  ])("formatShopLinkError(%o) -> %s", (error, expected) => {
    expect(shopUIServices.formatShopLinkError(error)).toBe(expected);
  });
});
