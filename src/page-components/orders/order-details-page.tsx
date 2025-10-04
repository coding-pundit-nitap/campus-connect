import React from "react";

import AuthWrapper from "@/components/wrapper/auth-wrapper";

import OrderDetailsContainer from "./order-details-container";

type Props = {
  order_id: string;
};

export default function OrderDetailsPage({ order_id }: Props) {
  return (
    <AuthWrapper>
      <OrderDetailsContainer order_id={order_id} />
    </AuthWrapper>
  );
}
