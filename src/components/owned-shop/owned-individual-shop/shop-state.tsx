import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";

export function ShopLoadingState() {
  return (
    <div className="container mx-auto p-6">
      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">Loading your shop dashboard…</p>
      </div>
    </div>
  );
}

export function ShopErrorState() {
  return (
    <div className="container mx-auto p-6">
      <div className="rounded-lg border p-6">
        <p className="text-destructive">Failed to load shop data.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try refreshing. If it persists, your session may have expired.
        </p>
      </div>
    </div>
  );
}

export function ShopEmptyState() {
  return (
    <div className="container mx-auto p-6">
      <div className="rounded-lg border p-6 space-y-3">
        <div>
          <p className="text-lg font-semibold">No shop linked</p>
          <p className="text-sm text-muted-foreground">
            Create/link your shop to start selling. You can run direct delivery
            or configure batch cards later.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/create-shop">Create / Link shop</Link>
        </Button>
      </div>
    </div>
  );
}
