import { z } from "zod";

const nameSchema = z
  .string()
  .min(1, "Shop name is required")
  .min(3, "Shop name must be at least 3 characters")
  .max(50, "Shop name is too long");

const descriptionSchema = z
  .string()
  .min(1, "Description is required")
  .min(10, "Description is too short")
  .max(500, "Description is too long");

const locationSchema = z
  .string()
  .min(1, "Location is required")
  .min(3, "Location must be at least 3 characters")
  .max(100, "Location is too long");

const image_keySchema = z.string().min(1, "An image is required.");

const openingSchema = z
  .string()
  .min(1, "Opening hours are required")
  .min(5, "Opening hours format is invalid")
  .max(5, "Opening hours format is invalid");

const closingSchema = z
  .string()
  .min(1, "Closing hours are required")
  .min(5, "Closing hours format is invalid")
  .max(5, "Closing hours format is invalid");

const qr_image_keySchema = z.string().min(1, "An QR code image is required.");

const feeSchema = z
  .number()
  .min(0, "Fee cannot be negative")
  .max(500, "Fee cannot exceed ₹500");

const minOrderValueSchema = z
  .number()
  .min(0, "Minimum order value cannot be negative")
  .max(10000, "Minimum order value cannot exceed ₹10,000");

const batchCardSchema = z.object({
  cutoff_time_minutes: z
    .number()
    .int("Cutoff time must be minutes")
    .min(0)
    .max(1439),
  label: z.string().max(50).optional().nullable(),
});

export const shopSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  location: locationSchema,
  opening: openingSchema,
  closing: closingSchema,
  image_key: image_keySchema,
  qr_image_key: qr_image_keySchema,
  upi_id: z.string(),
  min_order_value: minOrderValueSchema,
  batch_cards: z.array(batchCardSchema).max(48),
  default_delivery_fee: feeSchema,
  default_platform_fee: feeSchema,
});

export type ShopFormData = z.infer<typeof shopSchema>;

export const shopActionSchema = shopSchema.extend({
  image: z.instanceof(File, { message: "Invalid file" }).optional(),
  image_key: image_keySchema.optional(),
  qr_image: z.instanceof(File, { message: "Invalid file" }).optional(),
  qr_image_key: qr_image_keySchema.optional(),
});
export type ShopActionFormInput = z.input<typeof shopActionSchema>;
export type ShopActionFormData = z.infer<typeof shopActionSchema>;
