import { getProductStates } from "@/lib/utils";
import { productService } from "@/services/product";

import { ProductsContainer } from "./products-container";

type Props = {
  shop_id: string;
};

export async function Products({ shop_id }: Props) {
  const { initialProducts, hasNextPage, nextCursor, error } =
    await productService.fetchShopProducts(shop_id);

  const productStates = getProductStates(
    initialProducts,
    initialProducts,
    false,
    false
  );

  return (
    <ProductsContainer
      shop_id={shop_id}
      initialProducts={initialProducts}
      initialProductStates={productStates}
      hasNextPage={hasNextPage}
      nextCursor={nextCursor}
      initialError={error}
    />
  );
}
