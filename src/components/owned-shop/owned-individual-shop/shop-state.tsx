import { AlertCircle, Loader2, Plus, Store } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";

export function ShopLoadingState() {
  return (
    <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
      <p className="text-lg font-medium text-muted-foreground animate-pulse">
        Loading your shop dashboard...
      </p>
    </div>
  );
}

export function ShopErrorState() {
  return (
    <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 max-w-md text-center space-y-4 shadow-sm">
        <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="text-xl font-bold tracking-tight text-destructive">
            Failed to load shop data
          </p>
          <p className="text-sm text-muted-foreground/80">
            Try refreshing the page. If this persists, your session may have
            expired or you lack permissions.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ShopEmptyState() {
  return (
    <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 p-10 max-w-lg text-center space-y-6">
        <div className="mx-auto bg-background border shadow-sm w-20 h-20 rounded-full flex items-center justify-center">
          <Store className="h-10 w-10 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            No shop linked
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Create or link your shop to start selling. You can run direct
            delivery or configure batch delivery schedules later.
          </p>
        </div>

        <Button asChild className="w-full sm:w-auto shadow-sm gap-2">
          <Link href="/create-shop">
            <Plus className="h-4 w-4" />
            Create / Link Shop
          </Link>
        </Button>
      </div>
    </div>
  );
}
