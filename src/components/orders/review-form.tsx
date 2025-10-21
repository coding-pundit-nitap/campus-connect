"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { useCreateReview } from "@/hooks/tanstack/useReview";

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
  order_item_id: string;
};

const reviewFormSchema = z.object({
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters long")
    .max(1000, "Comment must be at most 1000 characters long"),
});

export type ReviewFormData = z.infer<typeof reviewFormSchema>;

export default function ReviewForm({ product_id, order_item_id }: Props) {
  const { mutate: createReview } = useCreateReview();

  const handleFormSubmit = (data: { rating: number; comment: string }) => {
    createReview({ ...data, product_id, order_item_id });
  };
  const form = useForm({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });
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
              <FormLabel>Your Review</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Write your review here..."
                  className="min-h-[120px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="submit"
            disabled={!form.formState.isDirty || !form.formState.isValid}
          >
            Submit Review
          </Button>
        </div>
      </form>
    </Form>
  );
}
const StarRating = ({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (rating: number) => void;
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="transform-gpu cursor-pointer text-4xl transition-all duration-150 ease-in-out hover:scale-125"
          style={{
            color: (hoverRating || rating) >= star ? "#f59e0b" : "#e5e7eb", // yellow-500 or gray-200
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
};
