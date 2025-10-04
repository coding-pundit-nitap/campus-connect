import { Star, StarHalf } from "lucide-react";
import Image from "next/image";
import React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ReviewWithUser } from "@/types/review.type";

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
      <Avatar>
        {review.user.image ? (
          <Image
            src={review.user.image}
            alt={review.user.name || "User"}
            width={40}
            height={40}
            className="rounded-full object-cover"
            priority={false}
            unoptimized={false}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <AvatarFallback>
          {(review.user.name || "Anonymous")
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{review.user.name || "Anonymous"}</p>
          <span className="text-xs text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString("en-IN")}
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
