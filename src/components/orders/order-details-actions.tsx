"use client";

import { Bike, Loader2, Phone, Store, XCircle } from "lucide-react";
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
    <Card className="py-5 rounded-xl border border-border/60 bg-muted/10 shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg">Need Help?</CardTitle>
        <CardDescription>
          Contact the restaurant or cancel the order if possible.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        {(order_status === "BATCHED" ||
          order_status === "OUT_FOR_DELIVERY") && (
          <Button
            variant="default"
            className="flex-1 gap-2 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-98 shadow-md border-none bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 flex items-center justify-center cursor-pointer"
            asChild
          >
            <Link href={`/orders/${order.id}/track` as Route}>
              <Bike className="h-4 w-4 animate-bounce" />
              Track Live Delivery
            </Link>
          </Button>
        )}

        {shopId ? (
          <Button
            variant="outline"
            className="flex-1 gap-2 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-98 shadow-xs border-2 hover:border-primary/50 hover:text-primary"
            asChild
          >
            <Link href={`/shops/${shopId}` as Route}>
              <Store className="h-4 w-4" />
              {shopName ?? "View Restaurant"}
            </Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="flex-1 gap-2 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-98 shadow-xs border-2"
            disabled
          >
            <Phone className="h-4 w-4" />
            Contact Restaurant
          </Button>
        )}

        {canCancel && (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex-1 gap-2 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-98 shadow-xs border-2 border-transparent bg-destructive hover:bg-destructive/90"
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
                <AlertDialogCancel
                  disabled={isPending}
                  className="rounded-xl border-2 hover:bg-muted transition-all duration-200"
                >
                  Keep Order
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={isPending}
                  className="rounded-xl border-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs"
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
