import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().min(1, "Label is required"),
  building: z.string().min(1, "Building name is required"),
  room_number: z.string().min(1, "Room number is required"),
  notes: z.string().optional(),
  is_default: z.boolean(),
});

export type AddressFormData = z.infer<typeof addressSchema>;
