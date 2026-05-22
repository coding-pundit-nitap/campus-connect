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
    <div className="flex flex-1 flex-col p-5 bg-card/50 backdrop-blur-xs">
      <CardHeader className="p-0 pb-3.5 space-y-1">
        <CardTitle className="line-clamp-1 text-lg font-extrabold tracking-tight">
          <Link
            href={`/shops/${shop.id}` as Route}
            className="text-foreground transition-colors duration-300 hover:text-indigo-600 dark:hover:text-indigo-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400"
          >
            {shop.name}
          </Link>
        </CardTitle>
        <CardDescription
          dangerouslySetInnerHTML={{
            __html: descriptionHtml,
          }}
          className="line-clamp-2 text-xs leading-relaxed text-muted-foreground mt-1 min-h-[32px] prose prose-sm dark:prose-invert max-w-none"
        />
      </CardHeader>

      <CardContent className="flex-1 space-y-2.5 p-0 pt-2 border-t border-muted/65">
        <div className="flex items-center text-xs text-muted-foreground font-medium transition-colors duration-300 hover:text-foreground">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/25 dark:text-indigo-400 mr-2.5 shrink-0">
            <MapPin className="h-3.5 w-3.5" />
          </div>
          <span className="line-clamp-1">{shop.location}</span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground font-medium transition-colors duration-300 hover:text-foreground">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 dark:bg-amber-500/25 dark:text-amber-400 mr-2.5 shrink-0">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <span>
            {shop.openingFormatted} - {shop.closingFormatted}
          </span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground font-medium transition-colors duration-300 hover:text-foreground">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 dark:bg-rose-500/25 dark:text-rose-400 mr-2.5 shrink-0">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="line-clamp-1 font-semibold">
            By {shop.user ? shop.user.name : "Campus Partner"}
          </span>
        </div>
      </CardContent>
    </div>
  );
}
