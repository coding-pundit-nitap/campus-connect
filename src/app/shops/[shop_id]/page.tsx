import React from "react";

type Props = {
  params: Promise<{ shop_id: string }>;
};

export default async function Page({ params }: Props) {
  const { shop_id } = await params;

  return <div>Page {shop_id}</div>;
}
