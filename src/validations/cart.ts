import z from "zod";

export class CartValidation {
  static readonly upsertItemSchema = z.object({
    product_id: z.string(),
    quantity: z.number().int().min(0),
  });
}
export type UpsertItemData = z.infer<typeof CartValidation.upsertItemSchema>;
export const upsertItemSchema = CartValidation.upsertItemSchema;
