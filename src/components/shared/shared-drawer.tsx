"use client";
import { X } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

/**
 * Props interface for the SharedDrawer component.
 */
export interface SharedDrawerProps {
  /** Direction from which the drawer slides in */
  direction?: "left" | "right" | "top" | "bottom";
  /** Trigger element - can be icon, text, or custom component */
  trigger?: React.ReactNode;
  /** Icon component for default button trigger */
  icon?: React.ReactNode;
  /** Drawer title */
  title: string;
  /** Optional drawer description */
  description?: string;
  /** Drawer content */
  children: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Custom trigger button variant */
  triggerVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  /** Custom trigger button size */
  triggerSize?: "default" | "sm" | "lg" | "icon";
  /** Additional classes for drawer content */
  contentClassName?: string;
  /** Additional classes for drawer header */
  headerClassName?: string;
  /** Additional classes for trigger button */
  triggerClassName?: string;
  /** Drawer size preset */
  size?: "sm" | "default" | "lg" | "xl" | "full";
  /** Whether to show close button in header */
  showCloseButton?: boolean;
  /** Custom close button */
  closeButton?: React.ReactNode;
  /** Disable the drawer */
  disabled?: boolean;
  /** Loading state */
  isLoading?: boolean;
}

export default function SharedDrawer({
  direction = "right",
  trigger,
  icon,
  title,
  description,
  children,
  footer,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerVariant = "ghost",
  triggerSize = "icon",
  contentClassName = "",
  headerClassName = "",
  triggerClassName = "",
  size = "default",
  showCloseButton = true,
  closeButton,
  disabled = false,
  isLoading = false,
}: SharedDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;

  const getSizeClasses = () => {
    const sizeMap = {
      sm: { width: "max-w-sm", height: "max-h-[50vh]" },
      default: { width: "max-w-md", height: "max-h-[60vh]" },
      lg: { width: "max-w-lg", height: "max-h-[70vh]" },
      xl: { width: "max-w-xl", height: "max-h-[80vh]" },
      full: { width: "max-w-full", height: "max-h-full" },
    };

    const isVertical = direction === "top" || direction === "bottom";
    const { width, height } = sizeMap[size];

    return isVertical ? height : width;
  };

  const getPositionClasses = () => {
    switch (direction) {
      case "left":
        return "ml-0 mr-auto h-full";
      case "right":
        return "ml-auto mr-0 h-full";
      case "top":
        return "mt-0 mb-auto w-full";
      case "bottom":
        return "mt-auto mb-0 w-full";
      default:
        return "ml-auto mr-0 h-full";
    }
  };

  const defaultTrigger = (
    <Button
      variant={triggerVariant}
      size={triggerSize}
      className={`relative ${triggerClassName}`}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
    </Button>
  );

  return (
    <Drawer direction={direction} open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger className="text-foreground" asChild disabled={disabled}>
        {trigger || defaultTrigger}
      </DrawerTrigger>
      <DrawerContent
        className={`
          ${getSizeClasses()} 
          ${getPositionClasses()} 
          ${contentClassName}
        `}
      >
        <DrawerHeader className={`border-b ${headerClassName}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-left">{title}</DrawerTitle>
              {description && (
                <DrawerDescription className="text-left mt-1">
                  {description}
                </DrawerDescription>
              )}
            </div>
            {showCloseButton && (
              <div className="shrink-0">
                {closeButton || (
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close drawer</span>
                    </Button>
                  </DrawerClose>
                )}
              </div>
            )}
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {footer && <DrawerFooter className="border-t">{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  );
}
