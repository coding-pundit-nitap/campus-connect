"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const VendorCommandCenterDynamic = dynamic(
  () => import("./index").then((mod) => mod.VendorCommandCenter),
  {
    ssr: false,
    loading: () => (
      <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </main>
    ),
  }
);
