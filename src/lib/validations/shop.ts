import z from "zod";

export const shopSchema = z.object({
  name: z.string().min(3, "Shop name must be at least 3 characters"),
  description: z.string().min(10, "Description is too short"),
  location: z.string().min(3, "Location is required"),
  opening: z.string().min(5, "Opening hours are required"),
  closing: z.string().min(5, "Closing hours are required"),
});

export type ShopFormData = z.infer<typeof shopSchema>;
