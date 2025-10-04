import { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";

import { serializeProduct } from "@/lib/utils-functions";
import reviewRepository from "@/repositories/reviews.repository";
import productService from "@/services/product.service";
import { ReviewWithUser } from "@/types/review.type";

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
  const product = await productService.getProductById(product_id);
  const groupedReviews = await reviewRepository.getGroupedReviews(product_id);
  const reviewGroup = {
    one: groupedReviews?.find((r) => r?.rating === 1)?._count.rating || 0,
    two: groupedReviews?.find((r) => r?.rating === 2)?._count.rating || 0,
    three: groupedReviews?.find((r) => r?.rating === 3)?._count.rating || 0,
    four: groupedReviews?.find((r) => r?.rating === 4)?._count.rating || 0,
    five: groupedReviews?.find((r) => r?.rating === 5)?._count.rating || 0,
  };
  const queryOptions = {
    take: 11,
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      created_at: Prisma.SortOrder.desc,
    },
  };
  const reviews: ReviewWithUser[] =
    await reviewRepository.findAllReviewsByProductId(product_id, queryOptions);
  let hasNextPage = false;
  let nextCursor: string | null = null;
  let initialReviews = reviews;

  if (reviews.length > 10) {
    hasNextPage = true;
    const lastItem = reviews.pop();
    nextCursor = lastItem!.id;
    initialReviews = reviews;
  }

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
    review_count:
      reviewGroup.one +
      reviewGroup.two +
      reviewGroup.three +
      reviewGroup.four +
      reviewGroup.five,
    price: serializedProduct.price,
    discount: serializedProduct.discount,
    description: serializedProduct.description || "",
  };

  return (
    <div className="space-y-4 px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <ProductImage
          className="lg:col-span-5"
          imageKey={productData.imageKey}
          name={productData.name}
        />
        <div className="lg:col-span-7 flex flex-col gap-6">
          <ProductDetails product={productData} />
          <ProductActions productId={product.id} />
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
