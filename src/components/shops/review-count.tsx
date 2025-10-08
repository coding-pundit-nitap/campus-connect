import { Star } from "lucide-react";
import React, { useMemo } from "react";

import { Progress } from "../ui/progress";

type Props = {
  reviewGroup: {
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
  };
};

export default function ReviewCount({ reviewGroup }: Props) {
  const ratingDistribution = useMemo(
    () => [
      { star: 5, count: reviewGroup.five },
      { star: 4, count: reviewGroup.four },
      { star: 3, count: reviewGroup.three },
      { star: 2, count: reviewGroup.two },
      { star: 1, count: reviewGroup.one },
    ],
    [reviewGroup]
  );
  const totalReviews = useMemo(
    () =>
      reviewGroup.one +
      reviewGroup.two +
      reviewGroup.three +
      reviewGroup.four +
      reviewGroup.five,
    [reviewGroup]
  );

  if (totalReviews === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-lg bg-secondary/50 border-2 border-dashed border-muted-foreground/20">
        <div className="flex flex-col items-center gap-2">
          <Star />
          <h3 className="text-lg font-semibold">
            Be the first one to review it
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Buy and use this product, then share your experience with others.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {ratingDistribution.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-2">
            <span className="w-12 text-sm text-muted-foreground">
              {star} star
            </span>
            <Progress
              value={(count / totalReviews) * 100}
              className="w-full h-2"
              aria-label={`${count} reviews with ${star} stars`}
            />
            <span className="w-12 text-sm text-right text-muted-foreground">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
