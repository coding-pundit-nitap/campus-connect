import { omit } from "@tests/helpers/lib/builders";
import { describe, expect, it } from "vitest";

import {
  productActionSchema,
  productSchema,
  productUpdateActionSchema,
  productUpdateSchema,
} from "./product";

const valid = {
  name: "Masala Dosa",
  price: 50,
  stock_quantity: 10,
  image_key: "products/dosa.jpg",
  category: "Snacks",
  brand: "House",
};
const file = () => new File(["x"], "x.png", { type: "image/png" });
const message = (r: { error?: { issues: { message: string }[] } }) =>
  r.error?.issues[0]?.message;

describe("productSchema", () => {
  it("accepts a valid product with optional description and discount", () => {
    expect(
      productSchema.safeParse({ ...valid, description: "Hot", discount: 5 })
        .success
    ).toBe(true);
  });

  it.each([
    [{ name: "" }, "Name is required"],
    [{ name: "ab" }, "Name is too short"],
    [{ price: -1 }, "Price must be a positive number"],
    [{ stock_quantity: -1 }, "Stock cannot be negative"],
    [{ image_key: "" }, "An image is required."],
    [{ discount: -1 }, "Discount cannot be negative"],
    [{ category: "" }, "Category is required"],
    [{ category: "a" }, "Category name is too short"],
    [{ brand: "" }, "Brand is required"],
    [{ brand: "a" }, "Brand name is too short"],
  ])("rejects %j with %s", (patch, msg) => {
    expect(message(productSchema.safeParse({ ...valid, ...patch }))).toBe(msg);
  });
});

describe("productUpdateSchema", () => {
  it("makes category and brand optional", () => {
    const rest = omit(valid, "category", "brand");

    expect(productUpdateSchema.safeParse(rest).success).toBe(true);
  });

  it.each([
    [{ category: "a" }, "Category name is too short"],
    [{ brand: "a" }, "Brand name is too short"],
  ])("still validates provided %j", (patch, msg) => {
    expect(message(productUpdateSchema.safeParse({ ...valid, ...patch }))).toBe(
      msg
    );
  });
});

describe("productActionSchema", () => {
  it("requires an image file but makes image_key optional", () => {
    const rest = omit(valid, "image_key");

    expect(
      productActionSchema.safeParse({ ...rest, image: file() }).success
    ).toBe(true);
  });

  it("rejects a non-file image", () => {
    expect(
      message(productActionSchema.safeParse({ ...valid, image: "nope" }))
    ).toBe("Invalid file");
  });

  it("rejects an empty image_key when provided", () => {
    expect(
      message(
        productActionSchema.safeParse({
          ...valid,
          image: file(),
          image_key: "",
        })
      )
    ).toBe("An image is required.");
  });
});

describe("productUpdateActionSchema", () => {
  it("makes both image and image_key optional", () => {
    const rest = omit(valid, "image_key");

    expect(productUpdateActionSchema.safeParse(rest).success).toBe(true);
  });

  it("rejects a non-file image", () => {
    expect(
      message(productUpdateActionSchema.safeParse({ ...valid, image: 1 }))
    ).toBe("Invalid file");
  });
});
