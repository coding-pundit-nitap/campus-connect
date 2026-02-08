"use client";

import {
  CalendarClock,
  Clock,
  CreditCard,
  DollarSign,
  Edit,
  IndianRupee,
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
      <div className="rounded-lg bg-muted p-2">
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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!shop) {
    return (
      <Card>
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">{shop.name}</CardTitle>
            <CardDescription>Shop status and order management</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={shop.is_active ? "default" : "destructive"}
                className={shop.is_active ? "bg-green-500" : ""}
              >
                {shop.is_active ? "Active" : "Inactive"}
              </Badge>
              <span className="text-xs text-muted-foreground">(by Admin)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {shop.accepting_orders ? (
                <Play className="h-5 w-5 text-green-500" />
              ) : (
                <Pause className="h-5 w-5 text-orange-500" />
              )}
              <div>
                <p className="font-medium">
                  {shop.accepting_orders ? "Accepting Orders" : "Orders Paused"}
                </p>
                <p className="text-xs text-muted-foreground">
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
            <p className="text-xs text-muted-foreground text-center">
              Your shop is deactivated by admin. Contact support to reactivate.
            </p>
          )}

          <Separator />

          <SettingRow
            icon={MapPin}
            label="Location"
            value={shop.location || "Not set"}
            description="Where customers can find your shop"
          />
          <Separator />
          <SettingRow
            icon={Clock}
            label="Operating Hours"
            value={`${shop.opening} - ${shop.closing}`}
            description="When your shop is open for orders"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Batch Cards
            </CardTitle>
            <CardDescription>Delivery schedule configuration</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/owner-shops/batch-cards">
              <Edit className="mr-2 h-4 w-4" />
              Manage
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {batchSlotsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : activeBatchSlots.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {activeBatchSlots.length} active batch slot
                {activeBatchSlots.length !== 1 ? "s" : ""} configured
              </p>
              <div className="flex flex-wrap gap-2">
                {activeBatchSlots.slice(0, 4).map((slot) => {
                  const hours = Math.floor(slot.cutoff_time_minutes / 60);
                  const mins = slot.cutoff_time_minutes % 60;
                  return (
                    <Badge key={slot.id} variant="secondary">
                      {slot.label ||
                        `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`}
                    </Badge>
                  );
                })}
                {activeBatchSlots.length > 4 && (
                  <Badge variant="outline">
                    +{activeBatchSlots.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No batch cards configured. Your shop operates in direct-delivery
                mode.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/owner-shops/batch-cards">Set up batch cards</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Fees & Pricing
            </CardTitle>
            <CardDescription>Fee configuration for your shop</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/owner-shops/edit">
              <Edit className="mr-2 h-4 w-4" />
              Edit Fees
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <SettingRow
            icon={Package}
            label="Minimum Order Value"
            value={`₹${shop.min_order_value}`}
            description="Minimum cart value required to place an order"
          />
          <Separator />
          <SettingRow
            icon={Truck}
            label="Default Delivery Fee"
            value={`₹${shop.default_delivery_fee}`}
            description="Standard delivery fee for batch orders"
          />
          <Separator />
          <SettingRow
            icon={Truck}
            label="Direct Delivery Fee"
            value={`₹${shop.direct_delivery_fee}`}
            description="Extra fee charged for immediate (non-batched) delivery"
          />
          <Separator />
          <SettingRow
            icon={DollarSign}
            label="Platform Fee"
            value={
              <span className="text-muted-foreground text-xs">
                Set globally by Admin
              </span>
            }
            description="Platform fee is configured by administrators"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Settings
            </CardTitle>
            <CardDescription>How customers pay for orders</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/owner-shops/edit">
              <Edit className="mr-2 h-4 w-4" />
              Edit Payment
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <SettingRow
            icon={ShieldCheck}
            label="UPI ID"
            value={shop.upi_id || "Not configured"}
            description="Your UPI ID for receiving online payments"
          />
          <Separator />
          <div className="flex items-start gap-4 py-3">
            <div className="rounded-lg bg-muted p-2">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/owner-shops/edit">
              <Edit className="mr-2 h-4 w-4" />
              Edit All Settings
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/owner-shops/batch-cards">
              <Clock className="mr-2 h-4 w-4" />
              Manage Batch Cards
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/owner-shops/products">
              <Package className="mr-2 h-4 w-4" />
              Manage Products
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
