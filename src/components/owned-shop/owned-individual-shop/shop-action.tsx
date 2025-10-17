import Link from "next/link";
import { useSession } from "next-auth/react";
import React from "react";

import { Button } from "@/components/ui/button";

export default function ShopAction() {
  const { data: session } = useSession();

  if (session?.user.shop_id) {
    return undefined;
  }

  return (
    <div className="flex flex-row justify-end">
      <Link href="/create-shop">
        <Button
          className="mb-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
          variant="outline"
        >
          + Link Shop
        </Button>
      </Link>
    </div>
  );
}
