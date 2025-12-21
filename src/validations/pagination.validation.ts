import { z } from "zod";

export const cursorPaginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .refine((v) => !isNaN(v), { message: "limit must be a number" })
    .transform((v) => Math.min(Math.max(1, v), 50)),

  cursor: z.string().optional(),
});

export const dateRangeSchema = z
  .object({
    date_from: z.string().optional(),
    date_to: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.date_from || !data.date_to) return true;
      return new Date(data.date_from) <= new Date(data.date_to);
    },
    {
      message: "date_from must be before date_to",
      path: ["date_from"],
    }
  );

export function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}
