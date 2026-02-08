"use client";

import {
  BarChart3,
  CalendarClock,
  LayoutDashboard,
  Package,
  Settings,
} from "lucide-react";
import Link from "next/link";

import { VendorDashboard } from "@/components/owned-shop/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNextSlot, useShopByUser, useVendorOverview } from "@/hooks";

import { ShopHeaderCard } from "./shop-header-card";
import { ShopEmptyState, ShopErrorState, ShopLoadingState } from "./shop-state";

export default function Shop() {
  const shops = useShopByUser();

  const shopId = shops.data?.id;
  const nextSlot = useNextSlot(shopId || "");
  const overview = useVendorOverview();

  if (shops.isLoading || shops.isFetching || shops.isPending) {
    return <ShopLoadingState />;
  }
  if (shops.error) {
    return <ShopErrorState />;
  }

  if (!shops.data) {
    return <ShopEmptyState />;
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Shopkeeper Dashboard
        </h1>
        <p className="text-muted-foreground">
          Run your batches, manage orders, and keep stock fresh.
        </p>
      </div>

      <ShopHeaderCard shop={shops.data} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Today at a glance</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Quick KPIs for your shop.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/owner-shops/orders">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Open Orders
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {overview.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              ) : overview.data ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">Pending</div>
                    <div className="text-2xl font-bold">
                      {overview.data.pendingOrders}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      NEW / BATCHED / OTD
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">
                      Total Orders
                    </div>
                    <div className="text-2xl font-bold">
                      {overview.data.totalOrders}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      All time
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">
                      Products
                    </div>
                    <div className="text-2xl font-bold">
                      {overview.data.productCount}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      In catalog
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">
                      Today Earnings
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      ₹{overview.data.todayEarnings.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      After platform fee
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  KPI cards unavailable right now.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Batches & delivery</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Lock, climb, verify OTPs, and complete.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/owner-shops/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Full Batch View
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <VendorDashboard />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-muted-foreground" />
                Next batch cutoff
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {nextSlot.isLoading ? (
                <Skeleton className="h-16" />
              ) : nextSlot.data?.enabled && nextSlot.data.cutoff_time ? (
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {nextSlot.data.minutes_remaining ?? 0} min
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Closes at{" "}
                    {new Date(nextSlot.data.cutoff_time).toLocaleTimeString(
                      "en-IN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                  <div className="pt-1">
                    <Badge
                      variant={nextSlot.data.is_open ? "secondary" : "outline"}
                    >
                      {nextSlot.data.is_open
                        ? "Currently collecting orders"
                        : "Next slot will open automatically"}
                    </Badge>
                  </div>
                </div>
              ) : nextSlot.data && !nextSlot.data.enabled ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No batch cards configured. This shop is in direct-delivery
                    mode.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={{ pathname: "/owner-shops/batch-cards" }}>
                      Set up batch cards
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Next slot unavailable.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild className="justify-start" variant="outline">
                <Link href="/owner-shops/orders">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Manage orders
                </Link>
              </Button>
              <Button asChild className="justify-start" variant="outline">
                <Link href="/owner-shops/products">
                  <Package className="mr-2 h-4 w-4" />
                  Manage products
                </Link>
              </Button>
              <Button asChild className="justify-start" variant="outline">
                <Link href="/owner-shops/products/new">
                  <Package className="mr-2 h-4 w-4" />
                  Add a new product
                </Link>
              </Button>
              <Button asChild className="justify-start" variant="outline">
                <Link href="/owner-shops/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Shop settings (MOV, fees)
                </Link>
              </Button>
              <Button asChild className="justify-start" variant="outline">
                <Link href={{ pathname: "/owner-shops/batch-cards" }}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Batch cards (delivery schedule)
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
