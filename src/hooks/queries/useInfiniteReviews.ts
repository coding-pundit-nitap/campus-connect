"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/lib/query-keys";
import reviewApiService from "@/services/api/review-api.service";
import { ReviewWithUser } from "@/types/review.type";

type Props = {
  product_id: string;
  initialData: ReviewWithUser[];
  initialHasNextPage: boolean;
  initialNextCursor: string | null;
  initialError?: string;
};

export const useInfiniteReviews = ({
  product_id,
  initialData,
  initialHasNextPage,
  initialNextCursor,
  initialError,
}: Props) => {
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.products.reviews(product_id),
    queryFn: ({ pageParam }) =>
      reviewApiService.fetchReviews({ product_id, cursor: pageParam }),
    initialPageParam: initialNextCursor,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData:
      initialData.length > 0
        ? {
            pages: [
              {
                data: initialData,
                nextCursor: initialNextCursor,
              },
            ],
            pageParams: [null],
          }
        : undefined,
  });
  const allReviews: ReviewWithUser[] = useMemo(() => {
    if (!data?.pages) {
      return initialData;
    }

    const serverData = data.pages[0]?.data ?? [];
    const clientPages = data.pages.slice(1);

    return [...serverData, ...clientPages.flatMap((page) => page.data)];
  }, [data, initialData]);
  const isEmpty = allReviews.length === 0;

  return {
    allReviews,
    isEmpty,
    isLoading: isLoading && initialData.length === 0,
    isError: isError || !!initialError,
    error: error || (initialError ? new Error(initialError) : null),
    hasNextPage: hasNextPage ?? initialHasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
};
