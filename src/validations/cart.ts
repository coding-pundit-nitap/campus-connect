import z from "zod";

export const upsertItemSchema = z.object({
  product_id: z.string(),
  quantity: z.number().int().min(0),
});
export type UpsertItemData = z.infer<typeof upsertItemSchema>;
