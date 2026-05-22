"use client";

import { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { useShopCard } from "./shop-card-context";

interface ShopCardImageProps {
  children?: React.ReactNode;
}

export function ShopCardImage({ children }: ShopCardImageProps) {
  const { shop, shopImageUrl, priority } = useShopCard();

  return (
    <div className="relative aspect-4/3 overflow-hidden bg-muted">
      <Link
        href={`/shops/${shop.id}` as Route}
        className="block h-full w-full relative"
      >
        <Image
          fill
          src={shopImageUrl}
          alt={shop.name}
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/35 opacity-90 transition-opacity duration-300 group-hover:opacity-75" />
      </Link>
      {children}
    </div>
  );
}
