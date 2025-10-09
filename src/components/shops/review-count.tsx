import { Star } from "lucide-react";
import React, { useMemo } from "react";

import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import ReviewForm from "./review-form";

type Props = {
  reviewGroup: {
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
  };
  product_id: string;
};

export default function ReviewCount({ reviewGroup, product_id }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
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

  if (isOpen) {
    return (
      <ReviewForm product_id={product_id} onClose={() => setIsOpen(false)} />
    );
  }

  if (totalReviews === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-lg bg-secondary/50 border-2 border-dashed border-muted-foreground/20">
        <div className="flex flex-col items-center gap-2">
          <Star />
          <h3 className="text-lg font-semibold">
            Be the first one to review it
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Share your experience and help others make informed decisions
          </p>
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          variant="default"
          size="lg"
          className="px-6"
        >
          Write the First Review
        </Button>
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
      <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-secondary">
        <p className="text-sm text-muted-foreground">
          Have you used this product?
        </p>
        <Button onClick={() => setIsOpen(true)} variant="outline">
          Write a Review
        </Button>
      </div>
    </div>
  );
}
