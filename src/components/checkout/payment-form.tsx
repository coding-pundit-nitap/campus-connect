"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateOrder } from "@/hooks";
import { ImageUtils } from "@/lib/utils";
import { PaymentMethod } from "@/types/prisma.types";

interface PaymentFormProps {
  cart_id: string;
  shop_id: string;
  total: number;
  qr_image_key: string;
  upi_id?: string;
}
export function PaymentForm({
  cart_id,
  total,
  shop_id,
  qr_image_key,
  upi_id,
}: PaymentFormProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethord] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
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

  const handlePlaceOrder = async () => {
    if (!checkoutData) {
      toast.error("Checkout");
      return;
    }

    if (paymentMethod === PaymentMethod.ONLINE) {
      if (!upiTransactionId) {
        toast.error("Please enter UPI transaction ID");
        return;
      }
      const upiRegex = /^\d{12}$/;
      if (!upiRegex.test(upiTransactionId)) {
        toast.error("Invalid UPI Transaction ID. It must be 12 digits.");
        return;
      }
    }

    createOrder(
      {
        shop_id,
        payment_method: paymentMethod,
        delivery_address_id: checkoutData.delivery_address_id,
        requested_delivery_time: new Date(checkoutData.requested_delivery_time),
        upi_transaction_id:
          paymentMethod === PaymentMethod.ONLINE ? upiTransactionId : undefined,
      },
      {
        onSuccess(data) {
          sessionStorage.removeItem("checkout_data");
          toast.success("Order placed successfully!");
          router.push(`/orders/${data.data.id}`);
        },
        onError(error) {
          toast.error(error.message || "Failed to place order");
        },
      }
    );
  };

  if (!checkoutData) {
    return null;
  }
  return (
    <div className="space-y-6">
      <SharedCard className="px-0" title="Payment Methord">
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethord(value as PaymentMethod)}
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
                <Image
                  src={ImageUtils.getImageUrl(qr_image_key)}
                  alt="QR for Payment"
                  width={192}
                  height={192}
                />
                {upi_id && (
                  <p className="text-sm text-muted-foreground font-medium">
                    UPI ID: {upi_id}
                  </p>
                )}
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
                Enter the transaction ID from your payment app (alphanumeric,
                min 10 characters)
              </p>
            </div>
          </div>
        )}
      </SharedCard>
      <SharedCard className="px-0">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            • Delivery time:{" "}
            {new Date(checkoutData.requested_delivery_time).toLocaleString()}
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
          {isPending ? "Processing..." : `Place Order - ₹${total.toFixed(2)}`}
        </Button>

        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
          className="w-full"
        >
          Back to Checkout
        </Button>
      </SharedCard>
    </div>
  );
}
