import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
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
  onClose: () => void;
  product_id: string;
};

const reviewFormSchema = z.object({
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters long")
    .max(1000, "Comment must be at most 1000 characters long"),
});

export type ReviewFormData = z.infer<typeof reviewFormSchema>;

export default function ReviewForm({ onClose, product_id }: Props) {
  const { mutate: createReview } = useCreateReview();

  const handleFormSubmit = (data: { rating: number; comment: string }) => {
    createReview({ ...data, product_id });
    onClose();
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
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
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
  return (
    <div className="flex w-full justify-between space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Button
          key={star}
          type="button"
          variant="ghost"
          onClick={() => {
            onChange(star);
          }}
          className={`text-3xl cursor-pointer transition-colors hover:scale-110 transform duration-150`}
          style={{
            color: star <= rating ? "#eab308" : "#d1d5db",
          }}
        >
          ★
        </Button>
      ))}
    </div>
  );
};
