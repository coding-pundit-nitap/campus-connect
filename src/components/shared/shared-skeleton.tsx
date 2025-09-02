import React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SharedSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className }: SharedSkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="aspect-square">
        <Skeleton className="w-full h-full rounded-t-lg" />
      </div>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-3" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
