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
    <CardFooter className="p-0 pt-2 px-5 pb-5 bg-card/50">
      {children ? (
        children
      ) : shop.is_active ? (
        <Button
          className="w-full font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-98 transition-all duration-300 cursor-pointer rounded-lg border-none"
          asChild
        >
          <Link href={`/shops/${shop.id}` as Route}>Visit Shop</Link>
        </Button>
      ) : (
        <Button className="w-full rounded-lg" variant="outline" disabled>
          Shop Inactive
        </Button>
      )}
    </CardFooter>
  );
}
