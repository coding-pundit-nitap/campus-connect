import { productAPIService } from "@/services/product";
import { SerializedProduct } from "@/types/product.types";

export async function getHomepageData() {
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

  return {
    initialProducts,
    hasNextPage,
    nextCursor,
    initialError,
  };
}
