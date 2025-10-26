"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ActionType = "activate" | "deactivate" | "delete" | string;

interface ActionConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ActionType | null;
  itemName: string;
  isLoading?: boolean;
  onConfirm: () => void;
  messages?: {
    [key in ActionType]?: {
      title: string;
      description: string;
    };
  };
  confirmButtonClassName?: string;
}

const defaultMessages: Record<
  ActionType,
  { title: string; description: string }
> = {
  activate: {
    title: "Activate",
    description: "Are you sure you want to activate this item?",
  },
  deactivate: {
    title: "Deactivate",
    description: "Are you sure you want to deactivate this item?",
  },
  delete: {
    title: "Delete",
    description:
      "Are you sure you want to delete this item? This action cannot be undone.",
  },
};

export function ActionConfirmationDialog({
  open,
  onOpenChange,
  action,
  itemName,
  isLoading = false,
  onConfirm,
  messages = {},
  confirmButtonClassName,
}: ActionConfirmationDialogProps) {
  const mergedMessages = { ...defaultMessages, ...messages };
  const currentMessage = action ? mergedMessages[action] : null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{currentMessage?.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {currentMessage?.description.replace("this item", `"${itemName}"`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={confirmButtonClassName}
          >
            {isLoading ? "Processing..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
