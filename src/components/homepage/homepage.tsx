import React from "react";

import { productAPIService } from "@/services/api";

import ProductsList from "./products-list";

export default async function Homepage() {
  try {
    const { initialProducts, nextCursor, hasNextPage, error } =
      await productAPIService.fetchProducts({ limit: 20 });

    return (
      <ProductsList
        initialProducts={initialProducts}
        hasNextPage={hasNextPage}
        nextCursor={nextCursor}
        initialError={error}
        limit={20}
      />
    );
  } catch {
    return (
      <ProductsList
        hasNextPage={false}
        initialProducts={[]}
        nextCursor={null}
      />
    );
  }
}
