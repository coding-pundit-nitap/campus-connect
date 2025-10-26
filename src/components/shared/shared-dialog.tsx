import React, { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

export interface DialogAction {
  label: string;
  onClick?: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
  closeOnClick?: boolean;
}

export interface SharedDialogProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: DialogAction[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  showCloseButton?: boolean;
}

export default function SharedDialog({
  trigger,
  title,
  description,
  children,
  actions = [],
  open,
  onOpenChange,
  className,
  showCloseButton = true,
}: SharedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          "overflow-y-auto hide-scrollbar max-h-screen sm:max-w-lg",
          className
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-4">{children}</div>

        {(actions.length > 0 || showCloseButton) && (
          <DialogFooter className="flex flex-row justify-end gap-2">
            {actions.map((action, index) => {
              const ButtonComponent =
                action.closeOnClick !== false ? DialogClose : "div";

              return (
                <ButtonComponent
                  key={index}
                  asChild={action.closeOnClick !== false}
                >
                  <Button
                    variant={action.variant || "default"}
                    onClick={action.onClick}
                    className={action.className}
                  >
                    {action.label}
                  </Button>
                </ButtonComponent>
              );
            })}

            {showCloseButton && actions.length === 0 && (
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
