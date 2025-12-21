"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import {
  useAddToCart,
  useImageDelete,
  useShopProductsDelete,
} from "@/hooks/queries";

type UseProductActionsProps = {
  mode: "owner" | "user";
  shop_id?: string;
};

export const useProductActions = ({
  mode,
  shop_id,
}: UseProductActionsProps) => {
  const router = useRouter();
  const { mutate: deleteProduct } = useShopProductsDelete();
  const { mutateAsync: deleteImage } = useImageDelete();
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

  const handlers = useMemo(() => {
    if (mode === "owner") {
      return {
        onDeleteProduct: async (product_id: string, image_key: string) => {
          if (!shop_id) return;
          await deleteImage(image_key);
          deleteProduct({ product_id, shop_id });
        },
        onAddToCart: undefined,
        onViewDetails: undefined,
      };
    }

    return {
      onAddToCart: (product_id: string, quantity: number) => {
        addToCart({ product_id, quantity });
      },
      onViewDetails: (product_id: string) => {
        router.push(`/product/${product_id}`);
      },
      onDeleteProduct: undefined,
    };
  }, [mode, shop_id, deleteProduct, deleteImage, addToCart, router]);

  return {
    ...handlers,
    isAddingToCart,
  };
};
