import { Star, StarHalf } from "lucide-react";
import React from "react";

import { ReviewWithUser } from "@/types/review.type";

import { ClientDate } from "../shared/client-date";
import UserAvatar from "../sidebar/user-avatar";

type Props = {
  review: ReviewWithUser;
};

export const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          style={{
            color: "#eab308",
          }}
          className="h-5 w-5"
        />
      ))}
      {halfStar && <StarHalf className="h-5 w-5" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={`empty-${i}`}
          style={{
            color: "#ffffff",
          }}
          className="h-5 w-5"
        />
      ))}
    </div>
  );
};

export default function ReviewCard({ review }: Props) {
  return (
    <div key={review.id} className="flex gap-4">
      <UserAvatar
        image={review.user.image}
        name={review.user.name}
        dimention={40}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{review.user.name || "Anonymous"}</p>
          <span className="text-xs text-muted-foreground">
            <ClientDate date={review.created_at} format="datetime" />
          </span>
        </div>
        <div className="flex items-center gap-2 my-1">
          <StarRating rating={review.rating} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
      </div>
    </div>
  );
}
