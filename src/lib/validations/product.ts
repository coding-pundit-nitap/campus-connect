import z from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "Name is too short"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number"),
  stock_quantity: z.coerce.number().int().min(0, "Stock cannot be negative"),
});
