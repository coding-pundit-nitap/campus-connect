"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  bulkCreateProductsAction,
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/actions";
import { useSession } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import { productAPIService } from "@/services/product";
import { shopAPIService } from "@/services/shop";
import { ProductUpdateFormData } from "@/validations/product";

export function useShop(shop_id: string) {
  return useQuery({
    queryKey: queryKeys.shops.detail(shop_id),
    queryFn: () => shopAPIService.fetchShop({ shop_id }),
    enabled: !!shop_id && shop_id.trim() !== "",
  });
}

export interface ShopProductsFilters {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  categoryId?: string;
  search?: string;
  inStock?: boolean;
}

export const useShopProducts = (
  shop_id: string,
  filters?: ShopProductsFilters
) => {
  return useInfiniteQuery({
    queryKey: queryKeys.products.byShopWithFilters(shop_id, filters),
    queryFn: ({ pageParam }) =>
      productAPIService.fetchShopProducts({
        shop_id,
        cursor: pageParam,
        ...filters,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!shop_id && shop_id.trim() !== "",
  });
};

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
      formData: Omit<ProductUpdateFormData, "image_key"> & {
        image_key: string | null;
      }
    ) => updateProductAction(product_id, formData),
    onSuccess: (data) => {
      toast.success("Product updated successfully!");

      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(product_id),
      });

      if (data.data?.shop_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.byShop(data.data.shop_id),
        });
      }

      queryClient.invalidateQueries({
        queryKey: queryKeys.shops.all,
      });
    },
    onError: () => {
      toast.error("Failed to update product. Please try again.");
    },
  });
}

export function useShopProductsCreate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProductAction,
    onSuccess: ({ data, success, details }) => {
      if (success) {
        toast.success(details || "Product created successfully!");

        queryClient.invalidateQueries({
          queryKey: queryKeys.products.byShop(data.shop_id),
        });

        queryClient.invalidateQueries({
          queryKey: queryKeys.shops.detail(data.shop_id),
        });

        queryClient.invalidateQueries({
          queryKey: queryKeys.shops.all,
        });
      }
    },
    onError: () => {
      toast.error("Failed to create product. Please try again.");
    },
  });
}

export function useShopProductsDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { product_id: string; shop_id: string }) =>
      deleteProductAction(params.product_id),
    onSuccess: ({ success, details }, variables) => {
      if (success) {
        toast.success(details || "Product deleted successfully!");

        queryClient.invalidateQueries({
          queryKey: queryKeys.products.detail(variables.product_id),
        });

        queryClient.invalidateQueries({
          queryKey: queryKeys.products.byShop(variables.shop_id),
        });

        queryClient.invalidateQueries({
          queryKey: queryKeys.shops.detail(variables.shop_id),
        });

        queryClient.invalidateQueries({
          queryKey: queryKeys.shops.all,
        });
      }
    },
    onError: () => {
      toast.error("Failed to delete product. Please try again.");
    },
  });
}

export function useBulkProductsCreate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkCreateProductsAction,
    onSuccess: ({ data, success, details }) => {
      if (success && data) {
        toast.success(details || `Created ${data.created} products!`);

        queryClient.invalidateQueries({
          queryKey: queryKeys.products.all,
        });

        queryClient.invalidateQueries({
          queryKey: queryKeys.shops.all,
        });
      }
    },
    onError: () => {
      toast.error("Failed to create products. Please try again.");
    },
  });
}
