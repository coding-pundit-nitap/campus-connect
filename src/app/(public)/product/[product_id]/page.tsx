import { Metadata } from "next";

import { JsonLdScript } from "@/components/shared/json-ld-script";
import {
  generateProductJsonLd,
  generateProductMetadata,
} from "@/lib/metadata/product-metadata";
import IndividualProductPage from "@/page-components/shops/individual-product";
import { productService } from "@/services/product/product.service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ product_id: string }>;
}): Promise<Metadata> {
  const { product_id } = await params;
  return generateProductMetadata(product_id);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ product_id: string }>;
}) {
  const { product_id } = await params;

  const product = await productService.getProductById(product_id);

  if (!product) {
    return <IndividualProductPage product_id={product_id} />;
  }

  const jsonLd = generateProductJsonLd({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    discount: product.discount ? Number(product.discount) : undefined,
    image_key: product.image_key,
    rating_sum: product.rating_sum,
    review_count: product.review_count,
    stock_quantity: product.stock_quantity,
    shop: product.shop,
    category: product.category,
  });

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <IndividualProductPage product_id={product_id} />
    </>
  );
}
