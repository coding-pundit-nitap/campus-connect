"use client";
import React from "react";

import { useInfiniteReviews } from "@/hooks/useInfiniteReviews";
import { ReviewWithUser } from "@/types/review.type";

import ReviewCard from "./review-card";
import { ProductReviewsList } from "./review-list";

type Props = {
  product_id: string;
  initialReviews: ReviewWithUser[];
  hasNextPage: boolean;
  nextCursor: string | null;
  initialError?: string;
  reviewGroup: {
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
  };
};

export default function ReviewContainer({
  initialReviews,
  hasNextPage: initialHasNextPage,
  nextCursor: initialNextCursor,
  initialError,
  product_id,
  reviewGroup,
}: Props) {
  const {
    allReviews,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteReviews({
    product_id,
    initialData: initialReviews,
    initialHasNextPage: initialHasNextPage,
    initialNextCursor: initialNextCursor,
    initialError: initialError,
  });

  return (
    <ProductReviewsList
      displayReviews={allReviews}
      isLoading={isLoading}
      fetchNextPage={fetchNextPage}
      error={error}
      hasNextPage={hasNextPage}
      isError={isError}
      reviewGroup={reviewGroup}
      isFetchingNextPage={isFetchingNextPage}
      renderReviewCard={(review) => {
        return <ReviewCard key={review.id} review={review} />;
      }}
    />
  );
}
