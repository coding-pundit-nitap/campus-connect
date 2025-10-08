"use client";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { Phone } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SerializedOrderWithDetails } from "@/types";

import ReviewSection from "./reviews-section";

type Props = {
  order_id: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  order: SerializedOrderWithDetails;
};

export default function OrderDetailsActions({
  orderStatus,
  paymentStatus,
  order,
}: Props) {
  const canCancel = orderStatus === "NEW" && paymentStatus !== "COMPLETED";
  const isCompleted = orderStatus === "COMPLETED";
  const isCancelled = orderStatus === "CANCELLED";

  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col min-w-fit gap-3">
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

          {isCompleted && <ReviewSection order={order} />}
        </div>
      </CardContent>
    </Card>
  );
}
