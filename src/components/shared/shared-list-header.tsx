import React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ListHeaderProps {
  className?: string;
  countMessage?: string;
  displayCount?: number;
  totalCount?: number;
  customCountMessage?: string;

  showAction?: boolean;
  actionLabel?: string;
  onActionClick?: () => void;
  actionVariant?: "default" | "outline" | "secondary" | "ghost" | "link";

  children?: React.ReactNode;
}

export function ListHeader({
  className,
  countMessage,
  displayCount,
  totalCount,
  customCountMessage,
  showAction = false,
  actionLabel = "Action",
  onActionClick,
  actionVariant = "outline",
  children,
}: ListHeaderProps) {
  const message =
    customCountMessage ||
    countMessage ||
    (displayCount !== undefined && totalCount !== undefined
      ? `Showing ${displayCount} of ${totalCount} items`
      : undefined);

  return (
    <div
      className={cn(
        "flex items-center justify-between text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {message && <span>{message}</span>}
        {children}
      </div>

      {showAction && onActionClick && (
        <Button variant={actionVariant} size="sm" onClick={onActionClick}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
