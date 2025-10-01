import { notFound } from "next/navigation";

import ProductActions from "@/components/shops/product-actions";
import ProductDetails from "@/components/shops/product-details";
import ProductImage from "@/components/shops/product-image";
import { serializeProduct } from "@/lib/utils-functions";
import productService from "@/services/product.service";

type IndividualProductProps = {
  product_id: string;
};

export default async function IndividualProduct({
  product_id,
}: IndividualProductProps) {
  const product = await productService.getProductById(product_id);

  if (!product) {
    notFound();
  }

  const serializedProduct = serializeProduct(product);

  const productData = {
    id: serializedProduct.id,
    name: serializedProduct.name,
    imageKey: serializedProduct.imageKey,
    shop: {
      name: product.shop.name,
    },
    rating: serializedProduct.rating,
    review_count: product._count.reviews,
    price: serializedProduct.price,
    discount: serializedProduct.discount,
    description: serializedProduct.description || "",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <ProductImage imageKey={productData.imageKey} name={productData.name} />
        <div className="lg:col-span-7 flex flex-col gap-6">
          <ProductDetails product={productData} className="" />
          <ProductActions productId={product.id} />
        </div>
      </div>
    </div>
  );
}
