"use client";

import { Route } from "next";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

import { useShopCard } from "./shop-card-context";

interface ShopCardActionsProps {
  children?: React.ReactNode;
}

export function ShopCardActions({ children }: ShopCardActionsProps) {
  const { shop } = useShopCard();

  return (
    <CardFooter className="p-0 pt-4 px-4 pb-4">
      {children ? (
        children
      ) : shop.is_active ? (
        <Button className="w-full" asChild>
          <Link href={`/shops/${shop.id}` as Route}>Visit Shop</Link>
        </Button>
      ) : (
        <Button className="w-full" variant="outline" disabled>
          Shop Inactive
        </Button>
      )}
    </CardFooter>
  );
}
