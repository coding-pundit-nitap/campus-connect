import { Star } from "lucide-react";
import React from "react";

import { cn } from "@/lib/cn";
import { ImageUtils } from "@/lib/utils";
import { ReviewWithUser } from "@/types/review.type";

import { ClientDate } from "../shared/client-date";
import UserAvatar from "../sidebar/user-avatar";
import { Card, CardContent } from "../ui/card";

type Props = {
  review: ReviewWithUser;
};

export const StarRating = ({
  rating,
  size = "default",
}: {
  rating: number;
  size?: "sm" | "default";
}) => {
  const starSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            starSize,
            "transition-colors",
            rating >= star
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 dark:text-gray-600"
          )}
        />
      ))}
    </div>
  );
};

export default function ReviewCard({ review }: Props) {
  return (
    <Card className="transition-all hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <UserAvatar
            image={ImageUtils.getImageUrl(review.user.image)}
            name={review.user.name}
            dimention={44}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <p className="font-semibold">
                  {review.user.name || "Anonymous"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-sm font-medium text-yellow-600 dark:text-yellow-500">
                    {review.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                <ClientDate date={review.created_at} format="datetime" />
              </span>
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {review.comment}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
