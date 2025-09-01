import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BaseStateProps {
  className?: string;
  children?: React.ReactNode;
}

interface StateDisplayProps extends BaseStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?:
      | "default"
      | "outline"
      | "destructive"
      | "secondary"
      | "ghost"
      | "link";
  };
}

// Base state wrapper
export function StateWrapper({ children, className }: BaseStateProps) {
  return (
    <Card className={cn("p-8 text-center", className)}>
      <CardContent>
        <div className="flex flex-col items-center gap-4">{children}</div>
      </CardContent>
    </Card>
  );
}

// Generic state display
export function StateDisplay({
  icon,
  title,
  description,
  action,
  className,
}: StateDisplayProps) {
  return (
    <StateWrapper className={className}>
      {icon && <div className="text-4xl">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="text-muted-foreground">{description}</p>}
      {action && (
        <Button onClick={action.onClick} variant={action.variant || "outline"}>
          {action.label}
        </Button>
      )}
    </StateWrapper>
  );
}
