"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { OrderSummary } from "@/components/checkout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useCreateOrder,
  usePublicShopDeliveryBuildings,
  useUpdateUser,
} from "@/hooks";
import { authClient, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { CartItemData } from "@/types";
import {
  PaymentMethod,
  UserAddress as UserAddressType,
} from "@/types/prisma.types";

import { AddressStep } from "./address-step";
import { PaymentStep } from "./payment-step";
import { PhoneDialog } from "./phone-dialog";
import { TimingStep } from "./timing-step";

interface CheckoutFormProps {
  cart_id: string;
  shop_id: string;
  shopOpening?: string;
  shopClosing?: string;
  shopAcceptingOrders: boolean;
  direct_delivery_fee?: number;
  deliveryFee: number;
  platformFee: number;
  itemTotal: number;
  items: CartItemData[];
  batchSlots?: {
    id: string;
    cutoff_time_minutes: number;
    label: string | null;
  }[];
  qr_image_key?: string;
  upi_id?: string;
}

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
});

type CheckoutStep = "address" | "timing" | "payment";

export function CheckoutForm({
  cart_id: _cart_id,
  shop_id,
  shopOpening: _shopOpening,
  shopClosing: _shopClosing,
  shopAcceptingOrders,
  direct_delivery_fee = 0,
  deliveryFee = 0,
  platformFee = 0,
  itemTotal,
  items,
  batchSlots = [],
  qr_image_key = "",
  upi_id = "",
}: CheckoutFormProps) {
  const router = useRouter();
  const session = useSession();

  const [activeStep, setActiveStep] = useState<CheckoutStep>("address");
  const [completedSteps, setCompletedSteps] = useState<
    Record<CheckoutStep, boolean>
  >({
    address: false,
    timing: false,
    payment: false,
  });

  const [selectedAddress, setSelectedAddress] =
    useState<UserAddressType | null>(null);
  const [requestedDeliveryTime, setRequestedDeliveryTime] =
    useState<Date | null>(null);
  const [isDirectDelivery, setIsDirectDelivery] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);

  const { mutate: updateUser, isPending: isUpdatingPhone } = useUpdateUser();
  const { mutate: createOrder, isPending: isPlacingOrder } = useCreateOrder();

  const { data: allowedBuildings = [] } =
    usePublicShopDeliveryBuildings(shop_id);

  const isAddressAllowed = React.useMemo(() => {
    if (!selectedAddress) return true;
    if (allowedBuildings.length === 0) return true;

    if (selectedAddress.building_id) {
      return allowedBuildings.some((b) => b.id === selectedAddress.building_id);
    }

    return allowedBuildings.some(
      (b) => b.name.toLowerCase() === selectedAddress.building.toLowerCase()
    );
  }, [selectedAddress, allowedBuildings]);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
  });

  const activeDeliveryFee = isDirectDelivery
    ? direct_delivery_fee
    : deliveryFee;
  const total = itemTotal + activeDeliveryFee + platformFee;

  const upiRegex = /^[A-Za-z0-9]{10,}$/;
  const isUpiValid = upiRegex.test(upiTransactionId.trim());

  const handleSelectSlot = (date: Date | null) => {
    if (date === null) {
      setIsDirectDelivery(true);
      setRequestedDeliveryTime(null);
    } else {
      setIsDirectDelivery(false);
      setRequestedDeliveryTime(date);
    }
  };

  const handleAddressSelect = (address: UserAddressType) => {
    setSelectedAddress(address);
  };

  const validateDeliveryTime = (): boolean => {
    const hasBatchCards = batchSlots.length > 0;

    if (hasBatchCards && !requestedDeliveryTime && !isDirectDelivery) {
      toast.error("Please select a batch slot or direct delivery");
      return false;
    }

    if (isDirectDelivery || !requestedDeliveryTime) {
      return true;
    }

    const now = new Date();
    if (requestedDeliveryTime.getTime() <= now.getTime()) {
      toast.error("Selected batch slot is in the past");
      return false;
    }

    return true;
  };

  const handlePhoneSubmit = (values: z.infer<typeof phoneSchema>) => {
    updateUser(
      { phone: values.phone },
      {
        onSuccess: async () => {
          await authClient.updateUser({ phone: values.phone });
          setShowPhoneDialog(false);
          toast.success("Phone number saved");
          executeOrderSubmission();
        },
        onError: () => {
          toast.error("Failed to save phone number");
        },
      }
    );
  };

  const executeOrderSubmission = () => {
    if (!shopAcceptingOrders) {
      toast.error("This shop has currently paused new orders.");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!isAddressAllowed) {
      toast.error("This shop does not deliver to the selected building.");
      return;
    }

    if (!validateDeliveryTime()) {
      return;
    }

    if (paymentMethod === PaymentMethod.ONLINE) {
      if (!upiTransactionId.trim()) {
        toast.error("Please enter UPI transaction ID");
        return;
      }
      if (!isUpiValid) {
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
        delivery_address_id: selectedAddress.id,
        is_direct_delivery: isDirectDelivery,
        ...(requestedDeliveryTime && !isDirectDelivery
          ? { requested_delivery_time: requestedDeliveryTime }
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

  const handlePlaceOrder = () => {
    if (!session.data?.user?.phone) {
      setShowPhoneDialog(true);
      return;
    }
    executeOrderSubmission();
  };

  const handleStepConfirm = (nextStep: CheckoutStep) => {
    if (activeStep === "address") {
      if (!selectedAddress) {
        toast.error("Please select a delivery address");
        return;
      }
      if (!isAddressAllowed) {
        toast.error("This shop does not deliver to the selected building.");
        return;
      }
      setCompletedSteps((prev) => ({ ...prev, address: true }));
    } else if (activeStep === "timing") {
      if (!validateDeliveryTime()) return;
      setCompletedSteps((prev) => ({ ...prev, timing: true }));
    }

    setActiveStep(nextStep);
  };

  const handleStepEdit = (step: CheckoutStep) => {
    setActiveStep(step);
  };

  const handleCopyUpi = () => {
    if (upi_id) {
      navigator.clipboard.writeText(upi_id);
      toast.success("UPI ID copied to clipboard");
    }
  };

  const renderMasterActionButton = () => {
    const isAddressUnselected = !selectedAddress;
    const isTimingUnselected =
      batchSlots.length > 0 && !requestedDeliveryTime && !isDirectDelivery;
    const isUpiIncomplete =
      paymentMethod === PaymentMethod.ONLINE && !isUpiValid;

    let buttonText = `Place Order - ₹${total.toFixed(2)}`;
    let isDisabled = false;

    if (isAddressUnselected) {
      buttonText = "Select Delivery Address";
      isDisabled = true;
    } else if (!isAddressAllowed) {
      buttonText = "Undeliverable Address";
      isDisabled = true;
    } else if (isTimingUnselected) {
      buttonText = "Select Delivery Slot";
      isDisabled = true;
    } else if (isUpiIncomplete) {
      buttonText = "Enter Transaction ID";
      isDisabled = true;
    } else if (!shopAcceptingOrders) {
      buttonText = "Shop Paused Orders";
      isDisabled = true;
    }

    return (
      <Button
        onClick={handlePlaceOrder}
        disabled={isDisabled || isPlacingOrder}
        className="w-full h-12 rounded-xl font-bold transition-all duration-300 bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.98] text-white shadow-md shadow-blue-500/10 disabled:bg-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none border-none cursor-pointer"
        size="lg"
      >
        {isPlacingOrder ? "Processing Order..." : buttonText}
      </Button>
    );
  };

  return (
    <>
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-border/30 bg-card/25 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl shadow-blue-500/[0.01]">
            <div
              className={`p-5 flex items-center justify-between border-b border-border/10 cursor-pointer transition-colors ${
                activeStep === "address" ? "bg-muted/10" : ""
              }`}
              onClick={() =>
                completedSteps.address && handleStepEdit("address")
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center h-8 w-8 rounded-lg border font-bold text-xs transition-all duration-300 ${
                    completedSteps.address
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                      : activeStep === "address"
                        ? "bg-blue-600 border-blue-600 text-white shadow shadow-blue-600/10"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {completedSteps.address ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    "1"
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground tracking-tight">
                    Delivery Address
                  </h3>
                  {!completedSteps.address && (
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Select where your order should be delivered
                    </p>
                  )}
                  {completedSteps.address && selectedAddress && (
                    <p
                      className={cn(
                        "text-xs font-semibold truncate max-w-[280px] sm:max-w-md",
                        isAddressAllowed
                          ? "text-muted-foreground"
                          : "text-rose-500"
                      )}
                    >
                      {isAddressAllowed
                        ? `${selectedAddress.label}: ${selectedAddress.building}, Room ${selectedAddress.room_number}`
                        : `⚠️ Doesn't deliver to ${selectedAddress.building}`}
                    </p>
                  )}
                </div>
              </div>
              {completedSteps.address && activeStep !== "address" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-600/5 px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  Edit
                </Button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {activeStep === "address" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <AddressStep
                    selectedAddress={selectedAddress}
                    onAddressSelect={handleAddressSelect}
                    shop_id={shop_id}
                    isAddressAllowed={isAddressAllowed}
                    onConfirm={() => handleStepConfirm("timing")}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          <Card className="border border-border/30 bg-card/25 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl shadow-blue-500/[0.01]">
            <div
              className={`p-5 flex items-center justify-between border-b border-border/10 cursor-pointer transition-colors ${
                activeStep === "timing" ? "bg-muted/10" : ""
              } ${!completedSteps.address ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => completedSteps.timing && handleStepEdit("timing")}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center h-8 w-8 rounded-lg border font-bold text-xs transition-all duration-300 ${
                    completedSteps.timing
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                      : activeStep === "timing"
                        ? "bg-blue-600 border-blue-600 text-white shadow shadow-blue-600/10"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {completedSteps.timing ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    "2"
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground tracking-tight">
                    Delivery Batch Timing
                  </h3>
                  {!completedSteps.timing && (
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Select delivery speed or consolidated batch
                    </p>
                  )}
                  {completedSteps.timing && (
                    <p className="text-xs text-muted-foreground font-semibold">
                      {isDirectDelivery
                        ? "Direct Delivery - Dispatch ASAP"
                        : `Batch delivery slot - ${requestedDeliveryTime?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`}
                    </p>
                  )}
                </div>
              </div>
              {completedSteps.timing && activeStep !== "timing" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-600/5 px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  Edit
                </Button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {activeStep === "timing" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <TimingStep
                    batchSlots={batchSlots}
                    requestedDeliveryTime={requestedDeliveryTime}
                    isDirectDelivery={isDirectDelivery}
                    direct_delivery_fee={direct_delivery_fee}
                    onSelectSlot={handleSelectSlot}
                    onConfirm={() => handleStepConfirm("payment")}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          <Card className="border border-border/30 bg-card/25 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl shadow-blue-500/[0.01]">
            <div
              className={`p-5 flex items-center justify-between border-b border-border/10 cursor-pointer transition-colors ${
                activeStep === "payment" ? "bg-muted/10" : ""
              } ${!completedSteps.timing ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() =>
                completedSteps.payment && handleStepEdit("payment")
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center h-8 w-8 rounded-lg border font-bold text-xs transition-all duration-300 ${
                    completedSteps.payment
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                      : activeStep === "payment"
                        ? "bg-blue-600 border-blue-600 text-white shadow shadow-blue-600/10"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  "3"
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground tracking-tight">
                    Payment Method
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Select COD or complete UPI transactions securely
                  </p>
                </div>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {activeStep === "payment" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <PaymentStep
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    upiTransactionId={upiTransactionId}
                    setUpiTransactionId={setUpiTransactionId}
                    isPlacingOrder={isPlacingOrder}
                    isUpiValid={isUpiValid}
                    upi_id={upi_id}
                    qr_image_key={qr_image_key}
                    total={total}
                    handleCopyUpi={handleCopyUpi}
                    masterActionButton={renderMasterActionButton()}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <OrderSummary
            items={items}
            itemTotal={itemTotal}
            deliveryFee={activeDeliveryFee}
            platformFee={platformFee}
            total={total}
            isDirectDelivery={isDirectDelivery}
            actionButton={renderMasterActionButton()}
          />
          {!shopAcceptingOrders && (
            <p className="mt-3 text-xs font-semibold text-center text-rose-500/90 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
              This shop is currently paused and cannot process new order baskets
              at this time.
            </p>
          )}
        </div>
      </div>

      <PhoneDialog
        open={showPhoneDialog}
        onOpenChange={setShowPhoneDialog}
        phoneForm={phoneForm}
        onSubmit={handlePhoneSubmit}
        isUpdatingPhone={isUpdatingPhone}
      />
    </>
  );
}
