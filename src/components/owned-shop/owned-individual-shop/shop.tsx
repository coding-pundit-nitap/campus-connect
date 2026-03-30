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
    <div className="container mx-auto space-y-8 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Shopkeeper Dashboard
        </h1>
        <p className="text-muted-foreground">
          Run your batches, manage orders, and keep stock fresh.
        </p>
      </div>

      <ShopHeaderCard shop={shops.data} />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Today at a glance
              </h2>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href="/owner-shops/orders">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Open Orders
                </Link>
              </Button>
            </div>

            {overview.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
            ) : overview.data ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Pending
                  </div>
                  <div className="text-2xl font-bold">
                    {overview.data.pendingOrders}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    New / Batched
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Total Orders
                  </div>
                  <div className="text-2xl font-bold">
                    {overview.data.totalOrders}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    All time
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Products
                  </div>
                  <div className="text-2xl font-bold">
                    {overview.data.productCount}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    In catalog
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Today Earnings
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{overview.data.todayEarnings.toFixed(0)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    After platform fee
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                KPI cards unavailable right now.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Active Batches
              </h2>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href="/owner-shops/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Full Batch View
                </Link>
              </Button>
            </div>

            <VendorDashboard />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                Next batch cutoff
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextSlot.isLoading ? (
                <Skeleton className="h-16" />
              ) : nextSlot.data?.enabled && nextSlot.data.cutoff_time ? (
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    {nextSlot.data.minutes_remaining ?? 0}
                    <span className="text-lg font-medium text-muted-foreground ml-1">
                      min
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Closes at{" "}
                    <span className="font-medium text-foreground">
                      {new Date(nextSlot.data.cutoff_time).toLocaleString()}
                    </span>
                  </div>
                  <Badge
                    variant={nextSlot.data.is_open ? "secondary" : "outline"}
                    className="w-full justify-center py-1"
                  >
                    {nextSlot.data.is_open
                      ? "Currently collecting orders"
                      : "Next slot will open automatically"}
                  </Badge>
                </div>
              ) : nextSlot.data && !nextSlot.data.enabled ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No batch cards configured. This shop is currently in
                    direct-delivery mode.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
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

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button
                asChild
                className="justify-start text-muted-foreground hover:text-foreground"
                variant="ghost"
              >
                <Link href="/owner-shops/orders">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Manage orders
                </Link>
              </Button>
              <Button
                asChild
                className="justify-start text-muted-foreground hover:text-foreground"
                variant="ghost"
              >
                <Link href="/owner-shops/products">
                  <Package className="mr-2 h-4 w-4" />
                  Manage products
                </Link>
              </Button>
              <Button
                asChild
                className="justify-start text-muted-foreground hover:text-foreground"
                variant="ghost"
              >
                <Link href="/owner-shops/products/new">
                  <Package className="mr-2 h-4 w-4" />
                  Add a new product
                </Link>
              </Button>
              <Button
                asChild
                className="justify-start text-muted-foreground hover:text-foreground"
                variant="ghost"
              >
                <Link href={{ pathname: "/owner-shops/settings" }}>
                  <Settings className="mr-2 h-4 w-4" />
                  Shop settings
                </Link>
              </Button>
              <Button
                asChild
                className="justify-start text-muted-foreground hover:text-foreground"
                variant="ghost"
              >
                <Link href={{ pathname: "/owner-shops/batch-cards" }}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Batch schedule
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
