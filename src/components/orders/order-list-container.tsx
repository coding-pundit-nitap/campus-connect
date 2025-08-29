import React from "react";

import OrderCardList from "./order-card-list";

export default function OrderListContainer() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Order History</h2>
        <p className="text-muted-foreground">Manage your recent orders</p>
      </div>
      <OrderCardList />
    </div>
  );
}
