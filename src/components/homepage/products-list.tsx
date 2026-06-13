"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { useInfiniteProducts } from "@/hooks/queries/useInfiniteProducts";
// import { useActiveCategories } from "@/hooks/queries/useProductCategoriesSearch";
import { SerializedProduct } from "@/types/product.types";

import { ShopProductList } from "../shops/shop-product-list";
import CategoryPills from "./category-pills";
import FavoriteShopsStrip from "./favorite-shops-strip";
import HotDeals from "./hot-deals";
import OrderAgain from "./order-again";
import AnnouncementCard from "./widgets/announcement-card";
import CampusInfoWidget from "./widgets/campus-info-widget";
import ImpactStatsWidget from "./widgets/impact-stats-widget";

type Props = {
  initialProducts: SerializedProduct[];
  hasNextPage: boolean;
  nextCursor: string | null;
  initialError?: string;
  limit?: number;
};

export default function ProductsList({
  initialProducts,
  hasNextPage: initialHasNextPage,
  nextCursor: initialNextCursor,
  initialError,
  limit,
}: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const {
    allProducts: displayProducts,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isAddingToCart,
    onAddToCart,
    onViewDetails,
  } = useInfiniteProducts({
    initialProducts,
    initialHasNextPage,
    initialNextCursor,
    initialError,
    limit,
    categoryId: selectedCategoryId || undefined,
  });

  return (
    <div className="flex-1 hide-scrollbar overflow-y-auto w-full max-w-7xl mx-auto py-2 px-1 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div
            id="category-pills-section"
            className="animate-fade-in [animation-delay:100ms]"
          >
            <CategoryPills
              selectedId={selectedCategoryId}
              onChange={setSelectedCategoryId}
            />
          </div>

          <AnimatePresence initial={false}>
            {!selectedCategoryId && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-6 overflow-hidden"
              >
                <div className="animate-fade-in [animation-delay:200ms]">
                  <FavoriteShopsStrip />
                </div>
                <div className="animate-fade-in [animation-delay:300ms]">
                  <OrderAgain displayProducts={displayProducts} />
                </div>
                <div
                  id="hot-deals-section"
                  className="animate-fade-in [animation-delay:400ms]"
                >
                  <HotDeals />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            id="products-feed-section"
            className="animate-fade-in [animation-delay:500ms]"
          >
            <ShopProductList
              displayProducts={displayProducts}
              isLoading={isLoading}
              fetchNextPage={fetchNextPage}
              error={error}
              hasNextPage={hasNextPage}
              isError={isError}
              isFetchingNextPage={isFetchingNextPage}
              isAddingToCart={isAddingToCart}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
            />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6 hidden lg:flex flex-col sticky top-4 animate-fade-in [animation-delay:200ms]">
          <CampusInfoWidget />
          <ImpactStatsWidget />
          <AnnouncementCard />
        </div>
      </div>
    </div>
  );
}
