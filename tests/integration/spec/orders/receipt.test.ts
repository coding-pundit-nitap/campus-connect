// the PDF receipt's subtotal + fees = the total it prints.
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { GET } from "../../../../src/app/api/orders/[order_id]/pdf/route";
import { makeRequest, routeParams } from "../../../helpers/http";
import {
  paise,
  placeDirectOrder,
  seedCheckout,
} from "../../../helpers/spec-orders";
import { asUser } from "../../../setup/auth";
import { testPrisma } from "../../../setup/integration-setup";

const rendered = vi.hoisted(() => ({ data: null as unknown }));

vi.mock("@react-pdf/renderer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@react-pdf/renderer")>();
  return {
    ...actual,
    renderToBuffer: vi.fn(async (el: ReactElement<{ data: unknown }>) => {
      rendered.data = el.props.data;
      return Buffer.from("%PDF-stub");
    }),
  };
});

type Receipt = {
  items: { price: number; discount: number; quantity: number }[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
};

describe("orders spec: receipt", () => {
  it("the receipt lines and subtotal equal the order's item_total, and subtotal + fees = total", async () => {
    const s = await seedCheckout({
      lines: [
        { price: 120, discount: 25, quantity: 2 },
        { price: 80, quantity: 1 },
      ],
      shop: { direct_delivery_fee: 30 },
    });
    const order = await placeDirectOrder(s);
    await testPrisma.order.update({
      where: { id: order.id },
      data: { order_status: "COMPLETED" },
    });

    asUser(s.buyer);
    const res = await GET(
      makeRequest(`/api/orders/${order.id}/pdf`),
      routeParams({ order_id: order.id })
    );
    expect(res.status).toBe(200);

    const r = rendered.data as Receipt;
    // order-receipt-pdf.tsx renders each line as (price - price*discount/100) * qty
    const linesPaise = r.items.reduce(
      (acc, i) =>
        acc + paise(i.price - (i.price * i.discount) / 100) * i.quantity,
      0
    );
    expect(linesPaise).toBe(paise(order.item_total));
    expect(paise(r.subtotal)).toBe(paise(order.item_total));
    expect(
      paise(r.subtotal) + paise(r.deliveryFee) + paise(r.platformFee)
    ).toBe(paise(r.total));
  });
});
