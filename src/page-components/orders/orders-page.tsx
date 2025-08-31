import React from "react";

import OrderListContainer from "@/components/orders/order-list-container";
import AuthWrapper from "@/components/wrapper/auth-wrapper";

export default function OrdersPage() {
  return (
    <AuthWrapper>
      <OrderListContainer />
    </AuthWrapper>
  );
}
