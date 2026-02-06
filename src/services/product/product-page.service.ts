import { notFound } from "next/navigation";

import { Prisma } from "@/../prisma/generated/client";
import { serializeProduct } from "@/lib/utils/product.utils";
import reviewRepository from "@/repositories/reviews.repository";
import { productService } from "@/services/product/product.service";
import { ReviewWithUser } from "@/types/review.type";

export async function getProductPageData(product_id: string) {
  const product = await productService.getProductById(product_id);

  if (!product) {
    notFound();
  }

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

  const serializedProduct = serializeProduct(product);

  const productData = {
    id: serializedProduct.id,
    name: serializedProduct.name,
    image_key: serializedProduct.image_key,
    shop: {
      id: product.shop.id,
      name: product.shop.name,
    },
    stock_quantity: serializedProduct.stock_quantity,
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

  return {
    product: productData,
    initialReviews,
    hasNextPage,
    nextCursor,
    reviewGroup,
    rawProductId: product.id,
  };
}
