import { productAPIService } from "@/services/api";
import { SerializedProduct } from "@/types/product.types";

import ProductsList from "./products-list";

export default async function Homepage() {
  let initialProducts: SerializedProduct[] = [];
  let hasNextPage = false;
  let nextCursor: string | null = null;
  let initialError: string | undefined;

  try {
    const result = await productAPIService.fetchProducts({ limit: 20 });
    initialProducts = result.initialProducts;
    hasNextPage = result.hasNextPage;
    nextCursor = result.nextCursor;
    initialError = result.error;
  } catch {
    // Handle error silently, initialProducts will remain an empty array
  }

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
