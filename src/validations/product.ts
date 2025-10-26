import { z } from "zod";

const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(3, "Name is too short");

const descriptionSchema = z.string().optional();

const priceSchema = z.number().positive("Price must be a positive number");

const stockQuantitySchema = z.number().int().min(0, "Stock cannot be negative");

const image_keySchema = z.string().min(1, "An image is required.");

const discountSchema = z
  .number()
  .min(0, "Discount cannot be negative")
  .optional();

const categorySchema = z
  .string()
  .min(1, "Category is required")
  .min(2, "Category name is too short");

const categoryOptionalSchema = z
  .string()
  .min(2, "Category name is too short")
  .optional();

export const productSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  price: priceSchema,
  stock_quantity: stockQuantitySchema,
  image_key: image_keySchema,
  discount: discountSchema,
  category: categorySchema,
});

export type ProductFormData = z.infer<typeof productSchema>;

export const productUpdateSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  price: priceSchema,
  stock_quantity: stockQuantitySchema,
  image_key: image_keySchema,
  discount: discountSchema,
  category: categoryOptionalSchema,
});

export type ProductUpdateFormData = z.infer<typeof productUpdateSchema>;

export const productActionSchema = productSchema.extend({
  image: z.instanceof(File, { message: "Invalid file" }),
  image_key: z.string().min(1, "An image is required.").optional(),
});
export type ProductActionFormData = z.infer<typeof productActionSchema>;

export const productUpdateActionSchema = productUpdateSchema.extend({
  image: z.instanceof(File, { message: "Invalid file" }),
  image_key: z.string().min(1, "An image is required.").optional(),
});
export type ProductUpdateActionFormData = z.infer<
  typeof productUpdateActionSchema
>;
