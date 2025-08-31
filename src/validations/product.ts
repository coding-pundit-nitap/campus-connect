import { z } from "zod";

export class ProductValidation {
  static readonly nameSchema = z
    .string()
    .min(1, "Name is required")
    .min(3, "Name is too short");

  static readonly descriptionSchema = z.string().optional();

  static readonly priceSchema = z.coerce
    .number()
    .positive("Price must be a positive number");

  static readonly stockQuantitySchema = z.coerce
    .number()
    .int()
    .min(0, "Stock cannot be negative");

  static readonly productSchema = z.object({
    name: this.nameSchema,
    description: this.descriptionSchema,
    price: this.priceSchema,
    stock_quantity: this.stockQuantitySchema,
  });

  static validateProduct(data: z.infer<typeof this.productSchema>) {
    return this.productSchema.parse(data);
  }
}

export const productSchema = ProductValidation.productSchema;

export type ProductFormData = z.infer<typeof ProductValidation.productSchema>;
