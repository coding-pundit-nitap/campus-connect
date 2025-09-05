import { Minus, Plus } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";

import LoadingSpinner from "./shared-loading-spinner";

type Props = {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  isLoading: boolean;
};

export default function SharedQuantityControl({
  onDecrease,
  onIncrease,
  quantity,
  isLoading,
}: Props) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-transparent"
        onClick={onDecrease}
        disabled={quantity <= 1 || isLoading}
      >
        {isLoading ? (
          <LoadingSpinner className="dark:border-white border-gray-900" />
        ) : (
          <Minus className="h-3 w-3" />
        )}
      </Button>
      <span className="w-8 text-center text-sm font-medium">{quantity}</span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-transparent"
        onClick={onIncrease}
        disabled={isLoading}
      >
        {isLoading ? (
          <LoadingSpinner className="dark:border-white border-gray-900" />
        ) : (
          <Plus className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
