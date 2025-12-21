import { getHomepageData } from "@/services/product/homepage.service";

import ProductsList from "./products-list";

export default async function Homepage() {
  const { initialProducts, hasNextPage, nextCursor, initialError } =
    await getHomepageData();

  return (
    <ProductsList
      initialProducts={initialProducts}
      hasNextPage={hasNextPage}
      nextCursor={nextCursor}
      initialError={initialError}
      limit={20}
    />
  );
}
