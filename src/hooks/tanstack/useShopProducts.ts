"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/actions";
import { queryKeys } from "@/lib/query-keys";
import { productAPIService, shopAPIService } from "@/services/api";
import { ProductFormData } from "@/validations/product";

export function useShop(shop_id: string) {
  return useQuery({
    queryKey: queryKeys.shops.detail(shop_id),
    queryFn: () => shopAPIService.fetchShop({ shop_id }),
    enabled: !!shop_id && shop_id.trim() !== "",
  });
}

export const useShopProducts = (shop_id: string) => {
  return useInfiniteQuery({
    queryKey: queryKeys.shops.products(shop_id),
    queryFn: ({ pageParam }) =>
      productAPIService.fetchShopProducts({ shop_id, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!shop_id && shop_id.trim() !== "",
  });
};

export function useShopProductsFlat(shop_id: string) {
  const query = useShopProducts(shop_id);
  const products = query.data?.pages.flatMap((page) => page.data) ?? [];

  return {
    ...query,
    products,
    hasProducts: products.length > 0,
    totalProducts: products.length,
  };
}

export function useShopByUser() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: queryKeys.shops.byUser(),
    queryFn: () => shopAPIService.fetchShopsByUser(),
    enabled: !!session?.user.id,
  });
}

export function useShopProductsUpdate(product_id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      formData: Omit<ProductFormData, "image_url"> & {
        image_url: string | null;
      }
    ) => updateProductAction(product_id, formData),
    onSuccess: (data) => {
      // Show success message
      toast.success("Product updated successfully!");

      // Invalidate the individual product detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(product_id),
      });

      // Invalidate the shop products list if we have the shop_id
      if (data.data?.shop_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.shops.products(data.data.shop_id),
        });
      }

      // Also invalidate all shop products to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.shops.all,
      });
    },
    onError: (error) => {
      console.error("Failed to update product:", error);
      toast.error("Failed to update product. Please try again.");
    },
  });
}

export function useShopProductsCreate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProductAction,
    onSuccess: ({ data }) => {
      if (data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.shops.products(data.shop_id),
        });
      }
    },
    onError: (error) => {
      console.error("Failed to create product:", error);
      toast.error("Failed to create product. Please try again.");
    },
  });
}

export function useShopProductsDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProductAction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
      });
    },
    onError: (error) => {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product. Please try again.");
    },
  });
}
