import React, { useMemo } from "react";

import { useInfiniteScroll } from "@/hooks";
import { ReviewWithUser } from "@/types/review.type";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { StarRating } from "./review-card";
import ReviewCount from "./review-count";

type Props = {
  displayReviews: ReviewWithUser[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  renderReviewCard: (
    Review: ReviewWithUser,
    index: number,
    isLastReview: boolean,
    isNearEnd: boolean
  ) => React.ReactNode;
  reviewGroup: {
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
  };
  product_id: string;
};

export function ProductReviewsList({
  displayReviews,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  renderReviewCard,
  error,
  isError,
  reviewGroup,
  product_id,
}: Props) {
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const { lastElementRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin: "100px",
  });
  const totalReviews = useMemo(() => {
    return (
      reviewGroup.one +
      reviewGroup.two +
      reviewGroup.three +
      reviewGroup.four +
      reviewGroup.five
    );
  }, [reviewGroup]);
  const averageRating = useMemo(() => {
    return totalReviews === 0
      ? 0
      : (reviewGroup.one * 1 +
          reviewGroup.two * 2 +
          reviewGroup.three * 3 +
          reviewGroup.four * 4 +
          reviewGroup.five * 5) /
          totalReviews;
  }, [reviewGroup, totalReviews]);

  if (isLoading) {
    return (
      <Card className="w-full py-4 mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mb-4" />
            <p className="text-muted-foreground">Loading reviews...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError && error) {
    return (
      <Card className="w-full py-4 mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Failed to load reviews
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {error.message || "Something went wrong while fetching reviews"}
              </p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="lg"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full py-4 mx-auto">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-2xl font-bold">Customer Reviews</CardTitle>
          {totalReviews > 0 && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <StarRating rating={averageRating} />
              <span className="text-muted-foreground">
                {averageRating.toFixed(1)} out of 5
              </span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">{totalReviews} customer ratings</p>
      </CardHeader>
      <CardContent>
        <ReviewCount reviewGroup={reviewGroup} />
        {displayReviews.length > 0 && (
          <div className="space-y-6 py-6">
            {displayReviews.map((review, index) => {
              const isLastReview = index === displayReviews.length - 1;
              const isNearEnd = index >= displayReviews.length - 3;

              return (
                <div
                  key={review.id}
                  ref={isLastReview ? lastElementRef : undefined}
                  className={isNearEnd ? "scroll-trigger" : ""}
                >
                  {renderReviewCard(review, index, isLastReview, isNearEnd)}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <ReviewListFooter
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          displayReviewsLength={displayReviews.length}
          onFetchNextPage={fetchNextPage}
        />
      </CardFooter>
      <div ref={loadMoreRef} className="h-1" />
    </Card>
  );
}

type temp = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  displayReviewsLength: number;
  onFetchNextPage: () => void;
};

export default function ReviewListFooter({
  hasNextPage,
  isFetchingNextPage,
  displayReviewsLength,
  onFetchNextPage,
}: temp) {
  if (isFetchingNextPage) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-muted-foreground">Loading more reviews...</span>
        </div>
      </div>
    );
  }

  if (hasNextPage && !isFetchingNextPage) {
    return (
      <div className="flex justify-center py-8">
        <Button
          onClick={onFetchNextPage}
          variant="outline"
          size="lg"
          className="px-8"
        >
          Load More reviews
        </Button>
      </div>
    );
  }

  if (!hasNextPage && displayReviewsLength > 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          You&apos;ve reached the end of the review list
        </p>
      </div>
    );
  }

  return null;
}
