import IndividualProduct from "@/page-components/shops/individual-product";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ shop_id: string; product_id: string }>;
}) {
  const { product_id } = await params;
  return <IndividualProduct product_id={product_id} />;
}
