import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CardConfig } from "@/types/ui";

interface SharedCardProps extends CardConfig {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

export function SharedCard({
  title,
  description,
  showHeader = true,
  showFooter = false,
  className = "",
  children,
  headerContent,
  footerContent,
}: SharedCardProps) {
  return (
    <Card className={`border-none shadow-xl ${className}`}>
      {showHeader && (
        <CardHeader className="pb-4">
          <CardTitle className="text-center text-2xl font-semibold">
            {title}
          </CardTitle>
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
