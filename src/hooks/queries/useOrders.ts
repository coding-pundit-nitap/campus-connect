"use client";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";

import {
  updateOrderStatusAdminAction,
  updatePaymentStatusAction,
} from "@/actions/admin";
import {
  batchUpdateOrderStatusAction,
  createOrderAction,
  updateOrderStatusAction,
} from "@/actions/orders/order-actions";
import { queryKeys } from "@/lib/query-keys";
import { orderAPIService } from "@/services";
import { SerializedOrderWithDetails } from "@/types";

export type UseOrdersProps = {
  initialData: SerializedOrderWithDetails[];
  initialHasNextPage: boolean;
  initialNextCursor: string | null;
  initialError?: string;
};

export function useOrders({
  initialData,
  initialHasNextPage,
  initialNextCursor,
  initialError,
}: UseOrdersProps) {
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
    queryFn: ({ pageParam }) =>
      orderAPIService.fetchUserOrders({ cursor: pageParam }),
    initialPageParam: initialNextCursor,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData:
      initialData.length > 0
        ? {
            pages: [
              {
                data: initialData,
                nextCursor: initialNextCursor,
                hasMore: initialHasNextPage,
              },
            ],
            pageParams: [null],
          }
        : undefined,
  });

  const allOrders: SerializedOrderWithDetails[] = useMemo(() => {
    if (!data?.pages) {
      return initialData;
    }

    return data.pages.flatMap((page) => page.data);
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
}

function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrderAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
}

export function useBatchUpdateOrderStatus(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchUpdateOrderStatusAction,
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.details || "Order status updated");
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        onSuccess?.();
      } else {
        toast.error(response.details || "Failed to update order status");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update order status");
    },
  });
}

export function useUpdateShopOrderStatus() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrderStatusAction,
    onSuccess: (response) => {
      toast.success(response.details);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update order status");
    },
  });
}

export function useUpdateOrderStatus() {
  const router = useRouter();

  return useMutation({
    mutationFn: updateOrderStatusAdminAction,
    onSuccess: (response) => {
      toast.success(response.details);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update order status");
    },
  });
}

export function useUpdatePaymentStatus() {
  const router = useRouter();

  return useMutation({
    mutationFn: updatePaymentStatusAction,
    onSuccess: (response) => {
      toast.success(response.details);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update payment status");
    },
  });
}

export function useDownloadOrderPDF() {
  return useMutation({
    mutationFn: async ({
      order_id,
      display_id,
    }: {
      order_id: string;
      display_id: string;
    }) => {
      const blob = await orderAPIService.dounloadInvoice(order_id);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `order-${display_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { display_id };
    },
    onSuccess: ({ display_id }) => {
      toast.success(`Order receipt ${display_id} downloaded`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to download PDF");
    },
  });
}

export { useCreateOrder };
