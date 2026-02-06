import { Star } from "lucide-react";
import { Metadata } from "next";

import {
  getAllReviewsAction,
  getReviewStatsAction,
  ReviewStats,
} from "@/actions/admin/review-actions";
import { ReviewsTable } from "@/components/admin/reviews/reviews-table";
import { SharedCard } from "@/components/shared/shared-card";

export const metadata: Metadata = {
  title: "Reviews Moderation | Admin Dashboard",
  description: "Moderate user reviews and maintain content quality",
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{
    cursor?: string;
    search?: string;
    rating?: string;
  }>;
}) {
  const params = await searchParams;

  let reviews = null;
  let stats: ReviewStats | null = null;
  let error = null;

  try {
    const [reviewsResponse, statsResponse] = await Promise.all([
      getAllReviewsAction({
        cursor: params.cursor,
        search: params.search,
        rating: params.rating ? parseInt(params.rating) : undefined,
        limit: 30,
      }),
      getReviewStatsAction(),
    ]);

    if (reviewsResponse.success) {
      reviews = reviewsResponse.data;
    } else {
      error = reviewsResponse.details;
    }

    if (statsResponse.success) {
      stats = statsResponse.data;
    }
  } catch {
    error = "Failed to load reviews";
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= Math.round(rating)
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">
            Reviews Moderation
          </h1>
        </div>
        <p className="text-muted-foreground">
          Review and moderate user-submitted product reviews
        </p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SharedCard
            title="Total Reviews"
            titleClassName="text-sm font-medium"
            contentClassName=""
          >
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentReviews} new this week
            </p>
          </SharedCard>
          <SharedCard
            title="Average Rating"
            titleClassName="text-sm font-medium"
            contentClassName=""
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {stats.averageRating.toFixed(1)}
              </span>
              {renderStars(stats.averageRating)}
            </div>
            <p className="text-xs text-muted-foreground">Platform average</p>
          </SharedCard>
          <SharedCard
            title="5-Star Reviews"
            titleClassName="text-sm font-medium"
            contentClassName=""
          >
            <div className="text-2xl font-bold">
              {stats.ratingDistribution.find((r) => r.rating === 5)?.count ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalReviews > 0
                ? (
                    ((stats.ratingDistribution.find((r) => r.rating === 5)
                      ?.count ?? 0) /
                      stats.totalReviews) *
                    100
                  ).toFixed(1)
                : 0}
              % of all reviews
            </p>
          </SharedCard>
          <SharedCard
            title="Low Ratings"
            titleClassName="text-sm font-medium"
            contentClassName=""
          >
            <div className="text-2xl font-bold text-amber-600">
              {stats.ratingDistribution
                .filter((r) => r.rating <= 2)
                .reduce((sum, r) => sum + r.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              1-2 star reviews to monitor
            </p>
          </SharedCard>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {reviews && <ReviewsTable initialData={reviews} searchParams={params} />}
    </div>
  );
}
