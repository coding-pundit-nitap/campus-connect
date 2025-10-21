import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  phone: z.string().optional(),
});

export const userAddressSchema = z.object({
  label: z.string().min(1, "Label is required"),
  building: z.string().min(1, "Building details are required"),
  room_number: z.string().min(1, "Room/Apartment number is required"),
  notes: z.string().optional(),
  is_default: z.boolean().optional().default(false),
});

export const updateUserAddressSchema = userAddressSchema.extend({
  id: z.string(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
