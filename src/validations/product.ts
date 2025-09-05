import { z } from "zod";

const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(3, "Name is too short");

const descriptionSchema = z.string().optional();

const priceSchema = z.number().positive("Price must be a positive number");

const stockQuantitySchema = z.number().int().min(0, "Stock cannot be negative");

const imageUrlSchema = z
  .union([
    z.string().url("Invalid URL"),
    z.instanceof(File, { message: "Invalid file" }),
    z.string().optional(),
  ])
  .optional();

const discountSchema = z
  .number()
  .min(0, "Discount cannot be negative")
  .optional();

export const productSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  price: priceSchema,
  stock_quantity: stockQuantitySchema,
  image_url: imageUrlSchema,
  discount: discountSchema,
});

export function validateProduct(data: z.infer<typeof productSchema>) {
  return productSchema.parse(data);
}

export type ProductFormData = z.infer<typeof productSchema>;
