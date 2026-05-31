"use client";

import { addMinutes, format } from "date-fns";
import {
  AlertCircle,
  Bike,
  Check,
  Clock,
  Loader2,
  Package,
  PackageCheck,
  Phone,
  Plus,
  RefreshCw,
  Store,
  TimerReset,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
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
import { formatCurrency } from "@/lib/utils/currency";
import {
  buildPrepSummary,
  getHostel,
  getItemsText,
  getRoom,
  groupByHostel,
} from "@/lib/utils/order-utils";
import { SerializedOrderWithDetails } from "@/types";

/* ─── Constants ─── */

const EMPTY_ORDERS: SerializedOrderWithDetails[] = [];

/* ─── Notification Sound Hook ─── */

function useNewOrderAlert(currentCount: number) {
  const prevRef = useRef(currentCount);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element once — uses a simple beep via Web Audio API fallback
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
        // Store a dummy element to avoid re-creation, actual playback uses ctx
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
      // Play notification sound
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

      // Vibrate on mobile
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
    prevRef.current = currentCount;
  }, [currentCount]);
}

/* ─── Sub-components ─── */

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex min-w-0 items-center gap-2 text-lg font-semibold">
        {icon}
        <span className="truncate">{title}</span>
      </h2>
      <Badge variant="secondary" className="tabular-nums">
        {count}
      </Badge>
    </div>
  );
}

function OrderMeta({ order }: { order: SerializedOrderWithDetails }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span>{format(new Date(order.created_at), "h:mm a")}</span>
      <span aria-hidden>·</span>
      <span>{getHostel(order)}</span>
      <span aria-hidden>·</span>
      <span>Room {getRoom(order)}</span>
    </div>
  );
}

/* ─── KPI Pill ─── */

function KpiPill({
  label,
  count,
  colorClass,
}: {
  label: string;
  count: number;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg text-white text-sm font-bold",
          colorClass
        )}
      >
        {count}
      </div>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

/* ─── Intake Card ─── */

function IntakeCard({
  order,
  onAccept,
  onReject,
  disabled,
}: {
  order: SerializedOrderWithDetails;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <Card className="rounded-lg border-l-4 border-l-amber-500 p-0">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{order.display_id}</span>
              <Badge
                variant={order.is_direct_delivery ? "destructive" : "outline"}
              >
                {order.is_direct_delivery ? "Direct" : "Batch"}
              </Badge>
            </div>
            <OrderMeta order={order} />
          </div>
          <div className="text-right shrink-0 tabular-nums">
            <div className="font-semibold">
              {formatCurrency(order.total_price)}
            </div>
            <div className="text-xs text-muted-foreground">
              {order.payment_method}
            </div>
          </div>
        </div>

        <p className="line-clamp-2 wrap-break-word text-sm text-muted-foreground">
          {getItemsText(order)}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onReject(order.id)}
            disabled={disabled}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Reject
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onAccept(order.id)}
            disabled={disabled}
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Prep Card ─── */

function PrepCard({
  order,
  onStartDirect,
  disabled,
}: {
  order: SerializedOrderWithDetails;
  onStartDirect: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <Card className="rounded-lg border-l-4 border-l-emerald-500 p-0">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{order.display_id}</span>
              <Badge
                variant={order.is_direct_delivery ? "destructive" : "secondary"}
              >
                {order.is_direct_delivery ? "Direct" : "Accepted"}
              </Badge>
            </div>
            <OrderMeta order={order} />
          </div>
          <span className="text-sm font-semibold tabular-nums shrink-0">
            {formatCurrency(order.total_price)}
          </span>
        </div>
        <p className="wrap-break-word text-sm">{getItemsText(order)}</p>
        {order.is_direct_delivery && (
          <Button
            type="button"
            size="sm"
            onClick={() => onStartDirect(order.id)}
            disabled={disabled}
            className="w-full"
          >
            <Bike className="mr-1.5 h-3.5 w-3.5" />
            Start Direct Delivery
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Dispatch Card ─── */

function DispatchCard({
  order,
  otp,
  onOtpChange,
  onVerify,
  disabled,
}: {
  order: SerializedOrderWithDetails;
  otp: string;
  onOtpChange: (id: string, val: string) => void;
  onVerify: (id: string) => void;
  disabled: boolean;
}) {
  const phone = order.user?.phone;

  return (
    <Card className="rounded-lg border-l-4 border-l-blue-500 p-0">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{order.display_id}</span>
              {order.is_direct_delivery && (
                <Badge variant="destructive">Direct</Badge>
              )}
            </div>
            <div className="mt-0.5 text-sm font-medium">
              Room {getRoom(order)}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{order.user?.name || "Unknown"}</span>
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {phone}
                </a>
              )}
            </div>
          </div>
          <div className="text-right text-sm tabular-nums shrink-0">
            <div className="font-semibold">
              {formatCurrency(order.total_price)}
            </div>
            <div className="text-xs text-muted-foreground">
              {order.payment_method}
            </div>
          </div>
        </div>

        <p className="wrap-break-word rounded-md bg-muted/60 p-2.5 text-sm">
          {getItemsText(order)}
        </p>

        {order.order_status === "OUT_FOR_DELIVERY" ? (
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input
              aria-label={`OTP for ${order.display_id}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              spellCheck={false}
              pattern="[0-9]*"
              maxLength={4}
              placeholder="OTP…"
              value={otp}
              onChange={(e) =>
                onOtpChange(order.id, e.target.value.replace(/\D/g, ""))
              }
              className="text-center font-mono tracking-widest tabular-nums"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => onVerify(order.id)}
              disabled={disabled || otp.length !== 4}
            >
              Verify
            </Button>
          </div>
        ) : (
          <Badge variant="outline">Ready for dispatch</Badge>
        )}
      </CardContent>
    </Card>
  );
}

function BatchControlBar({
  activeBatch,
  batchNewCount,
  batchAcceptedCount,
  remainingDispatch,
  pending,
  onAdjustCutoff,
  onCloseBatch,
  onStartRun,
  onCompleteRun,
}: {
  activeBatch: { id: string; cutoff_time: string; status: string } | null;
  batchNewCount: number;
  batchAcceptedCount: number;
  remainingDispatch: number;
  pending: boolean;
  onAdjustCutoff: (min: number) => void;
  onCloseBatch: () => void;
  onStartRun: () => void;
  onCompleteRun: () => void;
}) {
  if (!activeBatch) return null;

  return (
    <div className="sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur-md px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <TimerReset className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">Cutoff </span>
            <span className="font-bold tabular-nums">
              {format(new Date(activeBatch.cutoff_time), "h:mm a")}
            </span>
            <span className="text-muted-foreground"> · </span>
            <span className="text-xs text-muted-foreground">
              {batchAcceptedCount} accepted · {batchNewCount} new
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAdjustCutoff(-15)}
            disabled={pending}
            className="h-8 px-3 text-xs"
          >
            −15m
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAdjustCutoff(15)}
            disabled={pending}
            className="h-8 px-3 text-xs"
          >
            +15m
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCloseBatch}
            disabled={pending}
            className="h-8 px-3 text-xs"
          >
            Close Batch
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onStartRun}
            disabled={activeBatch.status !== "LOCKED" || pending}
            className="h-8 px-3 text-xs"
          >
            <Truck className="mr-1 h-3.5 w-3.5" />
            Start Run
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCompleteRun}
            disabled={
              activeBatch.status !== "IN_TRANSIT" ||
              remainingDispatch > 0 ||
              pending
            }
            className="h-8 px-3 text-xs"
          >
            Complete Run
          </Button>
        </div>
      </div>
    </div>
  );
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
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 p-10 max-w-lg text-center space-y-6">
          <div className="mx-auto bg-background border shadow-sm w-20 h-20 rounded-full flex items-center justify-center">
            <Store className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              No shop linked
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Create or link your shop to start selling. You can run direct
              delivery or configure batch delivery schedules later.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto shadow-sm gap-2">
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
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 p-4 md:p-6">
        {/* ── Header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Order Console
            </h1>
            <p className="text-sm text-muted-foreground">
              Intake, prep, and dispatch — all in one place.
            </p>
          </div>
          <div
            aria-live="polite"
            className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums"
          >
            {isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Live · 10s refresh
          </div>
        </div>

        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-3 gap-3">
          <KpiPill
            label="New"
            count={intakeOrders.length}
            colorClass="bg-amber-500"
          />
          <KpiPill
            label="Prepping"
            count={prepOrders.length}
            colorClass="bg-emerald-600"
          />
          <KpiPill
            label="Delivering"
            count={deliveryOrders.length}
            colorClass="bg-blue-600"
          />
        </div>

        {/* ── Section: Intake ── */}
        <section className="space-y-4">
          <SectionHeader
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            title="Intake"
            count={intakeOrders.length}
          />
          {intakeOrders.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
            title="Prep"
            count={prepOrders.length}
          />

          {/* Aggregated item summary */}
          {prepSummary.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {prepSummary.map((item) => (
                <div
                  key={item.name}
                  className="rounded-lg border bg-muted/40 p-3 text-sm"
                >
                  <div className="font-semibold tabular-nums">
                    {item.quantity}×
                  </div>
                  <div className="min-w-0 truncate text-muted-foreground">
                    {item.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          {prepOrders.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
            title="Dispatch"
            count={deliveryOrders.length}
          />

          {deliveryOrders.length > 0 ? (
            <div className="space-y-5">
              {/* Hostel tabs */}
              <div className="flex gap-2 overflow-x-auto rounded-lg border bg-muted/30 p-2">
                {dispatchEntries.map(([hostel, orders]) => {
                  const isSelected = hostel === activeHostel;
                  const pendingCount = orders.filter(
                    (o) =>
                      o.order_status === "BATCHED" ||
                      o.order_status === "OUT_FOR_DELIVERY"
                  ).length;
                  return (
                    <Button
                      key={hostel}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedHostel(hostel)}
                      className="h-auto min-w-32 shrink-0 justify-start py-2"
                    >
                      <span className="flex min-w-0 flex-col items-start">
                        <span className="truncate">{hostel}</span>
                        <span className="text-xs opacity-80">
                          {pendingCount} pending
                        </span>
                      </span>
                    </Button>
                  );
                })}
              </div>

              {/* Active hostel orders */}
              {activeHostel && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 border-b pb-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">
                        Hostel {activeHostel}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Deliver these orders before moving to the next hostel.
                      </p>
                    </div>
                    <Badge variant="outline" className="tabular-nums">
                      {activeHostelOrders.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
            <p className="font-semibold text-muted-foreground">All clear</p>
            <p className="text-xs text-muted-foreground/75 mt-1 max-w-xs">
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
    </div>
  );
}
