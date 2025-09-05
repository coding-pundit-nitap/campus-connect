import React from "react";

import OrderCardList from "./order-card-list";
import { OrderWrapper } from "./order-state";

export default function OrderListContainer() {
  return (
    <OrderWrapper>
      <OrderCardList />
    </OrderWrapper>
  );
}
