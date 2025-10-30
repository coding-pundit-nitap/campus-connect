import React from "react";

import PaymentPageComponent from "@/page-components/checkout/payment-page";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ cart_id: string }>;
}) {
  const { cart_id } = await params;
  return <PaymentPageComponent cart_id={cart_id} />;
}
