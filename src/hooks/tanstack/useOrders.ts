"use client";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";

import {
  createOrderAction,
  getOrdersAction,
} from "@/actions/order/order-actions";
import { queryKeys } from "@/lib/query-keys";
import { createSuccessResponse, SerializedOrderWithDetails } from "@/types";

type Props = {
  initialData: SerializedOrderWithDetails[];
  initialHasNextPage: boolean;
  initialNextCursor: number | null;
  initialError?: string;
};

export const useOrders = ({
  initialData,
  initialHasNextPage,
  initialNextCursor,
  initialError,
}: Props) => {
  const paginatedInitialData = {
    data: initialData,
    totalPages: initialHasNextPage ? 2 : 1,
    currentPage: 1,
  };
  const response = createSuccessResponse(paginatedInitialData, "Initial data");
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.orders.all,
    queryFn: ({ pageParam = 1 }) => getOrdersAction({ page: pageParam || 1 }),
    initialPageParam: initialNextCursor,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.currentPage < lastPage.data.totalPages) {
        return lastPage.data.currentPage + 1;
      }
      return undefined;
    },
    initialData:
      initialData.length > 0
        ? {
            pages: [response],
            pageParams: [null],
          }
        : undefined,
  });

  const allOrders: SerializedOrderWithDetails[] = useMemo(() => {
    if (!data?.pages) return initialData;

    return data.pages.flatMap((page) => page.data.data);
  }, [data, initialData]);

  return {
    allOrders,
    isLoading: isLoading && initialData.length === 0,
    isError: isError || !!initialError,
    error: error || (initialError ? new Error(initialError) : null),
    hasNextPage: hasNextPage ?? initialHasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrderAction,
    onSuccess: () => {
      toast.success("Order created successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
