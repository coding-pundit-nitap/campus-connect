"use client";

import { Clock, Package, ShoppingCart, Tag } from "lucide-react";

import { cn } from "@/lib/cn";

interface ShopStatsCardsProps {
  productCount: number;
  orderCount: number;
  categoryCount: number;
  pendingOrderCount: number;
}

export function ShopStatsCards({
  productCount,
  orderCount,
  categoryCount,
  pendingOrderCount,
}: ShopStatsCardsProps) {
  const stats = [
    {
      label: "Products",
      value: productCount,
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/40",
    },
    {
      label: "Total Orders",
      value: orderCount,
      icon: ShoppingCart,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
    },
    {
      label: "Categories",
      value: categoryCount,
      icon: Tag,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/40",
    },
    {
      label: "Pending Orders",
      value: pendingOrderCount,
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div
              className={cn(
                "p-2.5 rounded-xl shrink-0 w-fit",
                stat.bgColor,
                stat.color
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-foreground leading-none mb-1">
                {stat.value}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
