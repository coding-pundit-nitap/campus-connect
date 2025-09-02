import { z } from "zod";

export class ProductValidation {
  static readonly nameSchema = z
    .string()
    .min(1, "Name is required")
    .min(3, "Name is too short");

  static readonly descriptionSchema = z.string().optional();

  static readonly priceSchema = z
    .number()
    .positive("Price must be a positive number");

  static readonly stockQuantitySchema = z
    .number()
    .int()
    .min(0, "Stock cannot be negative");
  static readonly imageUrlSchema = z
    .union([
      z.string().url("Invalid URL"),
      z.instanceof(File, { message: "Invalid file" }),
      z.string().optional(),
    ])
    .optional();
  static readonly discountSchema = z
    .number()
    .min(0, "Discount cannot be negative")
    .optional();

  static readonly productSchema = z.object({
    name: this.nameSchema,
    description: this.descriptionSchema,
    price: this.priceSchema,
    stock_quantity: this.stockQuantitySchema,
    image_url: this.imageUrlSchema,
    discount: this.discountSchema,
  });

  static validateProduct(data: z.infer<typeof this.productSchema>) {
    return this.productSchema.parse(data);
  }
}

export const productSchema = ProductValidation.productSchema;

export type ProductFormData = z.infer<typeof ProductValidation.productSchema>;
