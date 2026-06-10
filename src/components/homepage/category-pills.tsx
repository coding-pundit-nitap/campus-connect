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
    <div className="relative w-full h-16 min-h-[64px] flex items-center mb-6">
      <div className="w-full flex items-center overflow-x-auto scrollbar-none snap-x snap-mandatory gap-3 py-2 px-4 md:px-1">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-10 w-24 rounded-xl bg-muted/65 animate-pulse shrink-0 snap-start border border-muted"
            />
          ))
        ) : isError ? (
          <div className="flex items-center gap-2 px-4 text-xs font-bold text-red-500">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span>Error loading categories</span>
          </div>
        ) : (
          <>
            <button
              onClick={() => onChange(null)}
              className={cn(
                "h-10 px-5 rounded-xl text-[11px] font-heading font-black uppercase tracking-wider shrink-0 snap-start transition-all duration-200 active:scale-95 flex items-center justify-center border-2 cursor-pointer",
                selectedId === null
                  ? "bg-primary text-primary-foreground border-primary shadow-[3px_3px_0px_0px_#F97316] scale-[1.01]"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:-translate-y-[1px]"
              )}
            >
              All Categories
            </button>

            {categories.map((category) => {
              const isActive = selectedId === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => onChange(category.id)}
                  className={cn(
                    "h-10 px-5 rounded-xl text-[11px] font-heading font-black uppercase tracking-wider shrink-0 snap-start transition-all duration-200 active:scale-95 flex items-center justify-center border-2 capitalize cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-[3px_3px_0px_0px_#F97316] scale-[1.01]"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:-translate-y-[1px]"
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
