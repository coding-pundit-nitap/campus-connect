import React from "react";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export default function LoadingSpinner({ className = "" }: Props) {
  return (
    <>
      <div
        className={cn(
          "animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 dark:border-gray-900 ",
          className
        )}
      ></div>
    </>
  );
}
