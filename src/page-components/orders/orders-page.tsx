import { ShoppingBag } from "lucide-react";
import React from "react";

import OrderListContainer from "@/components/orders/order-list-container";
import AuthWrapper from "@/components/wrapper/auth-wrapper";

export default function OrdersPage() {
  return (
    <AuthWrapper>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-5 mb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-heading font-black tracking-tight flex items-center gap-2.5 text-foreground">
              <ShoppingBag className="h-8 w-8 text-orange-500" />
              Your Orders
            </h1>
            <p className="text-sm text-muted-foreground">
              Track, manage, and review your canteen purchases and delivery
              status.
            </p>
          </div>
        </div>
        <OrderListContainer />
      </div>
    </AuthWrapper>
  );
}
