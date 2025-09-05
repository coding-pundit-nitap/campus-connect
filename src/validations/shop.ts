import { z } from "zod";

const nameSchema = z
  .string()
  .min(1, "Shop name is required")
  .min(3, "Shop name must be at least 3 characters");

const descriptionSchema = z
  .string()
  .min(1, "Description is required")
  .min(10, "Description is too short");

const locationSchema = z
  .string()
  .min(1, "Location is required")
  .min(3, "Location must be at least 3 characters");

const openingSchema = z
  .string()
  .min(1, "Opening hours are required")
  .min(5, "Opening hours format is invalid");

const closingSchema = z
  .string()
  .min(1, "Closing hours are required")
  .min(5, "Closing hours format is invalid");

export const shopSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  location: locationSchema,
  opening: openingSchema,
  closing: closingSchema,
});

export function validateShop(data: z.infer<typeof shopSchema>) {
  return shopSchema.parse(data);
}

export type ShopFormData = z.infer<typeof shopSchema>;
