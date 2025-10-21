import React from "react";

import CheckoutPageComponent from "@/page-components/checkout/checkout-page";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ cart_id: string }>;
}) {
  const cart_id = (await params).cart_id;
  return <CheckoutPageComponent cart_id={cart_id} />;
}
