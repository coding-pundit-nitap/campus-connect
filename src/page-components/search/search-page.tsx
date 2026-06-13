"use client";

import {
  BookOpen,
  Layers,
  Leaf,
  Loader2,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { UserProductCard } from "@/components/shared/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ShopType } from "@/generated/client";
import { useProductActions } from "@/hooks/common/useProductActions";
import { cn } from "@/lib/cn";
import {
  DBSearchResult,
  ProductDocument,
  ProductSearchParams,
} from "@/services/search/db-search.service";
import { SerializedProduct } from "@/types/product.types";

interface SearchPageProps {
  searchAction: (
    params: ProductSearchParams
  ) => Promise<DBSearchResult<ProductDocument>>;
}

const STATIONERY_BRANDS = [
  "Classmate",
  "Casio",
  "Parker",
  "Pilot",
  "Reynolds",
  "Luxor",
];

export default function SearchPage({ searchAction }: SearchPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize state from URL params to support back navigation and direct links
  const [inputValue, setInputValue] = useState(
    () => searchParams.get("q") || ""
  );
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") || ""
  );
  const [activeTab, setActiveTab] = useState<ShopType | "ALL">(() => {
    const type = searchParams.get("type");
    return (type as ShopType | "ALL") || "ALL";
  });
  const [isVegOnly, setIsVegOnly] = useState(
    () => searchParams.get("veg") === "true"
  );
  const [selectedBrand, setSelectedBrand] = useState<string | null>(() =>
    searchParams.get("brand")
  );

  const [results, setResults] =
    useState<DBSearchResult<ProductDocument> | null>(null);
  const [isPending, startTransition] = useTransition();

  // Get shared product actions for add to cart and navigation
  const { onAddToCart, onViewDetails, isAddingToCart } = useProductActions({
    mode: "user",
  });

  // Debounce search query updates
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  // Query search backend and sync URL whenever parameters change
  useEffect(() => {
    const params: ProductSearchParams = {
      limit: 24,
    };

    if (searchQuery.trim()) {
      params.query = searchQuery.trim();
    }
    if (activeTab !== "ALL") {
      params.shop_type = activeTab as ShopType;
    }
    if (activeTab === "CANTEEN" && isVegOnly) {
      params.is_veg = true;
    }
    if (activeTab === "STATIONERY" && selectedBrand) {
      params.brand = selectedBrand;
    }

    startTransition(async () => {
      try {
        const data = await searchAction(params);
        setResults(data);
      } catch (err) {
        toast.error("Failed to perform search. Please try again.");
      }
    });

    // Sync state to URL params
    const urlParams = new URLSearchParams();
    if (searchQuery.trim()) urlParams.set("q", searchQuery.trim());
    if (activeTab !== "ALL") urlParams.set("type", activeTab);
    if (activeTab === "CANTEEN" && isVegOnly) urlParams.set("veg", "true");
    if (activeTab === "STATIONERY" && selectedBrand) {
      urlParams.set("brand", selectedBrand);
    }

    router.replace(`/search?${urlParams.toString()}` as Route, {
      scroll: false,
    });
  }, [searchQuery, activeTab, isVegOnly, selectedBrand, router, searchAction]);

  // Reset all filters and search queries
  const handleReset = () => {
    setInputValue("");
    setSearchQuery("");
    setActiveTab("ALL");
    setIsVegOnly(false);
    setSelectedBrand(null);
  };

  // Map database hits to UI-compatible SerializedProduct format
  const mappedProducts: SerializedProduct[] =
    results?.hits.map((hit) => ({
      id: hit.id,
      name: hit.name,
      description: hit.description,
      price: hit.price,
      discount: hit.discount,
      stock_quantity: hit.stock_quantity,
      image_key: hit.image_key,
      brand: hit.brand,
      is_veg: hit.is_veg,
      is_preorder: false,
      deleted_at: null,
      created_at: new Date(hit.created_at),
      updated_at: new Date(hit.updated_at),
      shop_id: hit.shop_id,
      category_id: hit.category_id,
      rating: 5, // Default rating as dbSearch does not return sum/count
      shop: {
        id: hit.shop_id,
        name: hit.shop_name,
      },
      category: hit.category_name
        ? {
            id: hit.category_id || "",
            name: hit.category_name,
          }
        : null,
    })) || [];

  const tabs = [
    { id: "ALL", label: "All Items", icon: Layers },
    { id: "CANTEEN", label: "Canteens", icon: Store },
    { id: "STATIONERY", label: "Stationery", icon: BookOpen },
    { id: "GROCERY", label: "Groceries", icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-slate-50 to-pink-50/30 dark:from-zinc-950 dark:via-zinc-900/95 dark:to-zinc-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-10 mt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Unified Campus Marketplace
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            What are you looking for today?
          </h1>
          <p className="mt-3 text-lg text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto">
            Search snacks, textbooks, pens, or drinks across all campus shops
            with instant global filters.
          </p>
        </div>

        {/* Search & Filter Container (Glassmorphic) */}
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 shadow-xl rounded-3xl p-6 md:p-8 mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearchQuery(inputValue);
            }}
            className="flex flex-col md:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search pens, snacks, burgers, or soaps..."
                className="pl-12 pr-10 py-6 text-base rounded-2xl border-slate-200/80 bg-white/50 dark:bg-zinc-950/40 dark:border-zinc-800 focus-visible:ring-indigo-500"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => {
                    setInputValue("");
                    setSearchQuery("");
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              className="py-6 px-8 rounded-2xl text-base font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg hover:shadow-indigo-500/10 hover:scale-[1.01] transition-all"
            >
              Search
            </Button>
          </form>

          {/* Shop Type Pills / Tabs */}
          <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-6">
            <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Departments
            </div>
            <div className="flex flex-wrap gap-2.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id as ShopType | "ALL");
                      // Clear context filters when switching tabs
                      setSelectedBrand(null);
                      setIsVegOnly(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold border transition-all duration-300",
                      isActive
                        ? "bg-slate-900 border-slate-900 text-white dark:bg-indigo-600 dark:border-indigo-600 shadow-md scale-[1.02]"
                        : "bg-slate-50/50 border-slate-200/60 text-slate-600 hover:bg-slate-100 dark:bg-zinc-950/20 dark:border-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contextual Filters */}
          {activeTab === "CANTEEN" && (
            <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-5 mt-5 flex items-center justify-between">
              <div className="flex items-center gap-3 bg-green-50/60 border border-green-200/50 dark:bg-green-950/10 dark:border-green-900/30 px-5 py-3 rounded-2xl">
                <Leaf className="h-4.5 w-4.5 text-green-600 dark:text-green-500 fill-green-600/20" />
                <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                  Vegetarian Only
                </span>
                <Switch
                  checked={isVegOnly}
                  onCheckedChange={setIsVegOnly}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            </div>
          )}

          {activeTab === "STATIONERY" && (
            <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-5 mt-5">
              <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                Filter by Brand
              </div>
              <div className="flex flex-wrap gap-2">
                {STATIONERY_BRANDS.map((brand) => {
                  const isSelected = selectedBrand === brand;
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() =>
                        setSelectedBrand(isSelected ? null : brand)
                      }
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200",
                        isSelected
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-zinc-950/10 dark:border-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      )}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="text-sm font-medium text-slate-500 dark:text-zinc-400">
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                Updating catalog...
              </span>
            ) : results ? (
              <span>
                Found {results.total} {results.total === 1 ? "item" : "items"}
              </span>
            ) : (
              <span>Searching...</span>
            )}
          </div>

          {(searchQuery ||
            activeTab !== "ALL" ||
            isVegOnly ||
            selectedBrand) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
            >
              Clear all filters
            </Button>
          )}
        </div>

        {/* Search Results Grid */}
        {isPending && !results ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="border rounded-2xl bg-card p-4 h-[380px] animate-pulse flex flex-col justify-between"
              >
                <div className="aspect-square bg-slate-200 dark:bg-zinc-800 rounded-xl mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
                  <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : mappedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mappedProducts.map((product, index) => (
              <div
                key={product.id}
                className={cn(
                  "hover:scale-[1.01] transition-transform duration-300 flex flex-col h-full",
                  isPending && "opacity-60"
                )}
              >
                <UserProductCard
                  product={product}
                  index={index}
                  onAddToCart={onAddToCart || (() => {})}
                  onViewDetails={onViewDetails || (() => {})}
                  isAddingToCart={isAddingToCart}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center bg-white/40 dark:bg-zinc-900/20 border border-slate-200/50 dark:border-zinc-800/50 rounded-3xl p-16 max-w-md mx-auto">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-slate-100 dark:bg-zinc-800 mb-5">
              <Layers className="h-8 w-8 text-slate-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6">
              We couldn&apos;t find anything matching your search criteria. Try
              adjusting your filters or clearing search text.
            </p>
            <Button
              onClick={handleReset}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl px-6"
            >
              Reset Search & Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
