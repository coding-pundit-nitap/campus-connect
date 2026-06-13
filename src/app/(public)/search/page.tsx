import { Metadata } from "next";
import { Suspense } from "react";

import SearchPage from "@/page-components/search/search-page";
import {
  dbSearchService,
  ProductSearchParams,
} from "@/services/search/db-search.service";

export const metadata: Metadata = {
  title: "Search Products | Campus Connect",
  description:
    "Search and filter products across all canteens and stationery shops in campus.",
};

export default function Page() {
  async function searchAction(params: ProductSearchParams) {
    "use server";
    return dbSearchService.searchProducts(params);
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Loading search page...
            </p>
          </div>
        </div>
      }
    >
      <SearchPage searchAction={searchAction} />
    </Suspense>
  );
}
