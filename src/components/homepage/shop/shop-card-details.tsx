"use client";

import { Clock, MapPin, User } from "lucide-react";
import { Route } from "next";
import Link from "next/link";
import React from "react";

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useShopCard } from "./shop-card-context";

export function ShopCardDetails() {
  const { shop, descriptionHtml } = useShopCard();

  return (
    <div className="flex flex-1 flex-col p-4">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="mb-1 line-clamp-2 text-xl font-bold">
          <Link
            href={`/shops/${shop.id}` as Route}
            className="transition-colors group-hover:text-primary hover:text-primary"
          >
            {shop.name}
          </Link>
        </CardTitle>
        <CardDescription
          dangerouslySetInnerHTML={{
            __html: descriptionHtml,
          }}
          className="mt-1 prose prose-sm dark:prose-invert max-w-none"
        />
      </CardHeader>

      <CardContent className="flex-1 space-y-3 p-0">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-2 h-4 w-4 text-primary" />
          <span className="line-clamp-1">{shop.location}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-2 h-4 w-4 text-primary" />
          <span>
            {shop.openingFormatted} - {shop.closingFormatted}
          </span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <User className="mr-2 h-4 w-4 text-primary" />
          <span className="line-clamp-1">
            By {shop.user ? shop.user.name : "Unknown"}
          </span>
        </div>
      </CardContent>
    </div>
  );
}
