"use client";

import {
  BarChart3,
  CalendarClock,
  LayoutDashboard,
  Package,
  Settings,
  Store,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { VendorDashboard } from "@/components/owned-shop/dashboard";
import { ActiveFulfillmentConsole } from "@/components/owned-shop/dashboard/active-fulfillment-console";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNextSlot, useShopByUser, useVendorOverview } from "@/hooks";
import { useVendorDashboard } from "@/hooks/queries/useBatch";
import { cn } from "@/lib/cn";

import { ShopHeaderCard } from "./shop-header-card";
import { ShopEmptyState, ShopErrorState, ShopLoadingState } from "./shop-state";

export default function Shop() {
  const shops = useShopByUser();

  const shopId = shops.data?.id;
  const nextSlot = useNextSlot(shopId || "");
  const overview = useVendorOverview();
  const dashboardData = useVendorDashboard();

  const [activeFulfillment, setActiveFulfillment] = useState<{
    type: "batch" | "direct";
    id: string;
  } | null>(null);

  if (shops.isLoading || shops.isFetching || shops.isPending) {
    return <ShopLoadingState />;
  }
  if (shops.error) {
    return <ShopErrorState />;
  }

  if (!shops.data) {
    return <ShopEmptyState />;
  }

  if (activeFulfillment !== null) {
    return (
      <ActiveFulfillmentConsole
        active={activeFulfillment}
        data={dashboardData.data}
        onBack={() => setActiveFulfillment(null)}
      />
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-6 select-none animate-in fade-in duration-200">
      <div className="flex flex-col gap-1.5 border-b border-border/40 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <Store className="h-8 w-8 text-primary" />
          Shopkeeper Control Hub
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          Monitor store statistics, update products, and fulfill customer order
          manifests.
        </p>
      </div>

      <ShopHeaderCard shop={shops.data} />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-widest px-1">
                Today at a glance
              </h2>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground text-xs font-bold rounded-lg border h-8"
              >
                <Link href="/owner-shops/orders">
                  <BarChart3 className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  View Orders History
                </Link>
              </Button>
            </div>

            {overview.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
            ) : overview.data ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border bg-card/40 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Pending
                  </div>
                  <div className="text-2xl font-extrabold mt-1 text-orange-600 dark:text-orange-400">
                    {overview.data.pendingOrders}
                  </div>
                  <div className="text-[9px] text-muted-foreground/75 mt-1 font-semibold uppercase tracking-wider">
                    New Orders
                  </div>
                </div>
                <div className="rounded-2xl border bg-card/40 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Total Orders
                  </div>
                  <div className="text-2xl font-extrabold mt-1 text-foreground">
                    {overview.data.totalOrders}
                  </div>
                  <div className="text-[9px] text-muted-foreground/75 mt-1 font-semibold uppercase tracking-wider">
                    All-time runs
                  </div>
                </div>
                <div className="rounded-2xl border bg-card/40 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Products
                  </div>
                  <div className="text-2xl font-extrabold mt-1 text-blue-600 dark:text-blue-400">
                    {overview.data.productCount}
                  </div>
                  <div className="text-[9px] text-muted-foreground/75 mt-1 font-semibold uppercase tracking-wider">
                    Active Catalog
                  </div>
                </div>
                <div className="rounded-2xl border bg-card/40 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Today Revenue
                  </div>
                  <div className="text-2xl font-extrabold mt-1 text-green-600 dark:text-green-500">
                    ₹{overview.data.todayEarnings.toFixed(0)}
                  </div>
                  <div className="text-[9px] text-muted-foreground/75 mt-1 font-semibold uppercase tracking-wider">
                    Net Payout
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground bg-muted/20 border border-dashed rounded-2xl p-4 text-center">
                KPI metrics currently unavailable.
              </p>
            )}
          </div>

          {/* Active Manifest Summaries Container */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-widest px-1">
                Active manifests & routing
              </h2>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground text-xs font-bold rounded-lg border h-8"
              >
                <Link href="/owner-shops/dashboard">
                  <LayoutDashboard className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  Full Screen Dashboard
                </Link>
              </Button>
            </div>

            <VendorDashboard
              onFulfill={(type, id) => setActiveFulfillment({ type, id })}
            />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-sm rounded-2xl border bg-card/35 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                <CalendarClock className="h-4.5 w-4.5 text-primary" />
                Next Batch Cutoff
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {nextSlot.isLoading ? (
                <Skeleton className="h-16 rounded-xl" />
              ) : nextSlot.data?.enabled && nextSlot.data.cutoff_time ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-3xl font-extrabold tracking-tight">
                      {nextSlot.data.minutes_remaining ?? 0}
                      <span className="text-sm font-bold text-muted-foreground ml-1">
                        min remaining
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Closes at{" "}
                      <span className="font-bold text-foreground">
                        {new Date(nextSlot.data.cutoff_time).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={nextSlot.data.is_open ? "secondary" : "outline"}
                    className={cn(
                      "w-full justify-center py-1.5 text-xs font-bold rounded-lg select-none border-transparent",
                      nextSlot.data.is_open
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    )}
                  >
                    {nextSlot.data.is_open
                      ? "Currently collecting orders"
                      : "Next slot opening automatically"}
                  </Badge>
                </div>
              ) : nextSlot.data && !nextSlot.data.enabled ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No batch cutoff configurations are active. Your shop is
                    running in <strong>Direct Delivery Mode</strong>.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl font-bold h-9 shadow-sm"
                  >
                    <Link href={{ pathname: "/owner-shops/batch-cards" }}>
                      Configure Batch Schedules
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground bg-muted/20 border border-dashed rounded-xl p-3 text-center">
                  Cutoff countdown unavailable.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
