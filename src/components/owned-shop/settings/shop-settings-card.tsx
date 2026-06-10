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
    <div className="flex items-start gap-4 py-3.5">
      <div className="rounded-xl bg-muted/40 p-2 border border-border/20 shadow-xs text-muted-foreground/80">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground/90">{label}</p>
          <div className="text-right text-sm font-bold text-foreground">
            {value}
          </div>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground/80 font-medium leading-normal">
            {description}
          </p>
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
      <Card className="min-h-125 bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl shadow-xl shadow-blue-500/[0.01] overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500" />
        <CardHeader>
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-lg mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (!shop) {
    return (
      <Card className="bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl shadow-xl shadow-blue-500/[0.01] overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500" />
        <CardHeader>
          <CardTitle className="text-xl font-black font-heading tracking-tight text-foreground">
            No Shop Found
          </CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground mt-0.5">
            You don&apos;t have a shop yet. Create one to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            asChild
            className="rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 hover:opacity-90 transition-all font-bold cursor-pointer text-white shadow-md shadow-blue-500/10"
          >
            <Link href="/create-shop">Create Shop</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeBatchSlots = batchSlots?.filter((slot) => slot.is_active) || [];

  return (
    <Card className="flex flex-col relative overflow-hidden min-h-137.5 bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl shadow-xl shadow-blue-500/[0.01]">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500" />
      <CardHeader className="flex flex-row items-start justify-between border-b border-border/20 bg-muted/5 pb-5 shrink-0 pt-6">
        <div>
          <CardTitle className="text-xl font-black font-heading tracking-tight text-foreground">
            {shop.name}
          </CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground mt-0.5">
            Manage your shop settings and operations
          </CardDescription>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <Badge
              variant={shop.is_active ? "outline" : "destructive"}
              className={
                shop.is_active
                  ? "bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg text-xs font-bold"
                  : "bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-bold"
              }
            >
              {shop.is_active ? "Active" : "Inactive"}
            </Badge>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/85">
              (Admin)
            </span>
          </div>
        </div>
      </CardHeader>

      <Tabs defaultValue="general" className="flex-1 flex flex-col">
        <div className="px-6 pt-6 shrink-0">
          <TabsList className="grid w-full grid-cols-4 h-11 bg-muted/15 p-1 rounded-xl border border-border/20">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
            >
              Schedule
            </TabsTrigger>
            <TabsTrigger
              value="fees"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
            >
              Fees
            </TabsTrigger>
            <TabsTrigger
              value="payment"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
            >
              Payment
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Added pb-24 to ensure content doesn't get hidden behind the absolute footer */}
        <CardContent className="flex-1 pt-6 pb-24">
          {/* --- GENERAL TAB --- */}
          <TabsContent
            value="general"
            className="space-y-4 mt-0 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between rounded-xl border border-border/20 p-4 bg-muted/15 shadow-xs transition-all hover:scale-[1.01] hover:border-blue-500/20 hover:bg-blue-500/[0.01]">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                    shop.accepting_orders
                      ? "bg-green-500/10 text-green-600 ring-4 ring-green-500/5"
                      : "bg-orange-500/10 text-orange-500 ring-4 ring-orange-500/5"
                  }`}
                >
                  {shop.accepting_orders ? (
                    <Play className="h-5 w-5 fill-current" />
                  ) : (
                    <Pause className="h-5 w-5 fill-current" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">
                    {shop.accepting_orders
                      ? "Accepting Orders"
                      : "Orders Paused"}
                  </p>
                  <p className="text-xs text-muted-foreground/90 mt-0.5 font-medium leading-normal">
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
                className="cursor-pointer"
              />
            </div>

            {!shop.is_active && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2 text-center font-bold">
                Your shop is deactivated by admin. Contact support to
                reactivate.
              </p>
            )}

            <div className="rounded-xl border border-border/20 bg-muted/10 p-1 px-4 divide-y divide-border/20 shadow-xs">
              <SettingRow
                icon={MapPin}
                label="Location"
                value={shop.location || "Not set"}
                description="Where customers can find your shop"
              />
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
            <div className="rounded-xl border border-border/20 bg-muted/15 p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-3 text-muted-foreground mb-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-4 ring-blue-500/5">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    Batch Cards
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium leading-normal">
                    Delivery schedule configuration
                  </p>
                </div>
              </div>

              {batchSlotsLoading ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : activeBatchSlots.length > 0 ? (
                <div className="space-y-4 bg-muted/10 p-4 rounded-xl border border-border/20">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
                          variant="outline"
                          className="px-3 py-1.5 text-xs font-semibold shadow-xs border-blue-500/20 bg-blue-500/10 text-blue-600 rounded-lg cursor-default"
                        >
                          {slot.label ||
                            `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`}
                        </Badge>
                      );
                    })}
                    {activeBatchSlots.length > 4 && (
                      <Badge
                        variant="outline"
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border-border/30 cursor-default bg-muted/20"
                      >
                        +{activeBatchSlots.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-muted/10 p-5 rounded-xl border border-border/20 text-center space-y-2">
                  <p className="text-sm font-medium text-muted-foreground/95 leading-normal">
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
            <div className="rounded-xl border border-border/20 bg-muted/10 p-1 px-4 divide-y divide-border/20 shadow-xs">
              <SettingRow
                icon={Package}
                label="Minimum Order Value"
                value={`₹${shop.min_order_value}`}
                description="Minimum cart value required to place an order"
              />
              <SettingRow
                icon={Truck}
                label="Default Delivery Fee"
                value={`₹${shop.default_delivery_fee}`}
                description="Standard delivery fee for batch orders"
              />
              <SettingRow
                icon={Truck}
                label="Direct Delivery Fee"
                value={`₹${shop.direct_delivery_fee}`}
                description="Extra fee charged for immediate (non-batched) delivery"
              />
              <SettingRow
                icon={DollarSign}
                label="Platform Fee"
                value={
                  <span className="text-muted-foreground text-xs uppercase tracking-wider font-bold bg-muted/40 border px-2 py-0.5 rounded-lg border-border/25">
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
            <div className="rounded-xl border border-border/20 bg-muted/10 p-1 px-4 divide-y divide-border/20 shadow-xs">
              <SettingRow
                icon={ShieldCheck}
                label="UPI ID"
                value={
                  <code className="bg-muted border border-border/20 px-2.5 py-1 rounded-lg text-xs font-mono select-all text-blue-600 font-bold">
                    {shop.upi_id || "Not configured"}
                  </code>
                }
                description="Your UPI ID for receiving online payments"
              />
              <div className="flex items-start gap-4 py-3.5">
                <div className="rounded-xl bg-muted/40 p-2 border border-border/20 shadow-xs text-muted-foreground/80">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-foreground/90">
                    QR Code
                  </p>
                  <p className="text-xs text-muted-foreground/85 font-medium leading-normal">
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
      <div className="absolute bottom-0 left-0 right-0 border-t border-border/30 bg-background/80 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-10">
        <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/85 hidden sm:inline-block">
          Quick Actions
        </span>
        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none rounded-xl border border-border/40 bg-card hover:bg-muted transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold"
          >
            <Link href="/owner-shops/edit">
              <Edit className="mr-2 h-4 w-4 text-blue-600" />
              Edit Settings
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none rounded-xl border border-border/40 bg-card hover:bg-muted transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold"
          >
            <Link href="/owner-shops/batch-cards">
              <Clock className="mr-2 h-4 w-4 text-orange-500" />
              Batches
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none rounded-xl border border-border/40 bg-card hover:bg-muted transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold"
          >
            <Link href="/owner-shops/products">
              <Package className="mr-2 h-4 w-4 text-emerald-600" />
              Products
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
