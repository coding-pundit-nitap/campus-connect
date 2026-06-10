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
  Printer,
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
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  getItemsText,
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

/* ─── Sub-components ─── */

function SectionHeader({
  icon,
  title,
  count,
  themeColor = "blue",
}: {
  icon: ReactNode;
  title: string;
  count: number;
  themeColor?: "amber" | "emerald" | "blue";
}) {
  const badgeColors = {
    amber:
      "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    emerald:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  }[themeColor];

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/20 pb-2.5">
      <h2 className="flex min-w-0 items-center gap-2.5 text-base font-black font-heading text-foreground">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{title}</span>
      </h2>
      <Badge
        variant="outline"
        className={cn(
          "tabular-nums font-bold rounded-lg text-xs px-2.5 py-0.5",
          badgeColors
        )}
      >
        {count} Active
      </Badge>
    </div>
  );
}

function OrderMeta({ order }: { order: SerializedOrderWithDetails }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground font-semibold mt-1">
      <span>{format(new Date(order.created_at), "h:mm a")}</span>
      <span aria-hidden className="opacity-40">
        ·
      </span>
      <span>
        {order.delivery_address_snapshot?.hostel_block ||
          order.delivery_address_snapshot?.building}
      </span>
      <span aria-hidden className="opacity-40">
        ·
      </span>
      <span>Room {order.delivery_address_snapshot?.room_number}</span>
    </div>
  );
}

/* ─── KPI Pill ─── */

function KpiPill({
  label,
  count,
  theme,
}: {
  label: string;
  count: number;
  theme: "amber" | "emerald" | "blue";
}) {
  const styles = {
    amber: {
      bg: "bg-amber-500/[0.08] dark:bg-amber-500/[0.04]",
      border: "border-amber-500/20",
      text: "text-amber-600 dark:text-amber-400",
      ring: "bg-amber-500/10 ring-4 ring-amber-500/10",
      badgeBg: "bg-amber-500 text-white shadow-md shadow-amber-500/20",
    },
    emerald: {
      bg: "bg-emerald-500/[0.08] dark:bg-emerald-500/[0.04]",
      border: "border-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400",
      ring: "bg-emerald-500/10 ring-4 ring-emerald-500/10",
      badgeBg: "bg-emerald-500 text-white shadow-md shadow-emerald-500/20",
    },
    blue: {
      bg: "bg-blue-500/[0.08] dark:bg-blue-500/[0.04]",
      border: "border-blue-500/20",
      text: "text-blue-600 dark:text-blue-400",
      ring: "bg-blue-500/10 ring-4 ring-blue-500/10",
      badgeBg: "bg-blue-500 text-white shadow-md shadow-blue-500/20",
    },
  }[theme];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-xs backdrop-blur-md transition-all duration-300 hover:scale-102",
        styles.bg,
        styles.border
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold transition-all duration-300",
          styles.badgeBg,
          styles.ring
        )}
      >
        {count}
      </div>
      <span
        className={cn(
          "text-xs font-bold uppercase tracking-wider",
          styles.text
        )}
      >
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
    <Card className="bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl shadow-md overflow-hidden hover:scale-[1.01] hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/[0.02] transition-all duration-200 flex flex-col justify-between">
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold font-heading text-sm text-foreground">
                  {order.display_id}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] tracking-wider uppercase px-1.5 py-0 rounded-md font-bold",
                    order.is_direct_delivery
                      ? "border-red-500/20 bg-red-500/10 text-red-500"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-500"
                  )}
                >
                  {order.is_direct_delivery ? "Direct" : "Batch"}
                </Badge>
              </div>
              <OrderMeta order={order} />
            </div>
            <div className="text-right shrink-0 tabular-nums">
              <div className="font-extrabold text-foreground text-sm">
                {formatCurrency(order.total_price)}
              </div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                {order.payment_method}
              </div>
            </div>
          </div>

          <Separator className="bg-border/20" />

          <p className="line-clamp-2 wrap-break-word text-xs text-muted-foreground font-semibold leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border/10">
            {getItemsText(order)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onReject(order.id)}
            disabled={disabled}
            className="h-10 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 font-bold text-xs cursor-pointer transition-all duration-200 hover:scale-102 active:scale-98"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Reject
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onAccept(order.id)}
            disabled={disabled}
            className="h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer transition-all duration-200 hover:scale-102 active:scale-98 shadow shadow-amber-500/10 border-none"
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            Accept
          </Button>
        </div>
      </div>
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
    <Card className="bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl shadow-md overflow-hidden hover:scale-[1.01] hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/[0.02] transition-all duration-200 flex flex-col justify-between">
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold font-heading text-sm text-foreground">
                  {order.display_id}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] tracking-wider uppercase px-1.5 py-0 rounded-md font-bold",
                    order.is_direct_delivery
                      ? "border-red-500/20 bg-red-500/10 text-red-500"
                      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                  )}
                >
                  {order.is_direct_delivery ? "Direct" : "Accepted"}
                </Badge>
              </div>
              <OrderMeta order={order} />
            </div>
            <span className="text-sm font-extrabold text-foreground tabular-nums shrink-0">
              {formatCurrency(order.total_price)}
            </span>
          </div>

          <Separator className="bg-border/20" />

          <p className="wrap-break-word text-xs text-muted-foreground font-semibold leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border/10">
            {getItemsText(order)}
          </p>
        </div>

        {order.is_direct_delivery && (
          <Button
            type="button"
            size="sm"
            onClick={() => onStartDirect(order.id)}
            disabled={disabled}
            className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer transition-all duration-200 hover:scale-102 active:scale-98 shadow shadow-emerald-500/10 border-none mt-3"
          >
            <Bike className="mr-1.5 h-3.5 w-3.5" />
            Start Direct Delivery
          </Button>
        )}
      </div>
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
    <Card className="bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl shadow-md overflow-hidden hover:scale-[1.01] hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/[0.02] transition-all duration-200 flex flex-col justify-between">
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold font-heading text-sm text-foreground">
                  {order.display_id}
                </span>
                {order.is_direct_delivery && (
                  <Badge
                    variant="outline"
                    className="text-[9px] tracking-wider uppercase px-1.5 py-0 rounded-md font-bold border-red-500/20 bg-red-500/10 text-red-500"
                  >
                    Direct
                  </Badge>
                )}
              </div>
              <div className="mt-0.5 text-xs font-bold text-foreground">
                Room {order.delivery_address_snapshot?.room_number}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-semibold mt-1">
                <span className="truncate max-w-[100px]">
                  {order.user?.name || "Unknown"}
                </span>
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 underline underline-offset-2"
                  >
                    <Phone className="h-2.5 w-2.5" />
                    {phone}
                  </a>
                )}
              </div>
            </div>
            <div className="text-right text-sm shrink-0 tabular-nums">
              <div className="font-extrabold text-foreground">
                {formatCurrency(order.total_price)}
              </div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                {order.payment_method}
              </div>
            </div>
          </div>

          <Separator className="bg-border/20" />

          <p className="wrap-break-word rounded-xl bg-muted/30 p-2.5 text-xs font-semibold text-muted-foreground leading-relaxed border border-border/10">
            {getItemsText(order)}
          </p>
        </div>

        <div className="mt-3.5 pt-1">
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
                className="text-center font-mono tracking-widest tabular-nums h-10 rounded-xl bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 text-xs font-bold"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => onVerify(order.id)}
                disabled={disabled || otp.length !== 4}
                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98 shadow shadow-blue-500/10 border-none"
              >
                Verify
              </Button>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border-blue-500/20 bg-blue-500/10 text-blue-600"
            >
              Ready for dispatch
            </Badge>
          )}
        </div>
      </div>
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
    <div className="sticky bottom-0 z-30 border-t border-border/40 bg-background/80 backdrop-blur-xl px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] no-print">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500" />
      <div className="mx-auto flex max-w-5xl flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg shrink-0">
            <TimerReset className="h-4 w-4 animate-pulse" />
          </div>
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-muted-foreground">
              Batch Cutoff{" "}
            </span>
            <span className="font-extrabold text-foreground tabular-nums bg-muted/40 px-2 py-0.5 rounded-md ml-1 border border-border/10">
              {format(new Date(activeBatch.cutoff_time), "h:mm a")}
            </span>
            <span className="text-muted-foreground mx-2">·</span>
            <span className="text-xs text-muted-foreground/80 font-bold uppercase tracking-wider">
              {batchAcceptedCount} accepted • {batchNewCount} new
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-border/40 rounded-xl overflow-hidden bg-card/40 p-0.5 mr-1 shadow-inner">
            <button
              type="button"
              onClick={() => onAdjustCutoff(-15)}
              disabled={pending}
              className="h-8 px-3 text-xs font-bold hover:bg-muted/60 transition-colors disabled:opacity-50 text-foreground cursor-pointer"
              title="Subtract 15 minutes"
            >
              −15m
            </button>
            <div className="w-[1px] h-4 bg-border/40" />
            <button
              type="button"
              onClick={() => onAdjustCutoff(15)}
              disabled={pending}
              className="h-8 px-3 text-xs font-bold hover:bg-muted/60 transition-colors disabled:opacity-50 text-foreground cursor-pointer"
              title="Add 15 minutes"
            >
              +15m
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCloseBatch}
            disabled={pending}
            className="h-9 px-4 rounded-xl border-border/60 hover:bg-muted/30 font-semibold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98"
          >
            Close Batch
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onStartRun}
            disabled={activeBatch.status !== "LOCKED" || pending}
            className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98 shadow shadow-blue-500/10 border-none"
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
            className="h-9 px-4 rounded-xl border-border/60 hover:bg-muted/30 font-semibold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
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
              className="h-9 px-3 rounded-xl border-border/60 hover:bg-muted/30 font-semibold text-xs cursor-pointer flex items-center gap-1.5"
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
          <p className="text-sm">
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
