import { Phone, XCircle } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SerializedOrderWithDetails } from "@/types";

type Props = {
  order: SerializedOrderWithDetails;
};

export default function OrderDetailsActions({ order }: Props) {
  const { order_status, payment_status } = order;

  const canCancel = order_status === "NEW" && payment_status !== "COMPLETED";
  const isTerminalState =
    order_status === "COMPLETED" || order_status === "CANCELLED";

  if (isTerminalState) {
    return null;
  }

  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle className="text-lg">Need Help?</CardTitle>
        <CardDescription>
          Contact the restaurant or cancel the order if possible.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" className="flex-1 gap-2">
          <Phone className="h-4 w-4" />
          Contact Restaurant
        </Button>

        {canCancel && (
          <Button variant="destructive" className="flex-1 gap-2">
            <XCircle className="h-4 w-4" />
            Cancel Order
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
