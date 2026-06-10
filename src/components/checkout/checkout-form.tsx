"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Phone,
  QrCode,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { OrderSummary, UserAddress } from "@/components/checkout";
import { BatchSlotSelector } from "@/components/checkout/batch-slot-selector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateOrder,
  usePublicShopDeliveryBuildings,
  useUpdateUser,
} from "@/hooks";
import { authClient, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { ImageUtils } from "@/lib/utils";
import { CartItemData } from "@/types";
import {
  PaymentMethod,
  UserAddress as UserAddressType,
} from "@/types/prisma.types";

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
        className="w-full h-12 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r from-blue-600 to-orange-500 hover:scale-[1.01] active:scale-[0.98] text-white shadow-lg shadow-orange-500/20 disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none border-none cursor-pointer"
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
                        ? "bg-orange-500 border-orange-500 text-white shadow shadow-orange-500/20"
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
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="p-5 border-t border-border/10 space-y-4">
                    <UserAddress
                      selectedAddressId={selectedAddress?.id || null}
                      onAddressSelect={handleAddressSelect}
                      shopId={shop_id}
                    />
                    {selectedAddress && (
                      <div className="space-y-3 w-full">
                        {!isAddressAllowed && (
                          <div className="p-3.5 bg-rose-500/5 border border-rose-500/15 text-rose-500 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <span className="text-sm">⚠️</span>
                            <div>
                              This shop does not deliver to{" "}
                              {selectedAddress.building}.
                              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                                Please select or add a different address inside
                                the shop's delivery zone.
                              </p>
                            </div>
                          </div>
                        )}
                        <Button
                          onClick={() => handleStepConfirm("timing")}
                          disabled={!isAddressAllowed}
                          className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90 text-white font-bold rounded-xl shadow shadow-blue-500/10 mt-2 flex items-center justify-center gap-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                        >
                          Confirm Address & Next{" "}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
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
                        ? "bg-orange-500 border-orange-500 text-white shadow shadow-orange-500/20"
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
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="p-5 border-t border-border/10 space-y-4">
                    {batchSlots.length > 0 ? (
                      <BatchSlotSelector
                        batchSlots={batchSlots}
                        selectedSlot={requestedDeliveryTime}
                        isDirectDelivery={isDirectDelivery}
                        directDeliveryFee={direct_delivery_fee}
                        onSlotSelect={handleSelectSlot}
                      />
                    ) : (
                      <div className="p-4 bg-muted/20 border border-border/20 rounded-xl text-center">
                        <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-pulse" />
                        <h4 className="font-bold text-sm">
                          Direct Dispatch Delivery
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto mt-1">
                          This shop operates with instant direct shipping and
                          doesn't run scheduled batch cards.
                        </p>
                      </div>
                    )}
                    {(isDirectDelivery ||
                      requestedDeliveryTime ||
                      batchSlots.length === 0) && (
                      <Button
                        onClick={() => handleStepConfirm("payment")}
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90 text-white font-bold rounded-xl shadow shadow-blue-500/10 mt-2 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Confirm Slot & Next <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
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
                        ? "bg-orange-500 border-orange-500 text-white shadow shadow-orange-500/20"
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
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="p-5 border-t border-border/10 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div
                        onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                        className={cn(
                          "flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-300 bg-card/30 hover:translate-y-[-2px] relative overflow-hidden",
                          paymentMethod === PaymentMethod.CASH
                            ? "ring-2 ring-blue-600/50 bg-blue-600/[0.03] border-blue-600 shadow-md"
                            : "border-border/40 hover:border-border/80"
                        )}
                      >
                        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white shrink-0 shadow">
                          <Wallet className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm tracking-tight text-foreground">
                            Cash on Delivery
                          </h4>
                          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-snug">
                            Pay with cash to courier once delivery reaches your
                            block.
                          </p>
                        </div>
                        {paymentMethod === PaymentMethod.CASH && (
                          <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center absolute top-4 right-4 animate-in zoom-in-50 duration-200">
                            <Check className="h-2.5 w-2.5 text-white stroke-[3.5]" />
                          </div>
                        )}
                      </div>

                      <div
                        onClick={() => setPaymentMethod(PaymentMethod.ONLINE)}
                        className={cn(
                          "flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-300 bg-card/30 hover:translate-y-[-2px] relative overflow-hidden",
                          paymentMethod === PaymentMethod.ONLINE
                            ? "ring-2 ring-blue-600/50 bg-blue-600/[0.03] border-blue-600 shadow-md"
                            : "border-border/40 hover:border-border/80"
                        )}
                      >
                        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shrink-0 shadow">
                          <QrCode className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm tracking-tight text-foreground">
                            UPI Payment
                          </h4>
                          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-snug">
                            Instant scan payment via Google Pay, PhonePe, Paytm.
                          </p>
                        </div>
                        {paymentMethod === PaymentMethod.ONLINE && (
                          <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center absolute top-4 right-4 animate-in zoom-in-50 duration-200">
                            <Check className="h-2.5 w-2.5 text-white stroke-[3.5]" />
                          </div>
                        )}
                      </div>
                    </div>

                    {paymentMethod === PaymentMethod.ONLINE && (
                      <div className="p-5 border border-border/20 rounded-2xl bg-muted/20 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-tr from-blue-600/10 to-orange-500/10 rounded-full blur-xl pointer-events-none" />

                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-foreground">
                            UPI QR Verification
                          </h4>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            Scan this QR using your payment client app and
                            submit the Transaction ID below.
                          </p>
                        </div>

                        <div className="flex justify-center">
                          <div className="relative p-4 bg-white dark:bg-white rounded-2xl shadow-xl border border-white/50 max-w-[210px] group transition-transform duration-300 hover:scale-[1.02]">
                            <Image
                              src={ImageUtils.getImageUrl(qr_image_key)}
                              alt="UPI QR Code"
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
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyUpi}
                                className="h-8 w-8 p-0 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
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
                            htmlFor="tx-id"
                            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                          >
                            UPI Transaction ID{" "}
                            <span className="text-rose-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="tx-id"
                              placeholder="Enter 12-digit transaction ID"
                              value={upiTransactionId}
                              onChange={(e) =>
                                setUpiTransactionId(e.target.value)
                              }
                              disabled={isPlacingOrder}
                              className="h-11 bg-card/40 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/40 font-semibold uppercase tracking-wider pr-10"
                            />
                            {isUpiValid && (
                              <div className="absolute right-3.5 top-3 text-emerald-500 animate-in fade-in zoom-in-50 duration-300">
                                <CheckCircle2 className="h-5 w-5 fill-emerald-500/10 stroke-[2.5]" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground/80 font-medium">
                            Transaction reference IDs are alphanumeric and
                            typically 12+ characters long.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground/80 bg-muted/5 p-3 rounded-xl border border-border/10">
                      <ShieldCheck className="h-4.5 w-4.5 text-blue-600" />
                      <span>
                        Secured & encrypted with Campus Connect Protocol
                      </span>
                    </div>

                    <div className="pt-2">{renderMasterActionButton()}</div>
                  </div>
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
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-md bg-card border border-border/30 rounded-2xl overflow-hidden shadow-2xl p-6">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500" />
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-600/10 text-blue-600 shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              Phone Number Required
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground">
              Please register your active contact details for delivery couriers
              to communicate.
            </DialogDescription>
          </DialogHeader>

          <Form {...phoneForm}>
            <form
              onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)}
              className="space-y-5 pt-2"
            >
              <FormField
                control={phoneForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Mobile Phone Number
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="e.g. 9876543210"
                          {...field}
                          type="tel"
                          className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/40 font-semibold"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs font-semibold text-rose-500" />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPhoneDialog(false)}
                  className="h-10 px-5 rounded-xl border-border/60 font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingPhone}
                  className="h-10 px-6 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-orange-500 hover:opacity-90 active:scale-95 text-white shadow shadow-orange-500/10 cursor-pointer border-none"
                >
                  {isUpdatingPhone ? "Saving..." : "Save & Continue"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
