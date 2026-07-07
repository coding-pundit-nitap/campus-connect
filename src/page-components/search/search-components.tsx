"use client";

import {
  BookOpen,
  Layers,
  Loader2,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  X,
} from "lucide-react";

import { UserProductCard } from "@/components/shared/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

import { useSearchContext } from "./search-context";

export const tabs = [
  { id: "ALL", label: "All Items", icon: Layers },
  { id: "CANTEEN", label: "Canteens", icon: Store },
  { id: "STATIONERY", label: "Stationery", icon: BookOpen },
  { id: "GROCERY", label: "Groceries", icon: ShoppingBag },
] as const;

export function SearchFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/40 via-slate-50 to-indigo-50/30 dark:from-zinc-950 dark:via-zinc-900/95 dark:to-zinc-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  );
}

export function SearchHero() {
  return (
    <div className="text-center mb-10 mt-4">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
        What are you looking for today?
      </h1>
      <p className="mt-3 text-lg text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto">
        Search snacks, textbooks, pens, or drinks across all campus shops with
        instant global filters.
      </p>
    </div>
  );
}

export function SearchInputForm() {
  const {
    state: { inputValue },
    actions: { setInputValue, pushParams },
  } = useSearchContext();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        pushParams({ q: inputValue });
      }}
      className="flex flex-col md:flex-row gap-4 mb-6"
    >
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            pushParams({ q: e.target.value });
          }}
          placeholder="Search pens, snacks, burgers, or soaps..."
          className="pl-12 pr-10 py-6 text-base rounded-2xl border-slate-200/80 bg-white/50 dark:bg-zinc-950/40 dark:border-zinc-800 focus-visible:ring-violet-500"
        />
        {inputValue ? (
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              pushParams({ q: "" });
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <Button
        type="submit"
        className="py-6 px-8 rounded-2xl text-base font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-violet-500/20 hover:scale-[1.01] transition-all cursor-pointer"
      >
        Search
      </Button>
    </form>
  );
}

export function SearchDepartments() {
  const {
    state: { activeTab },
    actions: { handleTabChange },
  } = useSearchContext();

  return (
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
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold border transition-all duration-300 cursor-pointer",
                isActive
                  ? "bg-slate-900 border-slate-900 text-white dark:bg-violet-600 dark:border-violet-600 shadow-md scale-[1.02]"
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
  );
}

export function SearchStatusBar() {
  const {
    state: { mounted, isPending, totalResults, hasActiveFilters },
    actions: { handleReset },
  } = useSearchContext();

  return (
    <div className="flex items-center justify-between mb-6 px-1">
      <div
        className="text-sm font-medium text-slate-500 dark:text-zinc-400"
        suppressHydrationWarning
      >
        {!mounted ? (
          <span>Browsing campus catalog...</span>
        ) : isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
            Updating catalog...
          </span>
        ) : totalResults !== undefined ? (
          <span>
            Found {totalResults} {totalResults === 1 ? "item" : "items"}
          </span>
        ) : (
          <span>Browsing campus catalog...</span>
        )}
      </div>

      {hasActiveFilters ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-xs font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30 cursor-pointer"
        >
          Clear all filters
        </Button>
      ) : null}
    </div>
  );
}

export function SearchResults() {
  const {
    state: { mounted, isPending, mappedProducts, isAddingToCart },
    actions: { handleReset, onAddToCart, onViewDetails },
  } = useSearchContext();

  const showSkeletons = mounted && isPending && mappedProducts.length === 0;
  const showGrid = mounted && mappedProducts.length > 0;

  if (showSkeletons) {
    return (
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
    );
  }

  if (showGrid) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mappedProducts.map((product, index) => (
          <div
            key={product.id}
            className={cn(
              "hover:scale-[1.01] transition-transform duration-300 flex flex-col h-full cursor-pointer",
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
    );
  }

  return (
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
        className="bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-2xl px-6 cursor-pointer"
      >
        Reset Search &amp; Filters
      </Button>
    </div>
  );
}
