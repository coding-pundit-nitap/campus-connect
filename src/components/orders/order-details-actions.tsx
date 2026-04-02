"use client";

import { Loader2, Phone, Store, XCircle } from "lucide-react";
import { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCancelOrder } from "@/hooks/queries/useOrders";
import { SerializedOrderWithDetails } from "@/types";

type Props = {
  order: SerializedOrderWithDetails;
};

export default function OrderDetailsActions({ order }: Props) {
  const { order_status, payment_status } = order;
  const [open, setOpen] = useState(false);
  const { mutate: cancelOrder, isPending } = useCancelOrder();

  const canCancel = order_status === "NEW" && payment_status !== "COMPLETED";
  const isTerminalState =
    order_status === "COMPLETED" || order_status === "CANCELLED";

  if (isTerminalState) {
    return null;
  }

  const shopId = order.items?.[0]?.product?.shop?.id;
  const shopName = order.items?.[0]?.product?.shop?.name;

  const handleCancel = () => {
    cancelOrder(order.id, {
      onSettled: () => setOpen(false),
    });
  };

  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle className="text-lg">Need Help?</CardTitle>
        <CardDescription>
          Contact the restaurant or cancel the order if possible.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        {shopId ? (
          <Button variant="outline" className="flex-1 gap-2" asChild>
            <Link href={`/shops/${shopId}` as Route}>
              <Store className="h-4 w-4" />
              {shopName ?? "View Restaurant"}
            </Link>
          </Button>
        ) : (
          <Button variant="outline" className="flex-1 gap-2" disabled>
            <Phone className="h-4 w-4" />
            Contact Restaurant
          </Button>
        )}

        {canCancel && (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {isPending ? "Cancelling..." : "Cancel Order"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel order{" "}
                  <span className="font-semibold">{order.display_id}</span>?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Keep Order
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Yes, Cancel Order"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
