import IndividualProductPage from "@/page-components/shops/individual-product";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ product_id: string }>;
}) {
  const { product_id } = await params;
  return <IndividualProductPage product_id={product_id} />;
}
