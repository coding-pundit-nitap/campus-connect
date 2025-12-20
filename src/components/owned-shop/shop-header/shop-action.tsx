"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ShopAction() {
  return (
    <div className="flex flex-row gap-2 justify-end">
      <Link href={"/owner-shops/products/new"}>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </Link>
    </div>
  );
}
