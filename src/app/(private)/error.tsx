"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-4 max-w-md w-full">
        <div className="flex justify-center">
          <div className="bg-destructive/10 p-3 rounded-full">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <h1 className="text-3xl font-black font-heading tracking-tight text-foreground">
          Campus Connect
        </h1>
        <h2 className="text-xl font-bold text-foreground mt-4">
          Something went wrong
        </h2>
        <p className="text-sm text-destructive font-medium border border-destructive/20 bg-destructive/5 rounded-md p-3">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="flex flex-col gap-2 mt-6">
          <Button
            onClick={() => reset()}
            className="w-full h-11 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm cursor-pointer transition-transform hover:scale-102 active:scale-98"
          >
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full h-11 rounded-xl font-bold border-border/60 hover:bg-muted/30 cursor-pointer transition-transform hover:scale-102 active:scale-98"
          >
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
