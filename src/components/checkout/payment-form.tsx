"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { OrderSummary } from "@/components/checkout";
import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateOrder } from "@/hooks";
import { ImageUtils } from "@/lib/utils";
import { CartItemData } from "@/types";
import { PaymentMethod } from "@/types/prisma.types";

interface PaymentFormProps {
  cart_id: string;
  shop_id: string;
  qr_image_key: string;
  upi_id?: string;
  item_total: number;
  delivery_fee: number;
  direct_delivery_fee: number;
  platform_fee: number;
  items: CartItemData[];
}
export function PaymentForm({
  cart_id,
  shop_id,
  qr_image_key,
  upi_id,
  item_total,
  delivery_fee,
  direct_delivery_fee,
  platform_fee,
  items,
}: PaymentFormProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [upiTransactionId, setUpiTransactionId] = useState("");

  const [checkoutData, setCheckoutData] = useState<{
    delivery_address_id: string;
    requested_delivery_time?: string;
    is_direct_delivery: boolean;
  } | null>(null);
  const [isCheckoutDataReady, setIsCheckoutDataReady] = useState(false);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    const redirectToCheckout = (message: string) => {
      if (hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;
      toast.error(message);
      router.replace(`/checkout/${cart_id}`);
    };

    const raw = sessionStorage.getItem("checkout_data");
    if (!raw) {
      setTimeout(() => {
        setCheckoutData(null);
        setIsCheckoutDataReady(true);
        redirectToCheckout("Checkout session expired. Please start over.");
      }, 100);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") {
        setTimeout(() => {
          setCheckoutData(null);
          setIsCheckoutDataReady(true);
          redirectToCheckout("Invalid checkout data. Please start over.");
        }, 100);
        return;
      }

      const anyParsed = parsed as Record<string, unknown>;
      if (anyParsed.cart_id !== cart_id) {
        setTimeout(() => {
          setCheckoutData(null);
          setIsCheckoutDataReady(true);
          redirectToCheckout("Invalid checkout session. Please start over.");
        }, 100);
        return;
      }

      const delivery_address_id = anyParsed.delivery_address_id;
      const requested_delivery_time = anyParsed.requested_delivery_time;
      const is_direct_delivery = anyParsed.is_direct_delivery === true;

      if (
        typeof delivery_address_id !== "string" ||
        (requested_delivery_time !== undefined &&
          typeof requested_delivery_time !== "string")
      ) {
        setTimeout(() => {
          setCheckoutData(null);
          setIsCheckoutDataReady(true);
          redirectToCheckout("Invalid checkout session. Please start over.");
        }, 100);
        return;
      }

      setTimeout(() => {
        setCheckoutData({
          delivery_address_id,
          is_direct_delivery,
          ...(typeof requested_delivery_time === "string"
            ? { requested_delivery_time }
            : {}),
        });
        setIsCheckoutDataReady(true);
      }, 100);
    } catch {
      setTimeout(() => {
        setCheckoutData(null);
        setIsCheckoutDataReady(true);
        redirectToCheckout("Invalid checkout data. Please start over.");
      }, 100);
    }
  }, [cart_id, router]);

  const { mutate: createOrder, isPending } = useCreateOrder();

  const handlePlaceOrder = async () => {
    if (!checkoutData) {
      toast.error("Checkout session missing. Please start over.");
      return;
    }

    if (paymentMethod === PaymentMethod.ONLINE) {
      if (!upiTransactionId.trim()) {
        toast.error("Please enter UPI transaction ID");
        return;
      }
      const upiRegex = /^[A-Za-z0-9]{10,}$/;
      if (!upiRegex.test(upiTransactionId.trim())) {
        toast.error(
          "Invalid UPI Transaction ID. Must be at least 10 alphanumeric characters."
        );
        return;
      }
    }

    createOrder(
      {
        shop_id,
        payment_method: paymentMethod,
        delivery_address_id: checkoutData.delivery_address_id,
        is_direct_delivery: checkoutData.is_direct_delivery,
        ...(checkoutData.requested_delivery_time
          ? {
              requested_delivery_time: new Date(
                checkoutData.requested_delivery_time
              ),
            }
          : {}),
        upi_transaction_id:
          paymentMethod === PaymentMethod.ONLINE
            ? upiTransactionId.trim()
            : undefined,
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

  if (!isCheckoutDataReady) {
    return null;
  }

  if (!checkoutData) {
    return null;
  }
  const deliveryFee = checkoutData.is_direct_delivery
    ? direct_delivery_fee
    : delivery_fee;

  const total = item_total + deliveryFee + platform_fee;

  return (
    <>
      <div className="space-y-6">
        <SharedCard className="px-0" title="Payment Method">
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
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
            <div className="pb-4">
              <p>
                • Delivery:{" "}
                {checkoutData.is_direct_delivery
                  ? "Direct Delivery (ASAP)"
                  : new Date(
                      checkoutData.requested_delivery_time || ""
                    ).toLocaleString()}
              </p>
              {paymentMethod === "CASH" && (
                <p>• Payment will be collected on delivery</p>
              )}
              {paymentMethod === "ONLINE" && (
                <p>• Payment verification may take a few minutes</p>
              )}
            </div>
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
      <div className="space-y-6">
        <OrderSummary
          items={items}
          itemTotal={item_total}
          deliveryFee={deliveryFee}
          platformFee={platform_fee}
          total={total}
          isDirectDelivery={checkoutData.is_direct_delivery}
        />
      </div>
    </>
  );
}
