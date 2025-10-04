import { OrderStatus, PaymentStatus } from "@prisma/client";
import { ArrowLeft, Phone } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  order_id: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
};

export default function OrderDetailsActions({
  orderStatus,
  paymentStatus,
}: Props) {
  const canCancel = orderStatus === "NEW" && paymentStatus !== "COMPLETED";
  const isCompleted = orderStatus === "COMPLETED";
  const isCancelled = orderStatus === "CANCELLED";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col min-w-fit gap-3">
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/orders">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Link>
            </Button>
          </div>

          <div className="flex flex-col md:flex-row w-full gap-2">
            {!isCancelled && !isCompleted && (
              <Button variant="outline" className="flex-1">
                <Phone className="h-4 w-4 mr-2" />
                Contact Restaurant
              </Button>
            )}

            {canCancel && (
              <Button variant="destructive" className="flex-1">
                Cancel Order
              </Button>
            )}
          </div>

          {isCompleted && (
            <Button variant="outline" className="w-full">
              Reorder Items
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
