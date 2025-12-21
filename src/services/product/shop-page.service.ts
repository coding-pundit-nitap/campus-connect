import { getProductStates } from "@/lib/utils";
import { productService } from "@/services/product/product.service";

export async function getShopPageData(shop_id: string) {
  const { initialProducts, hasNextPage, nextCursor, error } =
    await productService.fetchShopProducts(shop_id);

  const productStates = getProductStates(
    initialProducts,
    initialProducts,
    false,
    false
  );

  return {
    initialProducts,
    productStates,
    hasNextPage,
    nextCursor,
    error,
  };
}
