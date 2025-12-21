"use client";

import {
  Activity,
  Bell,
  FileText,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import { Route } from "next";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

const QUICK_ACTIONS = [
  {
    href: "/admin/users",
    title: "Manage Users",
    description: "View, promote, and manage accounts",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    href: "/admin/shops",
    title: "Manage Shops",
    description: "Activate, verify, and manage shops",
    icon: ShoppingBag,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    href: "/admin/orders",
    title: "Manage Orders",
    description: "View and update order statuses",
    icon: Package,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    href: "/admin/payouts",
    title: "Manage Payouts",
    description: "Track and manage shop payouts",
    icon: Wallet,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    href: "/admin/reviews",
    title: "Moderate Reviews",
    description: "Review and moderate content",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    href: "/admin/categories",
    title: "View Categories",
    description: "Browse product categories",
    icon: FileText,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
  },
  {
    href: "/admin/audit-logs",
    title: "Audit Logs",
    description: "View admin action history",
    icon: Activity,
    color: "text-rose-600",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
  },
  {
    href: "/admin/broadcasts",
    title: "Send Broadcasts",
    description: "Send system-wide notifications",
    icon: Bell,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  {
    href: "/admin/settings",
    title: "Settings",
    description: "Configure system settings",
    icon: Settings,
    color: "text-slate-600",
    bgColor: "bg-slate-100 dark:bg-slate-800/50",
  },
];

export function QuickActionsGrid() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.href} href={action.href as Route}>
            <Card className="hover:bg-accent/50 transition-all cursor-pointer hover:shadow-md group">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-3 rounded-lg ${action.bgColor}`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">
                    {action.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
