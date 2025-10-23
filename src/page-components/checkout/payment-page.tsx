"use client";

import { PaymentMethod } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { CheckoutHeader, OrderSummary } from "@/components/checkout";
import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartDrawer, useCreateOrder } from "@/hooks";

export default function PaymentPageComponent({ cart_id }: { cart_id: string }) {
  const router = useRouter();
  const { summary } = useCartDrawer();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [upiTransactionId, setUpiTransactionId] = useState("");

  const checkoutData = useMemo<{
    delivery_address_id: string;
    requested_delivery_time: string;
  } | null>(() => {
    const data = sessionStorage.getItem("checkout_data");
    if (!data) {
      toast.error("Checkout session expired. Please start over.");
      router.push(`/checkout/${cart_id}`);
      return null;
    }

    try {
      const parsed = JSON.parse(data);
      if (parsed.cart_id !== cart_id) {
        toast.error("Invalid checkout session.");
        router.push(`/checkout/${cart_id}`);
        return null;
      }
      return parsed;
    } catch {
      toast.error("Invalid checkout data.");
      router.push(`/checkout/${cart_id}`);
      return null;
    }
  }, [cart_id, router]);

  const { mutate: createOrder, isPending } = useCreateOrder();

  const items = useMemo(
    () => summary?.shopCarts.find((cart) => cart.id === cart_id)?.items || [],
    [summary, cart_id]
  );

  const cart = summary?.shopCarts.find((cart) => cart.id === cart_id);
  const total = items.reduce(
    (sum, item) =>
      sum + ((item.price * (100 - item.discount)) / 100) * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (!checkoutData) {
      toast.error("Checkout data not found");
      return;
    }

    if (paymentMethod === "ONLINE" && !upiTransactionId.trim()) {
      toast.error("Please enter UPI transaction ID");
      return;
    }

    if (!cart || cart.items.length === 0) {
      toast.error("Cart not found or empty");
      return;
    }

    const shop_id = cart.items[0].shop_id;

    createOrder(
      {
        shop_id,
        payment_method: paymentMethod,
        delivery_address_id: checkoutData.delivery_address_id,
        requested_delivery_time: new Date(checkoutData.requested_delivery_time),
        upi_transaction_id:
          paymentMethod === "ONLINE" ? upiTransactionId : undefined,
      },
      {
        onSuccess: ({ data }) => {
          sessionStorage.removeItem("checkout_data");
          toast.success("Order placed successfully!");
          router.push(`/orders/${data.id}`);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to place order");
        },
      }
    );
  };

  if (!checkoutData) {
    return null;
  }

  return (
    <SharedCard
      headerContent={<CheckoutHeader />}
      contentClassName="grid lg:grid-cols-2 gap-8"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-0">
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as PaymentMethod)
              }
            >
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="CASH" id="cash" />
                <Label htmlFor="cash" className="flex-1 cursor-pointer">
                  <div className="font-medium">Cash on Delivery</div>
                  <div className="text-sm text-muted-foreground">
                    Pay with cash when your order arrives
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="ONLINE" id="online" />
                <Label htmlFor="online" className="flex-1 cursor-pointer">
                  <div className="font-medium">UPI Payment</div>
                  <div className="text-sm text-muted-foreground">
                    Pay online via UPI (PhonePe, Google Pay, Paytm, etc.)
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {paymentMethod === "ONLINE" && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <div className="space-y-2">
                  <h4 className="font-medium">UPI Payment Details</h4>
                  <p className="text-sm text-muted-foreground">
                    Scan the QR code below or use UPI ID to make payment
                  </p>
                </div>

                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <div className="text-center space-y-2">
                    <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                      <span className="text-sm text-gray-500">QR Code</span>
                    </div>
                    <p className="text-sm font-medium">UPI ID: merchant@upi</p>
                    <p className="text-sm text-muted-foreground">
                      Amount: ₹{total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction-id">
                    Transaction ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="transaction-id"
                    placeholder="Enter UPI transaction ID"
                    value={upiTransactionId}
                    onChange={(e) => setUpiTransactionId(e.target.value)}
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 12-digit transaction ID from your payment app
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <OrderSummary items={items} />

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                • Delivery time:{" "}
                {new Date(
                  checkoutData.requested_delivery_time
                ).toLocaleString()}
              </p>
              {paymentMethod === "CASH" && (
                <p>• Payment will be collected on delivery</p>
              )}
              {paymentMethod === "ONLINE" && (
                <p>• Payment verification may take a few minutes</p>
              )}
            </div>

            <Button
              onClick={handlePlaceOrder}
              disabled={
                isPending ||
                (paymentMethod === "ONLINE" && !upiTransactionId.trim())
              }
              className="w-full"
              size="lg"
            >
              {isPending
                ? "Processing..."
                : `Place Order - ₹${total.toFixed(2)}`}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
              className="w-full"
            >
              Back to Checkout
            </Button>
          </CardContent>
        </Card>
      </div>
    </SharedCard>
  );
}
