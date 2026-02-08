"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send, Star } from "lucide-react";
import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { useCreateReview, useUpdateReview } from "@/hooks";
import { cn } from "@/lib/cn";

import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Textarea } from "../ui/textarea";

type Props = {
  product_id: string;
  order_item_id?: string;
  review_id?: string;
  initialRating?: number;
  initialComment?: string;
  onSuccess?: () => void;
};

const reviewFormSchema = z.object({
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters long")
    .max(1000, "Comment must be at most 1000 characters long"),
});

export type ReviewFormData = z.infer<typeof reviewFormSchema>;

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Poor", color: "text-red-500" },
  2: { label: "Fair", color: "text-orange-500" },
  3: { label: "Good", color: "text-yellow-500" },
  4: { label: "Very Good", color: "text-lime-500" },
  5: { label: "Excellent", color: "text-green-500" },
};

const MAX_COMMENT_LENGTH = 1000;
const MIN_COMMENT_LENGTH = 10;

export default function ReviewForm({
  product_id,
  order_item_id,
  review_id,
  initialRating = 5,
  initialComment = "",
  onSuccess,
}: Props) {
  const { mutate: createReview, isPending: isCreatePending } =
    useCreateReview();
  const { mutate: updateReview, isPending: isUpdatePending } =
    useUpdateReview();
  const isPending = isCreatePending || isUpdatePending;
  const isUpdate = !!review_id;
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: initialRating,
      comment: initialComment,
    },
  });

  const handleFormSubmit = (data: { rating: number; comment: string }) => {
    if (isUpdate && review_id) {
      updateReview(
        { ...data, product_id, review_id },
        {
          onSuccess: () => {
            setIsSubmitted(true);
            setTimeout(() => {
              onSuccess?.();
            }, 1500);
          },
        }
      );
    } else {
      if (!order_item_id) {
        toast.error("Order item ID is required for creating a review");
        return;
      }
      createReview(
        { ...data, product_id, order_item_id },
        {
          onSuccess: () => {
            setIsSubmitted(true);
            setTimeout(() => {
              onSuccess?.();
            }, 1500);
          },
        }
      );
    }
  };

  const commentValue = useWatch({ control: form.control, name: "comment" });
  const remainingChars = MAX_COMMENT_LENGTH - (commentValue?.length || 0);
  const isNearLimit = remainingChars <= 100;

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4 animate-in fade-in zoom-in duration-300">
        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Star className="h-8 w-8 text-green-600 dark:text-green-400 fill-current" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Thank you for your review!</h3>
          <p className="text-sm text-muted-foreground">
            Your feedback helps other customers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <FormField
          name="rating"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Rating</FormLabel>
              <FormControl>
                <StarRating
                  rating={field.value}
                  onChange={(rating) => field.onChange(rating)}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="comment"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Your Review</FormLabel>
                <span
                  className={cn(
                    "text-xs transition-colors",
                    isNearLimit ? "text-orange-500" : "text-muted-foreground",
                    remainingChars < 0 && "text-destructive font-medium"
                  )}
                >
                  {remainingChars} characters remaining
                </span>
              </div>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Share your experience with this product. What did you like or dislike?"
                  className="min-h-30 resize-none transition-all focus:ring-2 focus:ring-primary/20"
                  disabled={isPending}
                />
              </FormControl>
              <div className="flex items-center justify-between">
                <FormMessage />
                {commentValue?.length > 0 &&
                  commentValue.length < MIN_COMMENT_LENGTH && (
                    <span className="text-xs text-muted-foreground">
                      {MIN_COMMENT_LENGTH - commentValue.length} more characters
                      needed
                    </span>
                  )}
              </div>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={
              !form.formState.isDirty || !form.formState.isValid || isPending
            }
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isUpdate ? "Updating..." : "Submitting..."}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {isUpdate ? "Update Review" : "Submit Review"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

const StarRating = ({
  rating,
  onChange,
  disabled = false,
}: {
  rating: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || rating;
  const ratingInfo = RATING_LABELS[displayRating] || RATING_LABELS[5];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = displayRating >= star;
          return (
            <button
              key={star}
              type="button"
              onClick={() => !disabled && onChange(star)}
              onMouseEnter={() => !disabled && setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={disabled}
              className={cn(
                "transform-gpu transition-all duration-150 ease-out p-1 rounded-md",
                "hover:scale-125 active:scale-110",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                disabled && "cursor-not-allowed opacity-50"
              )}
              aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors duration-150",
                  isFilled
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300 dark:text-gray-600"
                )}
              />
            </button>
          );
        })}
      </div>
      <div
        className={cn(
          "text-sm font-medium transition-colors duration-150",
          ratingInfo.color
        )}
      >
        {ratingInfo.label}
      </div>
    </div>
  );
};
