import { z } from "zod";

export const addressSchema = z
  .object({
    label: z.string().min(1, "Label is required"),
    building_id: z.string().optional(),
    hostel_block: z.string().optional(),
    building: z.string().optional(),
    room_number: z.string().min(1, "Room number is required"),
    notes: z.string().optional(),
    is_default: z.boolean(),
  })
  .refine((data) => Boolean(data.building_id || data.building?.trim()), {
    message: "Building is required",
    path: ["building_id"],
  });

export type AddressFormData = z.infer<typeof addressSchema>;
