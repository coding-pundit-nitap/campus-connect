"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";

import { Button } from "../ui/button";

interface QueryErrorFallbackProps {
  error: unknown;
  resetErrorBoundary: () => void;
}

function QueryErrorFallback({
  error,
  resetErrorBoundary,
}: QueryErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-lg font-semibold text-red-800 mb-2">
        Something went wrong
      </h2>
      <p className="text-red-600 text-center mb-4">
        {error instanceof Error
          ? error.message
          : "An unexpected error occurred while loading data."}
      </p>
      <Button variant={"destructive"} onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  );
}

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<QueryErrorFallbackProps>;
}

export function QueryErrorBoundary({
  children,
  fallback,
}: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={fallback || QueryErrorFallback}
          onReset={reset}
          resetKeys={["query-error"]}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
