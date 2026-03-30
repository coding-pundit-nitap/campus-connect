"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ShopAction() {
  return (
    <Button asChild className="gap-2 shadow-sm transition-all hover:shadow-md">
      <Link href="/owner-shops/products/new">
        <Plus className="h-4 w-4" />
        <span className="font-medium">Add Product</span>
      </Link>
    </Button>
  );
}
