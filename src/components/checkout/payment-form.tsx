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
import { cn } from "@/lib/cn";
import { ImageUtils } from "@/lib/utils";
import { CartItemData } from "@/types";
import { PaymentMethod } from "@/types/prisma.types";

interface PaymentFormProps {
  cart_id: string;
  shop_id: string;
  shopAcceptingOrders: boolean;
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
  shopAcceptingOrders,
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
    if (!shopAcceptingOrders) {
      toast.error("This shop has currently paused new orders.");
      return;
    }

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
      <div className="grid lg:grid-cols-3 gap-8 items-start w-full">
        <div className="lg:col-span-2 space-y-4">
          <SharedCard
            className="border border-border/30 bg-card/25 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl shadow-blue-500/[0.01] p-5 relative px-5"
            title="Payment Method"
            titleClassName="text-lg font-bold tracking-tight text-foreground text-left"
            headerClassName="pb-3 pt-5 px-0 text-left items-start"
          >
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as PaymentMethod)
              }
              className="space-y-3"
            >
              <div
                onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                className={cn(
                  "flex items-center space-x-3 border rounded-xl p-4 cursor-pointer transition-all duration-300 hover:translate-y-[-2px] relative overflow-hidden bg-card/30",
                  paymentMethod === PaymentMethod.CASH
                    ? "ring-2 ring-blue-600/50 bg-blue-600/[0.03] border-blue-600 shadow-md"
                    : "border-border/40 hover:border-border/80"
                )}
              >
                <RadioGroupItem
                  value="CASH"
                  id="cash"
                  className="text-blue-600 focus:ring-blue-600/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="cash" className="flex-1 cursor-pointer">
                  <div className="font-bold text-foreground text-sm">
                    Cash on Delivery
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5 leading-snug">
                    Pay with cash when your order arrives at your block
                  </div>
                </Label>
              </div>

              <div
                onClick={() => setPaymentMethod(PaymentMethod.ONLINE)}
                className={cn(
                  "flex items-center space-x-3 border rounded-xl p-4 cursor-pointer transition-all duration-300 hover:translate-y-[-2px] relative overflow-hidden bg-card/30",
                  paymentMethod === PaymentMethod.ONLINE
                    ? "ring-2 ring-blue-600/50 bg-blue-600/[0.03] border-blue-600 shadow-md"
                    : "border-border/40 hover:border-border/80"
                )}
              >
                <RadioGroupItem
                  value="ONLINE"
                  id="online"
                  className="text-blue-600 focus:ring-blue-600/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="online" className="flex-1 cursor-pointer">
                  <div className="font-bold text-foreground text-sm">
                    UPI Payment
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5 leading-snug">
                    Pay online via UPI (PhonePe, Google Pay, Paytm, etc.)
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {paymentMethod === PaymentMethod.ONLINE && (
              <div className="space-y-5 border border-border/20 rounded-2xl p-5 bg-muted/20 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="absolute top-0 right-0 h-24 w-24 bg-blue-600/5 rounded-full blur-xl pointer-events-none" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-foreground">
                    UPI QR Verification
                  </h4>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Scan the QR code below or copy the UPI ID to make payment,
                    then submit the Transaction ID below.
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="relative p-4 bg-white dark:bg-white rounded-2xl shadow-xl border border-white/50 max-w-[210px] group transition-transform duration-300 hover:scale-[1.02]">
                    <Image
                      src={ImageUtils.getImageUrl(qr_image_key)}
                      alt="QR for Payment"
                      width={180}
                      height={180}
                      className="rounded-lg object-contain"
                    />
                    <div className="absolute inset-0 border-2 border-blue-600/10 rounded-2xl pointer-events-none group-hover:border-blue-600/30 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {upi_id && (
                    <div className="bg-card/40 border border-border/30 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/80">
                          UPI Address ID
                        </p>
                        <p className="text-xs font-bold text-foreground mt-0.5 truncate max-w-[130px]">
                          {upi_id}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="bg-card/40 border border-border/30 rounded-xl p-3">
                    <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/80">
                      Paying Amount
                    </p>
                    <p className="text-xs font-black text-orange-500 mt-0.5">
                      ₹{total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <Label
                    htmlFor="transaction-id"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Transaction ID <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="transaction-id"
                    placeholder="Enter UPI transaction ID"
                    value={upiTransactionId}
                    onChange={(e) => setUpiTransactionId(e.target.value)}
                    disabled={isPending}
                    className="h-11 bg-card/40 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/40 font-semibold uppercase tracking-wider pr-10"
                  />
                  <p className="text-[10px] text-muted-foreground/80 font-medium">
                    Enter the reference transaction ID from your payment app
                    (typically 12+ alphanumeric characters).
                  </p>
                </div>
              </div>
            )}
          </SharedCard>

          <SharedCard className="border border-border/30 bg-card/25 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl shadow-blue-500/[0.01] p-5 relative px-5">
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="pb-2 text-xs font-semibold space-y-1">
                <p className="flex items-center gap-1.5 text-foreground">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600" />
                  Delivery:{" "}
                  <span className="font-bold">
                    {checkoutData.is_direct_delivery
                      ? "Direct Delivery (ASAP)"
                      : new Date(
                          checkoutData.requested_delivery_time || ""
                        ).toLocaleString()}
                  </span>
                </p>
                {paymentMethod === PaymentMethod.CASH && (
                  <p className="flex items-center gap-1.5 text-foreground">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600" />
                    Payment will be collected on delivery
                  </p>
                )}
                {paymentMethod === PaymentMethod.ONLINE && (
                  <p className="flex items-center gap-1.5 text-foreground">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600" />
                    Payment verification may take a few minutes
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/10">
              <Button
                onClick={handlePlaceOrder}
                disabled={
                  !shopAcceptingOrders ||
                  isPending ||
                  (paymentMethod === PaymentMethod.ONLINE &&
                    !upiTransactionId.trim())
                }
                className="w-full h-12 rounded-xl font-bold transition-all duration-300 bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.98] text-white shadow-md shadow-blue-500/10 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none border-none cursor-pointer"
                size="lg"
              >
                {isPending
                  ? "Processing Order..."
                  : shopAcceptingOrders
                    ? `Place Order - ₹${total.toFixed(2)}`
                    : "Shop is not accepting orders"}
              </Button>
              {!shopAcceptingOrders && (
                <p className="text-xs text-rose-500 text-center font-semibold">
                  Orders are paused by the shop right now. Please try again
                  later.
                </p>
              )}

              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
                className="w-full h-11 rounded-xl font-semibold border-border/60 hover:bg-muted/30 cursor-pointer"
              >
                Back to Checkout
              </Button>
            </div>
          </SharedCard>
        </div>

        <div className="lg:col-span-1">
          <OrderSummary
            items={items}
            itemTotal={item_total}
            deliveryFee={deliveryFee}
            platformFee={platform_fee}
            total={total}
            isDirectDelivery={checkoutData.is_direct_delivery}
          />
        </div>
      </div>
    </>
  );
}
