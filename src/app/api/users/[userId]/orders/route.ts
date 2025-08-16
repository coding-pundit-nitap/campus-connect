import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import orderServices from "@/services/order.services";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = params;

    if (session.user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orders = await orderServices.getOrdersByUserId(userId);
    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET USER ORDERS ERROR:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
