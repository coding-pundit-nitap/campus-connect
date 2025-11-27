import { NotificationCategory, NotificationType } from "@prisma/client";
import { z } from "zod";

export const paginatedSchema = z.object({
  limit: z.coerce.number().int().positive().default(10),
  cursor: z.cuid().optional(),
});
export const searchSchema = paginatedSchema.extend({
  search: z.string().optional(),
});

export const broadcastFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim(),
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message must be less than 1000 characters")
    .trim(),
  type: z.nativeEnum(NotificationType),
  category: z.nativeEnum(NotificationCategory),
  action_url: z.string().optional(),
});

export type BroadcastFormData = z.infer<typeof broadcastFormSchema>;
