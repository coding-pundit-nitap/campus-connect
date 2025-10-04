import { z } from "zod";

export const getBroadcastsSchema = z.object({
  limit: z.coerce.number().int().positive().default(10),
  cursor: z.cuid().optional(),
});
