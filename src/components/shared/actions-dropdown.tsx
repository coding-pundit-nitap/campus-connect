"use client";

import { LucideIcon, MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ActionItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
  separator?: boolean;
}

export interface ActionSubMenu {
  id: string;
  label: string;
  icon?: LucideIcon;
  items: Array<{
    id: string;
    label: string;
    onClick: () => void;
    destructive?: boolean;
  }>;
  separator?: boolean;
}

export type ActionMenuItemType = ActionItem | ActionSubMenu;

interface ActionsDropdownProps {
  items: ActionMenuItemType[];
  disabled?: boolean;
  triggerClassName?: string;
  contentAlign?: "start" | "center" | "end";
}

function isSubMenu(item: ActionMenuItemType): item is ActionSubMenu {
  return "items" in item;
}

export function ActionsDropdown({
  items,
  disabled = false,
  triggerClassName,
  contentAlign = "end",
}: ActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={triggerClassName}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={contentAlign}>
        {items.map((item, index) => (
          <div key={item.id}>
            {isSubMenu(item) ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  {item.label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {item.items.map((subItem) => (
                    <DropdownMenuItem
                      key={subItem.id}
                      onClick={subItem.onClick}
                      className={subItem.destructive ? "text-destructive" : ""}
                    >
                      {subItem.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : (
              <DropdownMenuItem
                onClick={item.onClick}
                className={item.destructive ? "text-destructive" : ""}
              >
                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                {item.label}
              </DropdownMenuItem>
            )}
            {item.separator && index < items.length - 1 && (
              <DropdownMenuSeparator />
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
