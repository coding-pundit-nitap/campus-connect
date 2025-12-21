import { getShopPageData } from "@/services/product/shop-page.service";

import { ProductsContainer } from "./products-container";

type Props = {
  shop_id: string;
};

export async function Products({ shop_id }: Props) {
  const { initialProducts, productStates, hasNextPage, nextCursor, error } =
    await getShopPageData(shop_id);

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
