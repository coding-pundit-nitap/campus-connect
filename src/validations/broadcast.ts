import { z } from "zod";

export const paginatedSchema = z.object({
  limit: z.coerce.number().int().positive().default(10),
  cursor: z.cuid().optional(),
});
