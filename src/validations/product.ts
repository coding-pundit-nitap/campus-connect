import { z } from "zod";

const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(3, "Name is too short");

const descriptionSchema = z.string().optional();

const priceSchema = z.number().positive("Price must be a positive number");

const stockQuantitySchema = z.number().int().min(0, "Stock cannot be negative");

const imageKeySchema = z.union([
  z.string().min(1, "An image is required."), // Must be a non-empty string if it exists
  z.instanceof(File, { message: "An image is required." }),
]);

const discountSchema = z
  .number()
  .min(0, "Discount cannot be negative")
  .optional();

export const productSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  price: priceSchema,
  stock_quantity: stockQuantitySchema,
  imageKey: imageKeySchema,
  discount: discountSchema,
});

export type ProductFormData = z.infer<typeof productSchema>;

export const productActionSchema = productSchema.extend({
  imageKey: z.string().min(1, "An image key is required."),
});
export type ProductActionFormData = z.infer<typeof productActionSchema>;
