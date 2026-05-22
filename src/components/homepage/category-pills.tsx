"use client";

import React from "react";

import { useActiveCategories } from "@/hooks/queries/useProductCategoriesSearch";
import { cn } from "@/lib/cn";

type Props = {
  selectedId: string | null;
  onChange: (id: string | null) => void;
};

export default function CategoryPills({ selectedId, onChange }: Props) {
  const { data: categories = [], isLoading, isError } = useActiveCategories();

  return (
    <div className="relative w-full h-14 min-h-[56px] flex items-center mb-6">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none hidden md:block" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none hidden md:block" />

      <div className="w-full flex items-center overflow-x-auto scrollbar-none snap-x snap-mandatory gap-2.5 py-1 px-4 md:px-1">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-9 w-20 md:w-24 rounded-full bg-muted/65 animate-pulse shrink-0 snap-start"
            />
          ))
        ) : isError ? (
          <div className="flex items-center gap-2 px-4 text-xs text-red-500">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>Error loading categories</span>
          </div>
        ) : (
          <>
            <button
              onClick={() => onChange(null)}
              className={cn(
                "h-9 px-5 rounded-full text-xs font-semibold shrink-0 snap-start transition-all duration-300 active:scale-95 flex items-center justify-center border",
                selectedId === null
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02] font-bold"
                  : "bg-card/45 backdrop-blur-sm border-muted/80 text-muted-foreground hover:text-foreground hover:bg-card hover:border-muted-foreground/30 shadow-sm"
              )}
            >
              All
            </button>

            {categories.map((category) => {
              const isActive = selectedId === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => onChange(category.id)}
                  className={cn(
                    "h-9 px-5 rounded-full text-xs font-semibold shrink-0 snap-start transition-all duration-300 active:scale-95 flex items-center justify-center border capitalize",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02] font-bold"
                      : "bg-card/45 backdrop-blur-sm border-muted/80 text-muted-foreground hover:text-foreground hover:bg-card hover:border-muted-foreground/30 shadow-sm"
                  )}
                >
                  {category.title}
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
