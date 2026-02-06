import { renderToBuffer } from "@react-pdf/renderer";
import { NextRequest, NextResponse } from "next/server";

import {
  OrderReceiptData,
  OrderReceiptPDF,
} from "@/components/pdf/order-receipt-pdf";
import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { createErrorResponse } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  try {
    const userId = await authUtils.getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { order_id } = await params;

    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                discount: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
        shop: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    if (!order) {
      const errorResponse = createErrorResponse("Order not found");
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const isOwner = order.user_id === userId;
    const isShopOwner = order.shop_id
      ? await prisma.shop.findFirst({
          where: { id: order.shop_id, user: { id: userId } },
          select: { id: true },
        })
      : null;

    if (!isOwner && !isShopOwner) {
      const errorResponse = createErrorResponse("Forbidden");
      return NextResponse.json(errorResponse, { status: 403 });
    }

    const items = order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: Number(item.price),
      discount: Number(item.product.discount) || 0,
    }));

    const subtotal = items.reduce((acc, item) => {
      const discountedPrice = item.price - (item.price * item.discount) / 100;
      return acc + discountedPrice * item.quantity;
    }, 0);

    const receiptData: OrderReceiptData = {
      displayId: order.display_id,
      createdAt: new Date(order.created_at).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }),
      customer: {
        name: order.user?.name || "Guest",
        phone: order.user?.phone || undefined,
      },
      shop: {
        name: order.shop?.name || "Unknown Shop",
        location: order.shop?.location || "",
      },
      deliveryAddress: order.delivery_address_snapshot || "",
      requestedDeliveryTime: order.requested_delivery_time
        ? new Date(order.requested_delivery_time).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Kolkata",
          })
        : undefined,
      paymentMethod: order.payment_method,
      upiTransactionId: order.upi_transaction_id || undefined,
      customerNotes: order.customer_notes || undefined,
      items,
      subtotal,
      deliveryFee: Number(order.delivery_fee),
      platformFee: Number(order.platform_fee),
      total: Number(order.total_price),
    };

    const pdfBuffer = await renderToBuffer(
      <OrderReceiptPDF data={receiptData} />
    );

    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="order-${order.display_id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    const errorResponse = createErrorResponse("Failed to generate PDF");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
