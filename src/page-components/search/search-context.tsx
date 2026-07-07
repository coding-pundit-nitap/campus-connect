"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

import { ShopType } from "@/generated/client";
import { useActiveBrands } from "@/hooks";
import { useProductActions } from "@/hooks/common/useProductActions";
import { useProductSearch } from "@/hooks/queries/useSearchQuery";
import { ProductDocument } from "@/services/search/db-search.service";
import { SearchResult } from "@/types";
import { SerializedProduct } from "@/types/product.types";

export function mapDocumentToProduct(
  hit: ProductDocument & { id: string }
): SerializedProduct {
  return {
    id: hit.id,
    name: hit.name,
    description: hit.description,
    price: hit.price,
    discount: hit.discount,
    stock_quantity: hit.stock_quantity,
    image_key: hit.image_key,
    brand_id: hit.brand_id,
    is_veg: hit.is_veg,
    is_preorder: false,
    deleted_at: null,
    created_at: new Date(hit.created_at),
    updated_at: new Date(hit.updated_at),
    shop_id: hit.shop_id,
    category_id: hit.category_id,
    rating: 5,
    shop: { id: hit.shop_id, name: hit.shop_name },
    category: hit.category_name
      ? { id: hit.category_id || "", name: hit.category_name }
      : null,
  };
}

export interface SearchState {
  inputValue: string;
  deferredQuery: string;
  activeTab: ShopType | "ALL";
  isVegOnly: boolean;
  selectedBrand: string | null;
  mounted: boolean;
  mappedProducts: SerializedProduct[];
  isPending: boolean;
  hasActiveFilters: boolean;
  brands: SearchResult[] | undefined;
  totalResults: number;
  isAddingToCart: boolean;
}

export interface SearchActions {
  setInputValue: (val: string) => void;
  pushParams: (updates: {
    q?: string;
    type?: string | null;
    veg?: boolean | null;
    brand?: string | null;
  }) => void;
  handleTabChange: (tab: string) => void;
  handleReset: () => void;
  onAddToCart: ((product_id: string, quantity: number) => void) | undefined;
  onViewDetails: ((id: string) => void) | undefined;
}

export interface SearchContextValue {
  state: SearchState;
  actions: SearchActions;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearchContext must be used within a SearchProvider");
  }
  return context;
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const searchParamsObj = useSearchParams();
  const router = useRouter();

  const activeTab = (searchParamsObj.get("type") as ShopType | "ALL") || "ALL";
  const isVegOnly = searchParamsObj.get("veg") === "true";
  const selectedBrand = searchParamsObj.get("brand");

  const { data: brands } = useActiveBrands();

  const [inputValue, setInputValue] = useState(
    () => searchParamsObj.get("q") || ""
  );
  const deferredQuery = useDeferredValue(inputValue);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const tt = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(tt);
  }, []);

  const { onAddToCart, onViewDetails, isAddingToCart } = useProductActions({
    mode: "user",
  });

  const {
    data: results,
    isFetching,
    isError,
  } = useProductSearch({
    q: deferredQuery,
    type: activeTab,
    veg: isVegOnly,
    brand_id: selectedBrand,
  });

  if (isError) {
    toast.error("Failed to perform search. Please try again.", {
      id: "search-error",
    });
  }

  const pushParams = useCallback(
    (updates: {
      q?: string;
      type?: string | null;
      veg?: boolean | null;
      brand?: string | null;
    }) => {
      const next = new URLSearchParams(searchParamsObj.toString());

      if ("q" in updates) {
        if (updates.q) {
          next.set("q", updates.q);
        } else {
          next.delete("q");
        }
      }
      if ("type" in updates) {
        if (updates.type && updates.type !== "ALL") {
          next.set("type", updates.type);
        } else {
          next.delete("type");
        }
      }
      if ("veg" in updates) {
        if (updates.veg) {
          next.set("veg", "true");
        } else {
          next.delete("veg");
        }
      }
      if ("brand" in updates) {
        if (updates.brand) {
          next.set("brand", updates.brand);
        } else {
          next.delete("brand");
        }
      }

      router.replace(`/search?${next.toString()}` as Route, { scroll: false });
    },
    [searchParamsObj, router]
  );

  const handleTabChange = useCallback(
    (tab: string) => {
      const next = new URLSearchParams(searchParamsObj.toString());
      if (tab !== "ALL") {
        next.set("type", tab);
      } else {
        next.delete("type");
      }
      next.delete("veg");
      next.delete("brand");
      router.replace(`/search?${next.toString()}` as Route, { scroll: false });
    },
    [searchParamsObj, router]
  );

  const handleReset = useCallback(() => {
    setInputValue("");
    router.replace("/search" as Route, { scroll: false });
  }, [router]);

  const mappedProducts: SerializedProduct[] = (results?.hits ?? []).map(
    mapDocumentToProduct
  );

  const hasActiveFilters =
    !!deferredQuery || activeTab !== "ALL" || isVegOnly || !!selectedBrand;

  const isPending = deferredQuery !== inputValue || isFetching;

  const value: SearchContextValue = {
    state: {
      inputValue,
      deferredQuery,
      activeTab,
      isVegOnly,
      selectedBrand,
      mounted,
      mappedProducts,
      isPending,
      hasActiveFilters,
      brands,
      totalResults: results?.total || 0,
      isAddingToCart,
    },
    actions: {
      setInputValue,
      pushParams,
      handleTabChange,
      handleReset,
      onAddToCart,
      onViewDetails,
    },
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
