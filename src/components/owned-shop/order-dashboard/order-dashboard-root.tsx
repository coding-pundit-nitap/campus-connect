"use client";

import { addMinutes, format } from "date-fns";
import {
  Bike,
  Check,
  Clock,
  Loader2,
  PackageCheck,
  Phone,
  TimerReset,
  Truck,
  X,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
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
import { formatCurrency } from "@/lib/utils/currency";
import { SerializedOrderWithDetails } from "@/types";

const EMPTY_ORDERS: SerializedOrderWithDetails[] = [];

function getItemsText(order: SerializedOrderWithDetails) {
  return order.items
    .map((item) => `${item.quantity}x ${item.product.name}`)
    .join(", ");
}

function groupByHostel(orders: SerializedOrderWithDetails[]) {
  return orders.reduce<Record<string, SerializedOrderWithDetails[]>>(
    (groups, order) => {
      const hostel =
        order.delivery_address_snapshot?.hostel_block ||
        order.delivery_address_snapshot?.building ||
        "Other";
      groups[hostel] = groups[hostel] || [];
      groups[hostel].push(order);
      return groups;
    },
    {}
  );
}

function getPendingHostelCount(orders: SerializedOrderWithDetails[]) {
  return orders.filter(
    (order) =>
      order.order_status === "BATCHED" ||
      order.order_status === "OUT_FOR_DELIVERY"
  ).length;
}

function buildPrepSummary(orders: SerializedOrderWithDetails[]) {
  const summary = new Map<string, { name: string; quantity: number }>();

  for (const order of orders) {
    for (const item of order.items) {
      const current = summary.get(item.product.id) || {
        name: item.product.name,
        quantity: 0,
      };
      current.quantity += item.quantity;
      summary.set(item.product.id, current);
    }
  }

  return Array.from(summary.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

function SectionTitle({
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
      <h2 className="flex min-w-0 items-center gap-2 text-xl font-semibold text-pretty">
        {icon}
        <span className="truncate">{title}</span>
      </h2>
      <Badge variant="secondary">{count}</Badge>
    </div>
  );
}

function OrderMeta({ order }: { order: SerializedOrderWithDetails }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>{format(new Date(order.created_at), "h:mm a")}</span>
      <span aria-hidden="true">/</span>
      <span>
        {order.delivery_address_snapshot?.hostel_block ||
          order.delivery_address_snapshot?.building ||
          "Other"}
      </span>
      <span aria-hidden="true">/</span>
      <span>Room {order.delivery_address_snapshot?.room_number || "N/A"}</span>
    </div>
  );
}

function IntakeOrderCard({
  order,
  onAccept,
  onReject,
  disabled,
}: {
  order: SerializedOrderWithDetails;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  disabled: boolean;
}) {
  return (
    <Card className="gap-4 rounded-lg p-0">
      <CardContent className="space-y-4 p-4">
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
          <div className="text-right tabular-nums">
            <div className="font-semibold">
              {formatCurrency(order.total_price)}
            </div>
            <div className="text-xs text-muted-foreground">
              {order.payment_method}
            </div>
          </div>
        </div>

        <p className="line-clamp-2 break-words text-sm text-muted-foreground">
          {getItemsText(order)}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onReject(order.id)}
            disabled={disabled}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <X aria-hidden="true" />
            Reject
          </Button>
          <Button
            type="button"
            onClick={() => onAccept(order.id)}
            disabled={disabled}
          >
            <Check aria-hidden="true" />
            Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PrepOrderCard({
  order,
  onStartDirect,
  disabled,
}: {
  order: SerializedOrderWithDetails;
  onStartDirect: (orderId: string) => void;
  disabled: boolean;
}) {
  return (
    <Card className="gap-3 rounded-lg p-0">
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
          <span className="text-sm font-semibold tabular-nums">
            {formatCurrency(order.total_price)}
          </span>
        </div>
        <p className="break-words text-sm">{getItemsText(order)}</p>
        {order.is_direct_delivery ? (
          <Button
            type="button"
            size="sm"
            onClick={() => onStartDirect(order.id)}
            disabled={disabled}
            className="w-full"
          >
            <Bike aria-hidden="true" />
            Start Direct Delivery
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DispatchOrderCard({
  order,
  otp,
  onOtpChange,
  onVerify,
  disabled,
}: {
  order: SerializedOrderWithDetails;
  otp: string;
  onOtpChange: (orderId: string, otp: string) => void;
  onVerify: (orderId: string) => void;
  disabled: boolean;
}) {
  const phone = order.user?.phone;

  return (
    <Card className="gap-3 rounded-lg p-0">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{order.display_id}</span>
              {order.is_direct_delivery ? (
                <Badge variant="destructive">Direct</Badge>
              ) : null}
            </div>
            <div className="mt-1 text-sm font-medium">
              Room {order.delivery_address_snapshot?.room_number || "N/A"}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{order.user?.name || "Unknown"}</span>
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-1 rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Phone className="h-3 w-3" aria-hidden="true" />
                  {phone}
                </a>
              ) : null}
            </div>
          </div>
          <div className="text-right text-sm tabular-nums">
            <div className="font-semibold">
              {formatCurrency(order.total_price)}
            </div>
            <div className="text-xs text-muted-foreground">
              {order.payment_method}
            </div>
          </div>
        </div>

        <p className="break-words rounded-md bg-muted/60 p-3 text-sm">
          {getItemsText(order)}
        </p>

        {order.order_status === "OUT_FOR_DELIVERY" ? (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Input
              aria-label={`OTP for order ${order.display_id}`}
              name={`otp-${order.id}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              spellCheck={false}
              pattern="[0-9]*"
              maxLength={4}
              placeholder="OTP…"
              value={otp}
              onChange={(event) =>
                onOtpChange(order.id, event.target.value.replace(/\D/g, ""))
              }
              className="text-center font-mono tracking-widest tabular-nums"
            />
            <Button
              type="button"
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

export function OrderDashboardRoot() {
  const { data, isLoading, isFetching } = useOrderConsoleData();
  const acceptMutation = useAcceptOrder();
  const rejectMutation = useRejectOrder();
  const startDirectMutation = useStartDirectDelivery();
  const updateCutoffMutation = useUpdateBatchCutoffTime();
  const closeBatchMutation = useCloseBatch();
  const startDeliveryMutation = useStartDelivery();
  const completeBatchMutation = useCompleteBatch();
  const verifyOtpMutation = useVerifyDeliveryOtp();
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [selectedDispatchHostel, setSelectedDispatchHostel] = useState<
    string | null
  >(null);

  const batchOrders = data?.batchOrders ?? EMPTY_ORDERS;
  const directOrders = data?.directOrders ?? EMPTY_ORDERS;
  const deliveryOrders = data?.deliveryOrders ?? EMPTY_ORDERS;
  const activeBatch = data?.activeBatch ?? null;

  const intakeOrders = useMemo(
    () =>
      [...batchOrders, ...directOrders].filter(
        (order) => order.order_status === "NEW"
      ),
    [batchOrders, directOrders]
  );
  const prepOrders = useMemo(
    () =>
      [...batchOrders, ...directOrders].filter(
        (order) => order.order_status === "BATCHED"
      ),
    [batchOrders, directOrders]
  );
  const dispatchGroups = useMemo(
    () => groupByHostel(deliveryOrders),
    [deliveryOrders]
  );
  const dispatchEntries = useMemo(
    () => Object.entries(dispatchGroups),
    [dispatchGroups]
  );
  const activeDispatchHostel =
    selectedDispatchHostel && dispatchGroups[selectedDispatchHostel]
      ? selectedDispatchHostel
      : dispatchEntries[0]?.[0];
  const activeDispatchOrders = activeDispatchHostel
    ? dispatchGroups[activeDispatchHostel] || EMPTY_ORDERS
    : EMPTY_ORDERS;
  const prepSummary = useMemo(() => buildPrepSummary(prepOrders), [prepOrders]);
  const batchNewCount = batchOrders.filter(
    (order) => order.order_status === "NEW"
  ).length;
  const batchAcceptedCount = batchOrders.filter(
    (order) => order.order_status === "BATCHED"
  ).length;
  const remainingBatchDispatchCount = deliveryOrders.filter(
    (order) =>
      order.batch?.id === activeBatch?.id &&
      (order.order_status === "BATCHED" ||
        order.order_status === "OUT_FOR_DELIVERY")
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

  const adjustCutoff = (minutes: number) => {
    if (!activeBatch) return;
    updateCutoffMutation.mutate({
      batchId: activeBatch.id,
      newCutoffTime: addMinutes(new Date(activeBatch.cutoff_time), minutes),
    });
  };

  const closeBatch = () => {
    if (!activeBatch) return;
    if (batchNewCount > 0) {
      toast.error(`Accept or reject ${batchNewCount} new batch orders first.`);
      return;
    }
    if (!window.confirm("Close this batch for delivery?")) return;
    closeBatchMutation.mutate(activeBatch.id);
  };

  const startBatchDelivery = () => {
    if (!activeBatch) return;
    startDeliveryMutation.mutate(activeBatch.id);
  };

  const completeBatch = () => {
    if (!activeBatch) return;
    completeBatchMutation.mutate(activeBatch.id);
  };

  const acceptOrder = (orderId: string) => {
    acceptMutation.mutate(orderId);
  };

  const rejectOrder = (orderId: string) => {
    if (!window.confirm("Reject this order?")) return;
    rejectMutation.mutate({ orderId });
  };

  const verifyOtp = (orderId: string) => {
    const otp = otpInputs[orderId] || "";
    if (otp.length !== 4) {
      toast.error("Enter the 4-digit OTP.");
      return;
    }
    verifyOtpMutation.mutate(
      { orderId, otp },
      {
        onSuccess: () => {
          setOtpInputs((current) => {
            const next = { ...current };
            delete next[orderId];
            return next;
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto flex max-w-6xl justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-pretty">
            Order Console
          </h1>
          <p className="text-muted-foreground">
            Intake, prep, and dispatch for batch and direct delivery orders.
          </p>
        </div>
        <div
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Live refresh every 10 seconds
        </div>
      </div>

      <Card className="rounded-lg">
        <CardHeader className="px-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TimerReset className="h-5 w-5" aria-hidden="true" />
                Batch Control
              </CardTitle>
              <CardDescription>
                {activeBatch
                  ? `Cutoff ${format(new Date(activeBatch.cutoff_time), "h:mm a")} / ${batchAcceptedCount} accepted / ${batchNewCount} new`
                  : "No open batch is available."}
              </CardDescription>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustCutoff(-15)}
                disabled={!activeBatch || pending}
              >
                -15m
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustCutoff(15)}
                disabled={!activeBatch || pending}
              >
                +15m
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={closeBatch}
                disabled={!activeBatch || pending}
              >
                Close Batch
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={startBatchDelivery}
                disabled={
                  !activeBatch || activeBatch.status !== "LOCKED" || pending
                }
              >
                <Truck aria-hidden="true" />
                Start Run
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={completeBatch}
                disabled={
                  !activeBatch ||
                  activeBatch.status !== "IN_TRANSIT" ||
                  remainingBatchDispatchCount > 0 ||
                  pending
                }
                className="sm:col-auto"
              >
                Complete Run
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <section className="space-y-4">
        <SectionTitle
          icon={<Clock className="h-5 w-5" aria-hidden="true" />}
          title="Intake"
          count={intakeOrders.length}
        />
        {intakeOrders.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {intakeOrders.map((order) => (
              <IntakeOrderCard
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

      <section className="space-y-4">
        <SectionTitle
          icon={<PackageCheck className="h-5 w-5" aria-hidden="true" />}
          title="Prep"
          count={prepOrders.length}
        />
        {prepSummary.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {prepSummary.map((item) => (
              <div
                key={item.name}
                className="rounded-lg border bg-muted/40 p-3 text-sm"
              >
                <div className="font-semibold tabular-nums">
                  {item.quantity}x
                </div>
                <div className="min-w-0 truncate text-muted-foreground">
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {prepOrders.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {prepOrders.map((order) => (
              <PrepOrderCard
                key={order.id}
                order={order}
                onStartDirect={(orderId) => startDirectMutation.mutate(orderId)}
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

      <section className="space-y-4">
        <SectionTitle
          icon={<Truck className="h-5 w-5" aria-hidden="true" />}
          title="Dispatch"
          count={deliveryOrders.length}
        />
        {deliveryOrders.length > 0 ? (
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto rounded-lg border bg-muted/30 p-2">
              {dispatchEntries.map(([hostel, orders], index) => {
                const isSelected = hostel === activeDispatchHostel;
                return (
                  <Button
                    key={hostel}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDispatchHostel(hostel)}
                    className="h-auto min-w-36 shrink-0 justify-start py-2"
                  >
                    <span className="flex min-w-0 flex-col items-start">
                      <span className="truncate">
                        {index + 1}. {hostel}
                      </span>
                      <span className="text-xs opacity-80">
                        {getPendingHostelCount(orders)} pending
                      </span>
                    </span>
                  </Button>
                );
              })}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 border-b pb-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">
                    Hostel {activeDispatchHostel}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Deliver these orders before moving to the next hostel.
                  </p>
                </div>
                <Badge variant="outline">{activeDispatchOrders.length}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {activeDispatchOrders.map((order) => (
                  <DispatchOrderCard
                    key={order.id}
                    order={order}
                    otp={otpInputs[order.id] || ""}
                    onOtpChange={(orderId, otp) =>
                      setOtpInputs((current) => ({
                        ...current,
                        [orderId]: otp.slice(0, 4),
                      }))
                    }
                    onVerify={verifyOtp}
                    disabled={pending}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No Orders for Dispatch"
            description="Locked batch orders and accepted direct deliveries appear here."
          />
        )}
      </section>
    </main>
  );
}
