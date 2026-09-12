"use client";

import { Pencil } from "lucide-react";
import React, { useState } from "react";

import { Input } from "@/components/ui/input";
import { useUpdateProductPrice } from "@/hooks/queries/useShopProducts";

interface InlinePriceEditProps {
  productId: string;
  price: number;
}

export function InlinePriceEdit({ productId, price }: InlinePriceEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(String(price));
  const updatePrice = useUpdateProductPrice();

  const commit = () => {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed !== price) {
      updatePrice.mutate({ productId, price: parsed });
    } else {
      setValue(String(price));
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Input
        type="number"
        min={0}
        autoFocus
        className="h-9 w-28 rounded-lg text-sm font-bold"
        value={value}
        disabled={updatePrice.isPending}
        onChange={(e) => setValue(e.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setValue(String(price));
            setIsEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(String(price));
        setIsEditing(true);
      }}
      className="flex items-center gap-1.5 rounded-lg border border-transparent px-2 py-1 text-sm font-bold text-foreground hover:border-border/60 hover:bg-muted/40"
    >
      ₹{price}
      <Pencil className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}
