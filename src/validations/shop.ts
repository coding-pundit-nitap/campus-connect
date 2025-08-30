import { z } from "zod";

export class ShopValidation {
  static readonly nameSchema = z
    .string()
    .min(1, "Shop name is required")
    .min(3, "Shop name must be at least 3 characters");

  static readonly descriptionSchema = z
    .string()
    .min(1, "Description is required")
    .min(10, "Description is too short");

  static readonly locationSchema = z
    .string()
    .min(1, "Location is required")
    .min(3, "Location must be at least 3 characters");

  static readonly openingSchema = z
    .string()
    .min(1, "Opening hours are required")
    .min(5, "Opening hours format is invalid");

  static readonly closingSchema = z
    .string()
    .min(1, "Closing hours are required")
    .min(5, "Closing hours format is invalid");

  static readonly shopSchema = z.object({
    name: this.nameSchema,
    description: this.descriptionSchema,
    location: this.locationSchema,
    opening: this.openingSchema,
    closing: this.closingSchema,
  });

  static validateShop(data: z.infer<typeof this.shopSchema>) {
    return this.shopSchema.parse(data);
  }
}

export const nameSchema = ShopValidation.nameSchema;
export const descriptionSchema = ShopValidation.descriptionSchema;
export const locationSchema = ShopValidation.locationSchema;
export const openingSchema = ShopValidation.openingSchema;
export const closingSchema = ShopValidation.closingSchema;
export const shopSchema = ShopValidation.shopSchema;

export type ShopFormData = z.infer<typeof ShopValidation.shopSchema>;
