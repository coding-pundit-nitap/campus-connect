import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";

export default function ShopAction() {
  return (
    <div className="flex flex-row justify-end">
      <Button
        asChild
        variant="outline"
        className="mb-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
      >
        <Link href={"/shops/link"}>+ Link Shop</Link>
      </Button>
    </div>
  );
}
