import { MoreVertical, Shield, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserActionsDropdownProps {
  isAdmin: boolean;
  onPromote: () => void;
  onDemote: () => void;
  disabled?: boolean;
}

export function UserActionsDropdown({
  isAdmin,
  onPromote,
  onDemote,
  disabled = false,
}: UserActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isAdmin ? (
          <DropdownMenuItem onClick={onDemote}>
            <ShieldOff className="mr-2 h-4 w-4" />
            Remove Admin
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onPromote}>
            <Shield className="mr-2 h-4 w-4" />
            Make Admin
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
