import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { CardConfig } from "@/types";

/**
 * Configuration properties for the SharedCard component.
 *
 * Extends the base CardConfig interface with additional props specific to the
 * SharedCard component for rendering custom content in header and footer sections.
 *
 * @interface SharedCardProps
 * @extends CardConfig
 */
interface SharedCardProps extends CardConfig {
  /**
   * The main content to be rendered inside the card body.
   * This is the primary content area of the card component.
   */
  children: React.ReactNode;

  /**
   * Optional custom content to be rendered in the card header section.
   * Appears below the title and description when showHeader is true.
   */
  headerContent?: React.ReactNode;

  /**
   * Optional custom class names to be applied to the card header section.
   */
  headerClassName?: string;

  /**
   * Optional custom content to be rendered in the card footer section.
   * Only displayed when showFooter is true.
   */
  footerContent?: React.ReactNode;
  /**
   * Optional custom class names to be applied to the card content section.
   */
  contentClassName?: string;
  /**
   * Optional custom class names to be applied to the card title section.
   */
  titleClassName?: string;
}

export function SharedCard({
  title,
  description,
  showHeader = true,
  showFooter = false,
  className = "",
  children,
  headerContent,
  headerClassName,
  footerContent,
  contentClassName = "space-y-6",
  titleClassName,
}: SharedCardProps) {
  return (
    <Card className={`border-none shadow-xl ${className}`}>
      {showHeader && (
        <CardHeader className={cn("py-4", headerClassName)}>
          {title && (
            <CardTitle
              className={cn(
                "text-center text-2xl font-semibold",
                titleClassName
              )}
            >
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-center text-sm text-gray-500">
              {description}
            </CardDescription>
          )}
          {headerContent}
        </CardHeader>
      )}

      <CardContent className={contentClassName}>{children}</CardContent>

      {showFooter && (
        <CardFooter className="flex flex-col items-center space-y-2 pt-0">
          {footerContent}
        </CardFooter>
      )}
    </Card>
  );
}
