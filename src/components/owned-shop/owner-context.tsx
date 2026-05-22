"use client";

import React, { createContext, ReactNode, useContext } from "react";

import { useShopByUser } from "@/hooks";
import { ShopWithOwner } from "@/types";

interface OwnerContextType {
  shop: ShopWithOwner | null | undefined;
  isLoading: boolean;
  error: Error | null;
}

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export function OwnerProvider({ children }: { children: ReactNode }) {
  const { data: shop, isLoading, error } = useShopByUser();

  return (
    <OwnerContext.Provider value={{ shop, isLoading, error }}>
      {children}
    </OwnerContext.Provider>
  );
}

export function useOwnerContext() {
  const context = useContext(OwnerContext);
  if (context === undefined) {
    throw new Error("useOwnerContext must be used within an OwnerProvider");
  }
  return context;
}
