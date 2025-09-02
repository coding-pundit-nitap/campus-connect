import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
}

/**
 * Reusable card component that provides a consistent layout structure for content.
 *
 * This component serves as a standardized wrapper for content that needs to be
 * displayed in a card format throughout the application. It provides flexible
 * header and footer sections with optional custom content, while maintaining
 * consistent styling and layout patterns. The component is built on top of the
 * base Card components and includes proper spacing, shadows, and responsive
 * design considerations.
 *
 * @param props - The component props
 * @param props.title - The main title displayed in the card header
 * @param props.description - Optional description text shown below the title
 * @param props.showHeader - Whether to display the header section
 * @param props.showFooter - Whether to display the footer section
 * @param props.className - Additional CSS classes for customization
 * @param props.children - The main content rendered in the card body
 * @param props.headerClassName - Additional CSS classes for the header section
 * @param props.headerContent - Optional custom content for the header
 * @param props.footerContent - Optional custom content for the footer
 *
 * @returns A JSX element containing the card with configured header, content, and footer
 *
 */
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
}: SharedCardProps) {
  return (
    <Card className={`border-none shadow-xl ${className}`}>
      {showHeader && (
        <CardHeader className={cn("pb-4", headerClassName)}>
          {title && (
            <CardTitle className="text-center text-2xl font-semibold">
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

      <CardContent className="space-y-6">{children}</CardContent>

      {showFooter && (
        <CardFooter className="flex flex-col items-center space-y-2 pt-0">
          {footerContent}
        </CardFooter>
      )}
    </Card>
  );
}
