import { Minus, Plus } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import LoadingSpinner from "./shared-loading-spinner";

type Props = {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  isLoading: boolean;
  size?: "default" | "sm";
};

export default function SharedQuantityControl({
  onDecrease,
  onIncrease,
  quantity,
  isLoading,
  size = "default",
}: Props) {
  const buttonSize = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        className={`${buttonSize} bg-transparent`}
        onClick={onDecrease}
        disabled={quantity <= 1 || isLoading}
      >
        {isLoading ? (
          <LoadingSpinner
            className={cn("dark:border-white border-gray-900", iconSize)}
          />
        ) : (
          <Minus className={iconSize} />
        )}
      </Button>
      <span
        className={`text-center font-medium ${size === "sm" ? "w-6 text-xs" : "w-8 text-sm"}`}
      >
        {quantity}
      </span>
      <Button
        variant="outline"
        size="icon"
        className={`${buttonSize} bg-transparent`}
        onClick={onIncrease}
        disabled={isLoading}
      >
        {isLoading ? (
          <LoadingSpinner
            className={cn("dark:border-white border-gray-900", iconSize)}
          />
        ) : (
          <Plus className={iconSize} />
        )}
      </Button>
    </div>
  );
}
