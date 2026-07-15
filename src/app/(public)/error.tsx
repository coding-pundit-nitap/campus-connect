"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Campus Connect</h1>
      </div>
      <div className="flex max-w-md flex-col items-center justify-center space-y-4 text-center">
        <h2 className="text-xl font-semibold">Something went wrong!</h2>
        <p className="text-sm text-destructive">{error.message}</p>
        <div className="flex gap-4 pt-4">
          <Button onClick={() => reset()} variant="default">
            Try Again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
