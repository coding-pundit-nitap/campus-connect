import { omit } from "@tests/helpers/lib/builders";
import { describe, expect, it } from "vitest";

import { shopActionSchema, shopSchema } from "./shop";

const valid = {
  name: "Canteen",
  description: "Hot food all day",
  location: "Block A",
  opening: "09:00",
  closing: "21:00",
  image_key: "shops/a.png",
  qr_image_key: "shops/qr.png",
  upi_id: "canteen@upi",
  min_order_value: 50,
  batch_slots: [{ cutoff_time_minutes: 600, label: "Lunch" }],
  default_delivery_fee: 10,
  direct_delivery_fee: 20,
};
const message = (r: { error?: { issues: { message: string }[] } }) =>
  r.error?.issues[0]?.message;

describe("shopSchema", () => {
  it("accepts a valid shop", () => {
    expect(shopSchema.safeParse(valid).success).toBe(true);
  });

  it.each([null, undefined, 0, 50000])(
    "accepts batch_min_order_value %j",
    (batch_min_order_value) => {
      expect(
        shopSchema.safeParse({ ...valid, batch_min_order_value }).success
      ).toBe(true);
    }
  );

  it.each<[Record<string, unknown>, string]>([
    [{ name: "" }, "Shop name is required"],
    [{ name: "ab" }, "Shop name must be at least 3 characters"],
    [{ name: "x".repeat(51) }, "Shop name is too long"],
    [{ description: "" }, "Description is required"],
    [{ description: "short" }, "Description is too short"],
    [{ description: "x".repeat(501) }, "Description is too long"],
    [{ location: "" }, "Location is required"],
    [{ location: "ab" }, "Location must be at least 3 characters"],
    [{ location: "x".repeat(101) }, "Location is too long"],
    [{ opening: "" }, "Opening hours are required"],
    [{ opening: "9:00" }, "Opening hours must be in HH:MM (24-hour) format"],
    [{ opening: "24:00" }, "Opening hours must be in HH:MM (24-hour) format"],
    [{ closing: "" }, "Closing hours are required"],
    [{ closing: "21:60" }, "Closing hours must be in HH:MM (24-hour) format"],
    [{ image_key: "" }, "An image is required."],
    [{ qr_image_key: "" }, "An QR code image is required."],
    [{ min_order_value: -1 }, "Minimum order value cannot be negative"],
    [{ min_order_value: 10001 }, "Minimum order value cannot exceed ₹10,000"],
    [
      { batch_min_order_value: -1 },
      "Collective batch minimum cannot be negative",
    ],
    [
      { batch_min_order_value: 50001 },
      "Collective batch minimum cannot exceed ₹50,000",
    ],
    [{ default_delivery_fee: -1 }, "Fee cannot be negative"],
    [{ direct_delivery_fee: 501 }, "Fee cannot exceed ₹500"],
    [
      { batch_slots: [{ cutoff_time_minutes: 1.5 }] },
      "Cutoff time must be minutes",
    ],
  ])("rejects %j with %s", (patch, msg) => {
    expect(message(shopSchema.safeParse({ ...valid, ...patch }))).toBe(msg);
  });

  it.each([
    [{ batch_slots: [{ cutoff_time_minutes: -1 }] }],
    [{ batch_slots: [{ cutoff_time_minutes: 1440 }] }],
    [{ batch_slots: [{ cutoff_time_minutes: 0, label: "x".repeat(51) }] }],
    [
      {
        batch_slots: Array.from({ length: 49 }, () => ({
          cutoff_time_minutes: 0,
        })),
      },
    ],
  ])("rejects invalid batch slots %#", (patch) => {
    expect(shopSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe("shopActionSchema", () => {
  const file = () => new File(["x"], "x.png", { type: "image/png" });

  it("makes image keys optional and accepts uploaded files", () => {
    const rest = omit(valid, "image_key", "qr_image_key");

    expect(
      shopActionSchema.safeParse({ ...rest, image: file(), qr_image: file() })
        .success
    ).toBe(true);
  });

  it.each([{ image: "x" }, { qr_image: 1 }])("rejects non-file %j", (patch) => {
    expect(message(shopActionSchema.safeParse({ ...valid, ...patch }))).toBe(
      "Invalid file"
    );
  });
});
