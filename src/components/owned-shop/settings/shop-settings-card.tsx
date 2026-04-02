"use client";

import {
  CalendarClock,
  Clock,
  CreditCard,
  DollarSign,
  Edit,
  MapPin,
  Package,
  Pause,
  Play,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Link from "next/link";

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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useBatchSlots,
  useShopByUser,
  useToggleAcceptingOrders,
} from "@/hooks";

function SettingRow({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className="rounded-lg bg-muted/50 p-2 border">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{label}</p>
          <div className="text-right text-sm font-semibold">{value}</div>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

export function ShopSettingsCard() {
  const { data: shop, isLoading, refetch } = useShopByUser();
  const { data: batchSlots, isLoading: batchSlotsLoading } = useBatchSlots(
    shop?.id || ""
  );
  const { mutate, isPending: isToggling } = useToggleAcceptingOrders();

  const handleToggleOrders = (checked: boolean) => {
    mutate(checked, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="min-h-125 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!shop) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>No Shop Found</CardTitle>
          <CardDescription>
            You don&apos;t have a shop yet. Create one to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/create-shop">Create Shop</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeBatchSlots = batchSlots?.filter((slot) => slot.is_active) || [];

  return (
    <Card className="flex flex-col relative overflow-hidden min-h-137.5 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between border-b bg-muted/10 pb-5 shrink-0">
        <div>
          <CardTitle className="text-xl font-bold tracking-tight">
            {shop.name}
          </CardTitle>
          <CardDescription>
            Manage your shop settings and operations
          </CardDescription>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Badge
              variant={shop.is_active ? "default" : "destructive"}
              className={
                shop.is_active ? "bg-green-500 hover:bg-green-600" : ""
              }
            >
              {shop.is_active ? "Active" : "Inactive"}
            </Badge>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              (Admin)
            </span>
          </div>
        </div>
      </CardHeader>

      <Tabs defaultValue="general" className="flex-1 flex flex-col">
        <div className="px-6 pt-6 shrink-0">
          <TabsList className="grid w-full grid-cols-4 h-10 bg-muted/50">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>
        </div>

        {/* Added pb-20 to ensure content doesn't get hidden behind the absolute footer */}
        <CardContent className="flex-1 pt-6 pb-20">
          {/* --- GENERAL TAB --- */}
          <TabsContent
            value="general"
            className="space-y-4 mt-0 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between rounded-lg border p-4 bg-card shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div
                  className={`p-2.5 rounded-full ${shop.accepting_orders ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-orange-100 dark:bg-orange-900/30 text-orange-600"}`}
                >
                  {shop.accepting_orders ? (
                    <Play className="h-5 w-5" />
                  ) : (
                    <Pause className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">
                    {shop.accepting_orders
                      ? "Accepting Orders"
                      : "Orders Paused"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {shop.accepting_orders
                      ? "Your shop is receiving new orders"
                      : "New orders are paused (holiday mode)"}
                  </p>
                </div>
              </div>
              <Switch
                checked={shop.accepting_orders}
                onCheckedChange={handleToggleOrders}
                disabled={isToggling || !shop.is_active}
              />
            </div>

            {!shop.is_active && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Your shop is deactivated by admin. Contact support to
                reactivate.
              </p>
            )}

            <div className="rounded-lg border bg-card p-2 shadow-sm">
              <SettingRow
                icon={MapPin}
                label="Location"
                value={shop.location || "Not set"}
                description="Where customers can find your shop"
              />
              <Separator className="mx-4 w-auto" />
              <SettingRow
                icon={Clock}
                label="Operating Hours"
                value={`${shop.opening} - ${shop.closing}`}
                description="When your shop is open for orders"
              />
            </div>
          </TabsContent>

          {/* --- SCHEDULE TAB --- */}
          <TabsContent
            value="schedule"
            className="space-y-4 mt-0 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="rounded-lg border bg-card p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3 text-muted-foreground mb-2">
                <CalendarClock className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold text-foreground">Batch Cards</h3>
                  <p className="text-sm">Delivery schedule configuration</p>
                </div>
              </div>

              {batchSlotsLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : activeBatchSlots.length > 0 ? (
                <div className="space-y-4 bg-muted/30 p-4 rounded-md border">
                  <p className="text-sm font-medium">
                    {activeBatchSlots.length} active batch slot
                    {activeBatchSlots.length !== 1 ? "s" : ""} configured
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeBatchSlots.slice(0, 4).map((slot) => {
                      const hours = Math.floor(slot.cutoff_time_minutes / 60);
                      const mins = slot.cutoff_time_minutes % 60;
                      return (
                        <Badge
                          key={slot.id}
                          variant="secondary"
                          className="px-3 py-1 text-sm shadow-sm"
                        >
                          {slot.label ||
                            `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`}
                        </Badge>
                      );
                    })}
                    {activeBatchSlots.length > 4 && (
                      <Badge variant="outline" className="px-3 py-1">
                        +{activeBatchSlots.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 p-4 rounded-md border text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No batch cards configured. Your shop operates in
                    direct-delivery mode.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* --- FEES TAB --- */}
          <TabsContent
            value="fees"
            className="space-y-4 mt-0 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="rounded-lg border bg-card p-2 shadow-sm">
              <SettingRow
                icon={Package}
                label="Minimum Order Value"
                value={`₹${shop.min_order_value}`}
                description="Minimum cart value required to place an order"
              />
              <Separator className="mx-4 w-auto" />
              <SettingRow
                icon={Truck}
                label="Default Delivery Fee"
                value={`₹${shop.default_delivery_fee}`}
                description="Standard delivery fee for batch orders"
              />
              <Separator className="mx-4 w-auto" />
              <SettingRow
                icon={Truck}
                label="Direct Delivery Fee"
                value={`₹${shop.direct_delivery_fee}`}
                description="Extra fee charged for immediate (non-batched) delivery"
              />
              <Separator className="mx-4 w-auto" />
              <SettingRow
                icon={DollarSign}
                label="Platform Fee"
                value={
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">
                    Set by Admin
                  </span>
                }
                description="Platform fee is configured by administrators"
              />
            </div>
          </TabsContent>

          {/* --- PAYMENT TAB --- */}
          <TabsContent
            value="payment"
            className="space-y-4 mt-0 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="rounded-lg border bg-card p-2 shadow-sm">
              <SettingRow
                icon={ShieldCheck}
                label="UPI ID"
                value={
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {shop.upi_id || "Not configured"}
                  </code>
                }
                description="Your UPI ID for receiving online payments"
              />
              <Separator className="mx-4 w-auto" />
              <div className="flex items-start gap-4 p-4">
                <div className="rounded-lg bg-muted/50 p-2 border">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">QR Code</p>
                  <p className="text-xs text-muted-foreground">
                    {shop.qr_image_key
                      ? "QR code uploaded for easy payments"
                      : "No QR code uploaded"}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>

      {/* --- STICKY FOOTER (Quick Actions) --- */}
      <div className="absolute bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-10">
        <span className="text-sm font-semibold text-muted-foreground hidden sm:inline-block">
          Quick Actions
        </span>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <Link href="/owner-shops/edit">
              <Edit className="mr-2 h-4 w-4" />
              Edit Settings
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <Link href="/owner-shops/batch-cards">
              <Clock className="mr-2 h-4 w-4" />
              Batches
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <Link href="/owner-shops/products">
              <Package className="mr-2 h-4 w-4" />
              Products
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
