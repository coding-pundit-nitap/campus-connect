import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ReviewSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-4 rounded-sm" />
                ))}
              </div>
            </div>

            <Skeleton className="h-3 w-20" />

            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReviewListSkeleton() {
  return (
    <Card className="w-full py-4 mx-auto">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-4 rounded-sm" />
              ))}
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-32 mt-2" />
      </CardHeader>

      <CardContent>
        <div className="space-y-2 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-2 flex-1" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>

        <div className="space-y-6 py-6">
          {[...Array(3)].map((_, i) => (
            <ReviewSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
