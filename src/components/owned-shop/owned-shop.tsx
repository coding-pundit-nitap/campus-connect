import { getProductStates } from "@/lib/utils";
import { productService } from "@/services/product/product.service";

import { OwnedShopContainer } from "./owned-shop-container";

type Props = {
  shop_id: string;
};
export async function OwnedShop({ shop_id }: Props) {
  const { initialProducts, hasNextPage, nextCursor, error } =
    await productService.fetchShopProducts(shop_id);

  const productStates = getProductStates(
    initialProducts,
    initialProducts,
    false,
    false
  );

  return (
    <OwnedShopContainer
      shop_id={shop_id}
      initialProducts={initialProducts}
      initialProductStates={productStates}
      hasNextPage={hasNextPage}
      nextCursor={nextCursor}
      initialError={error}
    />
  );
}
