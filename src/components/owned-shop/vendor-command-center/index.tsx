"use client";

import { addMinutes } from "date-fns";
import {
  AlertCircle,
  Clock,
  Loader2,
  Package,
  PackageCheck,
  Plus,
  Printer,
  RefreshCw,
  Store,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAcceptOrder,
  useCloseBatch,
  useCompleteBatch,
  useOrderConsoleData,
  useRejectOrder,
  useStartDelivery,
  useStartDirectDelivery,
  useUpdateBatchCutoffTime,
  useVerifyDeliveryOtp,
} from "@/hooks/queries/useBatch";
import { cn } from "@/lib/cn";
import {
  buildPrepSummary,
  getItemsText,
  groupByHostel,
} from "@/lib/utils/order-utils";
import { SerializedOrderWithDetails } from "@/types";

import { BatchControlBar } from "./batch-control-bar";
import { DispatchCard } from "./dispatch-card";
import { IntakeCard } from "./intake-card";
import { KpiPill } from "./kpi-pill";
import { PrepCard } from "./prep-card";
import { SectionHeader } from "./section-header";

/* ─── Constants ─── */

const EMPTY_ORDERS: SerializedOrderWithDetails[] = [];

/* ─── Notification Sound Hook ─── */

function useNewOrderAlert(currentCount: number) {
  const prevRef = useRef(currentCount);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current && typeof window !== "undefined") {
      try {
        const ctx = new AudioContext();
        const buffer = ctx.createBuffer(
          1,
          ctx.sampleRate * 0.15,
          ctx.sampleRate
        );
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] =
            Math.sin(2 * Math.PI * 880 * (i / ctx.sampleRate)) *
            Math.exp(-i / (ctx.sampleRate * 0.05));
        }
        audioRef.current = new Audio();
        (audioRef.current as unknown as Record<string, unknown>).__ctx = ctx;
        (audioRef.current as unknown as Record<string, unknown>).__buf = buffer;
      } catch {
        // Web Audio unavailable
      }
    }
  }, []);

  useEffect(() => {
    if (currentCount > prevRef.current && prevRef.current >= 0) {
      try {
        const el = audioRef.current as unknown as Record<
          string,
          unknown
        > | null;
        if (el?.__ctx && el?.__buf) {
          const ctx = el.__ctx as AudioContext;
          const buf = el.__buf as AudioBuffer;
          if (ctx.state === "suspended") ctx.resume();
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          src.start();
        }
      } catch {
        // Ignore audio errors
      }

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
    prevRef.current = currentCount;
  }, [currentCount]);
}

/* ─── Main Component ─── */

export function VendorCommandCenter() {
  const { data, isLoading, isFetching, isError, error } = useOrderConsoleData();

  const acceptMutation = useAcceptOrder();
  const rejectMutation = useRejectOrder();
  const startDirectMutation = useStartDirectDelivery();
  const updateCutoffMutation = useUpdateBatchCutoffTime();
  const closeBatchMutation = useCloseBatch();
  const startDeliveryMutation = useStartDelivery();
  const completeBatchMutation = useCompleteBatch();
  const verifyOtpMutation = useVerifyDeliveryOtp();

  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [selectedHostel, setSelectedHostel] = useState<string | null>(null);

  /* ─── Derived data ─── */

  const batchOrders = data?.batchOrders ?? EMPTY_ORDERS;
  const directOrders = data?.directOrders ?? EMPTY_ORDERS;
  const deliveryOrders = data?.deliveryOrders ?? EMPTY_ORDERS;
  const activeBatch = data?.activeBatch ?? null;

  const intakeOrders = useMemo(
    () =>
      [...batchOrders, ...directOrders].filter((o) => o.order_status === "NEW"),
    [batchOrders, directOrders]
  );

  const prepOrders = useMemo(
    () =>
      [...batchOrders, ...directOrders].filter(
        (o) => o.order_status === "BATCHED"
      ),
    [batchOrders, directOrders]
  );

  const prepSummary = useMemo(() => buildPrepSummary(prepOrders), [prepOrders]);

  const dispatchGroups = useMemo(
    () => groupByHostel(deliveryOrders),
    [deliveryOrders]
  );
  const dispatchEntries = useMemo(
    () => Object.entries(dispatchGroups),
    [dispatchGroups]
  );
  const activeHostel =
    selectedHostel && dispatchGroups[selectedHostel]
      ? selectedHostel
      : (dispatchEntries[0]?.[0] ?? null);
  const activeHostelOrders = activeHostel
    ? dispatchGroups[activeHostel] || EMPTY_ORDERS
    : EMPTY_ORDERS;

  const batchNewCount = batchOrders.filter(
    (o) => o.order_status === "NEW"
  ).length;
  const batchAcceptedCount = batchOrders.filter(
    (o) => o.order_status === "BATCHED"
  ).length;
  const remainingDispatch = deliveryOrders.filter(
    (o) =>
      o.batch?.id === activeBatch?.id &&
      (o.order_status === "BATCHED" || o.order_status === "OUT_FOR_DELIVERY")
  ).length;

  const pending =
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    startDirectMutation.isPending ||
    updateCutoffMutation.isPending ||
    closeBatchMutation.isPending ||
    startDeliveryMutation.isPending ||
    completeBatchMutation.isPending ||
    verifyOtpMutation.isPending;

  /* ─── New order notification ─── */

  useNewOrderAlert(intakeOrders.length);

  /* ─── Handlers ─── */

  const acceptOrder = useCallback(
    (id: string) => acceptMutation.mutate(id),
    [acceptMutation]
  );

  const rejectOrder = useCallback(
    (id: string) => {
      if (!window.confirm("Reject this order?")) return;
      rejectMutation.mutate({ orderId: id });
    },
    [rejectMutation]
  );

  const verifyOtp = useCallback(
    (orderId: string) => {
      const otp = otpInputs[orderId] || "";
      if (otp.length !== 4) {
        toast.error("Enter the 4-digit OTP.");
        return;
      }
      verifyOtpMutation.mutate(
        { orderId, otp },
        {
          onSuccess: () => {
            setOtpInputs((prev) => {
              const next = { ...prev };
              delete next[orderId];
              return next;
            });
          },
        }
      );
    },
    [otpInputs, verifyOtpMutation]
  );

  const adjustCutoff = useCallback(
    (minutes: number) => {
      if (!activeBatch) return;
      updateCutoffMutation.mutate({
        batchId: activeBatch.id,
        newCutoffTime: addMinutes(new Date(activeBatch.cutoff_time), minutes),
      });
    },
    [activeBatch, updateCutoffMutation]
  );

  const closeBatch = useCallback(() => {
    if (!activeBatch) return;
    if (batchNewCount > 0) {
      toast.error(`Accept or reject ${batchNewCount} new batch orders first.`);
      return;
    }
    if (!window.confirm("Close this batch for delivery?")) return;
    closeBatchMutation.mutate(activeBatch.id);
  }, [activeBatch, batchNewCount, closeBatchMutation]);

  const startRun = useCallback(() => {
    if (!activeBatch) return;
    startDeliveryMutation.mutate(activeBatch.id);
  }, [activeBatch, startDeliveryMutation]);

  const completeRun = useCallback(() => {
    if (!activeBatch) return;
    completeBatchMutation.mutate(activeBatch.id);
  }, [activeBatch, completeBatchMutation]);

  const handleOtpChange = useCallback((id: string, val: string) => {
    setOtpInputs((prev) => ({ ...prev, [id]: val.slice(0, 4) }));
  }, []);

  /* ─── Loading ─── */

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </main>
    );
  }

  /* ─── Error ─── */

  if (isError) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col items-center justify-center p-8 min-h-[60vh]">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 max-w-md text-center space-y-4 shadow-sm">
          <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-xl font-bold text-destructive">
            Failed to load dashboard
          </p>
          <p className="text-sm text-muted-foreground">
            {error?.message || "Try refreshing the page."}
          </p>
        </div>
      </main>
    );
  }

  /* ─── Empty (no data at all — likely no shop) ─── */

  if (!data) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col items-center justify-center p-6 min-h-[60vh]">
        <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 p-10 max-w-lg text-center space-y-6">
          <div className="mx-auto bg-background border shadow-sm w-20 h-20 rounded-full flex items-center justify-center">
            <Store className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black font-heading tracking-tight">
              No shop linked
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed font-medium">
              Create or link your shop to start selling. You can run direct
              delivery or configure batch delivery schedules later.
            </p>
          </div>
          <Button
            asChild
            className="w-full sm:w-auto shadow-sm gap-2 h-11 px-6 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 text-white border-none cursor-pointer"
          >
            <Link href="/create-shop">
              <Plus className="h-4 w-4" />
              Create / Link Shop
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const totalActive =
    intakeOrders.length + prepOrders.length + deliveryOrders.length;

  /* ─── Render ─── */

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 p-4 md:p-6 pb-24 no-print">
        {/* ── Header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-border/20 pb-4">
          <div>
            <h1 className="text-2xl font-black font-heading tracking-tight sm:text-3xl text-foreground">
              Order Console
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed font-medium">
              Intake incoming tickets, manage menu prep list, and dispatch
              hostel delivery batches.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-9 px-3 rounded-xl border-border/60 hover:bg-muted/30 font-semibold text-xs flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              Print KOT
            </Button>
            <div
              aria-live="polite"
              className="flex items-center gap-2 text-xs font-bold text-muted-foreground/80 bg-muted/30 border border-border/15 px-3 py-1.5 rounded-xl w-fit tabular-nums"
            >
              {isFetching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
              )}
              Live refresh · 10s
            </div>
          </div>
        </div>

        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiPill
            label="New Tickets"
            count={intakeOrders.length}
            theme="amber"
          />
          <KpiPill
            label="Prepping Console"
            count={prepOrders.length}
            theme="emerald"
          />
          <KpiPill
            label="Out For Delivery"
            count={deliveryOrders.length}
            theme="blue"
          />
        </div>

        {/* ── Section: Intake ── */}
        <section className="space-y-4">
          <SectionHeader
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            title="Intake Incoming"
            count={intakeOrders.length}
            themeColor="amber"
          />
          {intakeOrders.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {intakeOrders.map((order) => (
                <IntakeCard
                  key={order.id}
                  order={order}
                  onAccept={acceptOrder}
                  onReject={rejectOrder}
                  disabled={pending}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No New Orders"
              description="New batch and direct orders will appear here automatically."
            />
          )}
        </section>

        {/* ── Section: Prep ── */}
        <section className="space-y-4">
          <SectionHeader
            icon={<PackageCheck className="h-5 w-5 text-emerald-600" />}
            title="Prep & Kitchen Queue"
            count={prepOrders.length}
            themeColor="emerald"
          />

          {/* Aggregated item summary */}
          {prepSummary.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {prepSummary.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-border/20 bg-muted/15 p-3 text-xs flex items-center gap-2.5 shadow-xs transition-all hover:scale-102 hover:border-emerald-500/20 hover:bg-emerald-500/[0.01]"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-extrabold tabular-nums ring-2 ring-emerald-500/5">
                    {item.quantity}x
                  </div>
                  <div className="min-w-0 truncate font-semibold text-muted-foreground">
                    {item.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          {prepOrders.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {prepOrders.map((order) => (
                <PrepCard
                  key={order.id}
                  order={order}
                  onStartDirect={(id) => startDirectMutation.mutate(id)}
                  disabled={pending}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nothing in Prep"
              description="Accepted orders appear here until they move to dispatch."
            />
          )}
        </section>

        {/* ── Section: Dispatch ── */}
        <section className="space-y-4">
          <SectionHeader
            icon={<Truck className="h-5 w-5 text-blue-600" />}
            title="Dispatch & Delivery Runs"
            count={deliveryOrders.length}
            themeColor="blue"
          />

          {deliveryOrders.length > 0 ? (
            <div className="space-y-6">
              {/* Hostel tabs */}
              <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border/20 bg-muted/15 p-1.5 scrollbar-none">
                {dispatchEntries.map(([hostel, orders]) => {
                  const isSelected = hostel === activeHostel;
                  const pendingCount = orders.filter(
                    (o) =>
                      o.order_status === "BATCHED" ||
                      o.order_status === "OUT_FOR_DELIVERY"
                  ).length;
                  return (
                    <button
                      key={hostel}
                      type="button"
                      onClick={() => setSelectedHostel(hostel)}
                      className={cn(
                        "h-auto min-w-[128px] shrink-0 rounded-xl px-4 py-2.5 text-left transition-all duration-200 cursor-pointer border flex flex-col items-start",
                        isSelected
                          ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10"
                          : "bg-card text-muted-foreground border-border/40 hover:bg-muted/30 hover:text-foreground"
                      )}
                    >
                      <span className="text-xs font-bold truncate w-full">
                        {hostel}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] mt-0.5 font-bold",
                          isSelected
                            ? "text-blue-200"
                            : "text-muted-foreground/85"
                        )}
                      >
                        {pendingCount} pending
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active hostel orders */}
              {activeHostel && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 border-b border-border/20 pb-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-black font-heading text-base text-foreground">
                        Hostel {activeHostel}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium leading-normal">
                        Deliver all pending orders in this building before
                        continuing the run.
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="tabular-nums font-bold border-blue-500/20 bg-blue-500/10 text-blue-600 rounded-lg text-xs px-2.5 py-0.5"
                    >
                      {activeHostelOrders.length} Orders
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeHostelOrders.map((order) => (
                      <DispatchCard
                        key={order.id}
                        order={order}
                        otp={otpInputs[order.id] || ""}
                        onOtpChange={handleOtpChange}
                        onVerify={verifyOtp}
                        disabled={pending}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="No Dispatch Orders"
              description="Locked batch orders and accepted direct deliveries appear here."
            />
          )}
        </section>

        {/* Bottom spacer when no active orders */}
        {totalActive === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="font-bold text-muted-foreground">All clear</p>
            <p className="text-xs text-muted-foreground/75 mt-1.5 max-w-xs leading-relaxed font-medium">
              No active orders right now. New orders will appear automatically
              with a sound notification.
            </p>
          </div>
        )}
      </main>

      {/* ── Batch Control Bar ── */}
      <BatchControlBar
        activeBatch={activeBatch}
        batchNewCount={batchNewCount}
        batchAcceptedCount={batchAcceptedCount}
        remainingDispatch={remainingDispatch}
        pending={pending}
        onAdjustCutoff={adjustCutoff}
        onCloseBatch={closeBatch}
        onStartRun={startRun}
        onCompleteRun={completeRun}
      />

      {/* ── Print-only KOT section ── */}
      <div id="kot-print-section" className="print-only hidden p-6 font-sans">
        <div className="border-b-2 border-black pb-4 mb-4">
          <h1 className="text-2xl font-bold uppercase">
            Kitchen Order Ticket (KOT)
          </h1>
          <p className="text-sm" suppressHydrationWarning>
            Generated: {new Date().toLocaleTimeString()} -{" "}
            {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold uppercase mb-2">
            Prep List & Kitchen Queue
          </h2>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left">Quantity</th>
                <th className="border border-black p-2 text-left">Item Name</th>
              </tr>
            </thead>
            <tbody>
              {prepSummary.map((item) => (
                <tr key={item.name}>
                  <td className="border border-black p-2 font-bold">
                    {item.quantity}x
                  </td>
                  <td className="border border-black p-2">{item.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {dispatchEntries.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold uppercase mb-2">
              Hostel Dispatch List
            </h2>
            {dispatchEntries.map(([hostel, orders]) => (
              <div key={hostel} className="mb-6 break-inside-avoid">
                <h3 className="text-sm font-bold uppercase mb-1">
                  Hostel {hostel}
                </h3>
                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2 text-left w-16">
                        Room
                      </th>
                      <th className="border border-black p-2 text-left w-32">
                        Name
                      </th>
                      <th className="border border-black p-2 text-left">
                        Items
                      </th>
                      <th className="border border-black p-2 text-left w-24">
                        Payment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="border border-black p-2 font-bold">
                          {order.delivery_address_snapshot?.room_number}
                        </td>
                        <td className="border border-black p-2">
                          {order.user?.name || "Unknown"}
                        </td>
                        <td className="border border-black p-2">
                          {getItemsText(order)}
                        </td>
                        <td className="border border-black p-2">
                          {order.payment_method}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
