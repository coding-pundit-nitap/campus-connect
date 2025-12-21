"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlatformOverview {
  users: { total: number; active: number; admins: number; suspended: number };
  shops: { total: number; active: number; verified: number; pending: number };
  products: { total: number; inStock: number; outOfStock: number };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  reviews: { total: number; averageRating: number };
  payouts: { pending: number; completed: number; totalPending: number };
}

interface PlatformOverviewCardProps {
  platformOverview: PlatformOverview;
}

export function PlatformOverviewCard({
  platformOverview,
}: PlatformOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Overview</CardTitle>
        <CardDescription>Comprehensive platform statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-1 p-3 border rounded-lg">
            <p className="text-2xl font-bold">{platformOverview.users.total}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
            <p className="text-xs text-green-600">
              {platformOverview.users.active} active
            </p>
          </div>
          <div className="space-y-1 p-3 border rounded-lg">
            <p className="text-2xl font-bold">{platformOverview.shops.total}</p>
            <p className="text-xs text-muted-foreground">Total Shops</p>
            <p className="text-xs text-green-600">
              {platformOverview.shops.verified} verified
            </p>
          </div>
          <div className="space-y-1 p-3 border rounded-lg">
            <p className="text-2xl font-bold">
              {platformOverview.products.total}
            </p>
            <p className="text-xs text-muted-foreground">Products</p>
            <p className="text-xs text-amber-600">
              {platformOverview.products.outOfStock} out of stock
            </p>
          </div>
          <div className="space-y-1 p-3 border rounded-lg">
            <p className="text-2xl font-bold">
              {platformOverview.orders.total}
            </p>
            <p className="text-xs text-muted-foreground">Orders</p>
            <p className="text-xs text-blue-600">
              {platformOverview.orders.pending} pending
            </p>
          </div>
          <div className="space-y-1 p-3 border rounded-lg">
            <p className="text-2xl font-bold">
              {platformOverview.reviews.total}
            </p>
            <p className="text-xs text-muted-foreground">Reviews</p>
            <p className="text-xs text-yellow-600">
              ★ {platformOverview.reviews.averageRating.toFixed(1)} avg
            </p>
          </div>
          <div className="space-y-1 p-3 border rounded-lg">
            <p className="text-2xl font-bold">
              {platformOverview.payouts.pending}
            </p>
            <p className="text-xs text-muted-foreground">Pending Payouts</p>
            <p className="text-xs text-muted-foreground">
              ₹{platformOverview.payouts.totalPending.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
