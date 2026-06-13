"use client";

import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Bike,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Compass,
  MapPin,
  Phone,
  ShieldAlert,
  User,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import React, { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BatchMilestone, ShopType } from "@/generated/client";
import { useOrderDetails } from "@/hooks/queries/useOrders";
import { formatCurrency } from "@/lib/utils/currency";

type Props = {
  orderId: string;
};

type MilestoneStep = {
  milestone: BatchMilestone;
  label: string;
  description: string;
  percentage: number;
};

const getMilestoneSteps = (shopType?: ShopType): MilestoneStep[] => {
  const isCanteen = shopType === "CANTEEN";
  return [
    {
      milestone: BatchMilestone.PACKING,
      label: "Packing Order",
      description:
        "The vendor is carefully packing and preparing items for the run.",
      percentage: 10,
    },
    {
      milestone: BatchMilestone.CLIMB_STARTED,
      label: isCanteen ? "Uphill Climb Started" : "Delivery Started",
      description: isCanteen
        ? "The rider has started the climb up the 100m hill to the hostel area."
        : "The rider has started the delivery run to your hostel block.",
      percentage: 40,
    },
    {
      milestone: BatchMilestone.MIDWAY_100M_HILL,
      label: isCanteen ? "Midway Uphill" : "In Transit",
      description: isCanteen
        ? "The rider is currently ascending the hill and making good progress."
        : "The rider is currently on the way and making good progress.",
      percentage: 70,
    },
    {
      milestone: BatchMilestone.ARRIVED,
      label: "Arrived at Hostel",
      description:
        "The rider has reached the hostel building! Meet them to collect your items.",
      percentage: 100,
    },
  ];
};

export default function OrderTrackingPage({ orderId }: Props) {
  const { data: order, isLoading, isError } = useOrderDetails(orderId);

  const shopType = order?.items?.[0]?.product?.shop?.shop_type;
  const isCanteen = shopType === "CANTEEN";
  const steps = useMemo(() => getMilestoneSteps(shopType), [shopType]);

  // Derive current milestone or default to PACKING
  const currentMilestone = useMemo(() => {
    if (!order?.batch?.delivery_status?.current_milestone) {
      // If order is completed, show ARRIVED. Otherwise show PACKING
      return order?.order_status === "COMPLETED"
        ? BatchMilestone.ARRIVED
        : BatchMilestone.PACKING;
    }
    return order.batch.delivery_status.current_milestone as BatchMilestone;
  }, [order]);

  const activeIndex = useMemo(() => {
    return steps.findIndex((s) => s.milestone === currentMilestone);
  }, [currentMilestone, steps]);

  const progressPercentage = useMemo(() => {
    if (activeIndex === -1) return 0;
    return steps[activeIndex].percentage;
  }, [activeIndex, steps]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-8 space-y-6 px-4">
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Card className="rounded-2xl border border-border/40 shadow-lg">
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !order) {
    return notFound();
  }

  const deliveryStatus = order.batch?.delivery_status;

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="rounded-xl border border-border/80 bg-card hover:bg-muted shadow-xs transition-all duration-200 hover:scale-105 active:scale-95 px-3 py-1.5 h-auto font-semibold flex items-center gap-1.5"
          asChild
        >
          <Link href={`/orders/${orderId}` as Route}>
            <ChevronLeft className="h-4 w-4" />
            Order Details
          </Link>
        </Button>
        <Badge
          className="bg-blue-500/10 border border-blue-500/20 text-blue-600 px-3 py-1 text-xs font-bold rounded-full capitalize"
          variant="outline"
        >
          {order.order_status.toLowerCase().replace("_", " ")}
        </Badge>
      </div>

      <Card className="rounded-3xl border-2 border-border/85 bg-card/65 backdrop-blur-xl shadow-xl overflow-hidden relative before:absolute before:top-0 before:left-0 before:right-0 before:h-[4px] before:bg-gradient-to-r before:from-blue-600 before:to-orange-500 before:z-10">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-black font-heading flex items-center gap-2">
                <Compass className="h-5 w-5 text-blue-600 animate-spin-slow" />
                Track Live climb
              </CardTitle>
              <CardDescription className="text-xs font-semibold mt-1">
                Order #{order.display_id} • from{" "}
                <span className="font-bold text-foreground">
                  {order.items?.[0]?.product?.shop?.name || "Campus Vendor"}
                </span>
              </CardDescription>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground font-bold block">
                TOTAL VALUE
              </span>
              <span className="text-base font-extrabold text-foreground font-mono">
                {formatCurrency(order.total_price)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          {/* Main Visual Stepper: vertical climbing representation */}
          <div className="relative border border-border/30 rounded-2xl bg-muted/20 p-6 flex flex-col md:flex-row gap-8 items-stretch justify-between overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-orange-500/[0.02]" />

            {/* Left side: Uphill climb stepper indicator */}
            <div className="relative flex-1 min-h-[300px] flex items-stretch">
              {/* Back track line */}
              <div className="absolute left-5 top-4 bottom-4 w-1 bg-border/40 rounded-full" />

              {/* Progress active path */}
              <motion.div
                className="absolute left-5 top-4 w-1 bg-gradient-to-b from-blue-500 to-orange-500 rounded-full origin-top"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: progressPercentage / 100 }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ bottom: "16px" }}
              />

              {/* Steps milestone layout */}
              <div className="relative flex flex-col justify-between w-full pl-12 py-2">
                {steps.map((step, index) => {
                  const isDone = index < activeIndex;
                  const isActive = index === activeIndex;

                  return (
                    <div
                      key={step.milestone}
                      className={`relative flex flex-col transition-all duration-300 ${
                        isActive ? "scale-102" : "opacity-75"
                      }`}
                    >
                      {/* Badge Marker */}
                      <div className="absolute left-[-42px] top-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background transition-all duration-300">
                        {isDone ? (
                          <div className="h-full w-full rounded-full bg-emerald-500 flex items-center justify-center text-white">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        ) : isActive ? (
                          <div className="h-full w-full rounded-full bg-orange-500 flex items-center justify-center text-white ring-4 ring-orange-500/20 animate-pulse">
                            <Bike className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="h-2.5 w-2.5 rounded-full bg-border" />
                        )}
                      </div>

                      <span
                        className={`text-xs font-black tracking-wide uppercase ${
                          isActive
                            ? "text-orange-500"
                            : isDone
                              ? "text-emerald-600"
                              : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                      <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Interactive map marker / 100m Hill illustration */}
            <div className="w-full md:w-48 bg-card/60 border border-border/40 rounded-xl p-4 flex flex-col justify-between items-center text-center relative overflow-hidden shrink-0">
              <div className="space-y-1 z-10">
                <span className="text-[10px] text-muted-foreground/80 tracking-wider uppercase font-bold block">
                  {isCanteen ? "Uphill elevation" : "Delivery route"}
                </span>
                <span className="text-xl font-black font-heading text-foreground">
                  {isCanteen ? "100m Hill Climb" : "Campus Delivery"}
                </span>
              </div>

              {/* Graphic animation */}
              <div className="w-full h-32 relative flex items-end justify-center py-2 z-10">
                {/* Hill Slant line */}
                <svg
                  className="w-full h-full absolute inset-0 text-muted-foreground/15"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0 90 Q 50 80 100 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>

                {/* Rider animation placement */}
                <motion.div
                  className="absolute"
                  animate={{
                    left: `${progressPercentage - 15}%`,
                    bottom: `${progressPercentage * 0.8}%`,
                  }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                >
                  <div className="p-2 bg-gradient-to-tr from-blue-600 to-orange-500 text-white rounded-full shadow-lg shadow-orange-500/10">
                    <Bike className="h-5 w-5 animate-pulse" />
                  </div>
                </motion.div>
              </div>

              <div className="text-[10px] text-muted-foreground font-bold tracking-wide uppercase z-10 bg-muted/40 px-2 py-1 rounded-md border border-border/10">
                Current progress: {progressPercentage}%
              </div>
            </div>
          </div>

          <Separator className="bg-border/40" />

          {/* Bottom logistics: security code / delivery details */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Delivery Details */}
            <div className="border border-border/30 rounded-2xl p-4 bg-muted/10 space-y-3">
              <span className="text-[10px] text-muted-foreground/80 tracking-wider uppercase font-bold block">
                DELIVERY INFORMATION
              </span>
              <div className="space-y-2 text-xs font-semibold">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground block text-[10px]">
                      ADDRESS
                    </span>
                    <span className="text-foreground font-bold">
                      Block{" "}
                      {order.delivery_address_snapshot?.hostel_block || "N/A"},
                      Room{" "}
                      {order.delivery_address_snapshot?.room_number || "N/A"}
                    </span>
                    {order.delivery_address_snapshot?.building && (
                      <span className="text-muted-foreground/80 block text-[10px]">
                        {order.delivery_address_snapshot.building}
                      </span>
                    )}
                  </div>
                </div>

                {deliveryStatus?.estimated_arrival && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        EST. ARRIVAL
                      </span>
                      <span className="text-foreground font-bold">
                        {format(
                          new Date(deliveryStatus.estimated_arrival),
                          "h:mm a"
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rider Details & OTP Verification */}
            <div className="border border-border/35 rounded-2xl p-4 bg-gradient-to-br from-blue-500/[0.01] to-orange-500/[0.01] space-y-3 relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground/80 tracking-wider uppercase font-bold block mb-1">
                  SECURITY CODE
                </span>
                {order.order_status === "COMPLETED" ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4" />
                    Delivery verification completed!
                  </div>
                ) : order.delivery_otp ? (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[11px] text-muted-foreground font-semibold">
                      Share this verification code with the rider upon arrival:
                    </p>
                    <div className="bg-card border border-border/50 rounded-xl px-4 py-2 w-fit text-lg font-black font-mono tracking-widest text-center shadow-inner text-blue-600">
                      {order.delivery_otp}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/10">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                    Verification OTP will display here once the batch is in
                    transit.
                  </div>
                )}
              </div>

              {/* Rider card */}
              {deliveryStatus?.rider_name && (
                <div className="flex items-center justify-between bg-card border border-border/50 rounded-xl p-2.5 mt-2 shadow-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-muted-foreground/70 block uppercase tracking-wider font-bold">
                        RIDER
                      </span>
                      <span className="text-xs font-bold text-foreground truncate block">
                        {deliveryStatus.rider_name}
                      </span>
                    </div>
                  </div>
                  {deliveryStatus.rider_phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg shadow-xs hover:border-blue-500/30 hover:text-blue-600 px-2 h-7"
                      asChild
                    >
                      <a href={`tel:${deliveryStatus.rider_phone}`}>
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-border/40" />

          {/* Interactive Item Checklist */}
          <div className="space-y-3">
            <span className="text-[10px] text-muted-foreground/80 tracking-wider uppercase font-bold block">
              ITEM CHECKLIST
            </span>
            <div className="divide-y divide-border/20 border border-border/30 rounded-2xl bg-card overflow-hidden">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 text-xs font-semibold"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-bold shrink-0">
                      {item.quantity}x
                    </span>
                    <span className="text-foreground truncate max-w-[280px]">
                      {item.product.name}
                    </span>
                  </div>
                  <span className="text-muted-foreground font-mono">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
