import React from "react";

export default async function Page({
  params,
}: {
  params: Promise<{ order_id: string }>;
}) {
  const { order_id } = await params;

  return <div>Page: {order_id}</div>;
}
