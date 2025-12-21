import { getProductPageData } from "@/services/product/product-page.service";

import { Card, CardContent } from "../ui/card";
import ProductActions from "./product-actions";
import ProductDetails from "./product-details";
import ProductImage from "./product-image";
import ReviewContainer from "./review-container";

type IndividualProductProps = {
  product_id: string;
};

export default async function IndividualProduct({
  product_id,
}: IndividualProductProps) {
  const {
    product,
    initialReviews,
    hasNextPage,
    nextCursor,
    reviewGroup,
    rawProductId,
  } = await getProductPageData(product_id);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <ProductImage
          className="lg:col-span-5"
          image_key={product.image_key}
          name={product.name}
        />

        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardContent className="p-6 space-y-6">
              <ProductDetails product={product} className="" />
              <ProductActions
                productId={rawProductId}
                maxQuantity={Math.min(product.stock_quantity, 10)}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <ReviewContainer
        initialReviews={initialReviews}
        product_id={product_id}
        hasNextPage={hasNextPage}
        nextCursor={nextCursor}
        reviewGroup={reviewGroup}
      />
    </div>
  );
}
