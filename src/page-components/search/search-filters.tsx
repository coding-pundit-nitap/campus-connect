"use client";

import { Leaf } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";

import { useSearchContext } from "./search-context";

export function CanteenFilters() {
  const {
    state: { isVegOnly },
    actions: { pushParams },
  } = useSearchContext();

  return (
    <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-5 mt-5 flex items-center justify-between">
      <div className="flex items-center gap-3 bg-green-50/60 border border-green-200/50 dark:bg-green-950/10 dark:border-green-900/30 px-5 py-3 rounded-2xl">
        <Leaf className="h-4 w-4 text-green-600 dark:text-green-500" />
        <span className="text-sm font-semibold text-green-800 dark:text-green-300">
          Vegetarian Only
        </span>
        <Switch
          checked={isVegOnly}
          onCheckedChange={(checked) => pushParams({ veg: checked || null })}
          className="data-[state=checked]:bg-green-600 cursor-pointer"
        />
      </div>
    </div>
  );
}

export function StationeryFilters() {
  const {
    state: { brands, selectedBrand },
    actions: { pushParams },
  } = useSearchContext();

  return (
    <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-5 mt-5">
      <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
        Filter by Brand
      </div>
      <div className="flex flex-wrap gap-2">
        {brands?.map((brand) => {
          const isSelected = selectedBrand === brand.id;
          return (
            <button
              key={brand.id}
              type="button"
              onClick={() =>
                pushParams({ brand: isSelected ? null : brand.id })
              }
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer",
                isSelected
                  ? "bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950/40 dark:border-violet-800 dark:text-violet-300"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-zinc-950/10 dark:border-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {brand.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GroceryFilters() {
  return (
    <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-5 mt-5">
      <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
        Grocery Filters
      </div>
      <div className="text-sm text-slate-500 dark:text-zinc-400">
        No specialized grocery filters yet.
      </div>
    </div>
  );
}

export function SearchDynamicFilters() {
  const {
    state: { activeTab },
  } = useSearchContext();

  switch (activeTab) {
    case "CANTEEN":
      return <CanteenFilters />;
    case "STATIONERY":
      return <StationeryFilters />;
    case "GROCERY":
      return <GroceryFilters />;
    default:
      return null;
  }
}
