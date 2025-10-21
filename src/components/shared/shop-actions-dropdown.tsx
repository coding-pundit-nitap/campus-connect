import { SellerVerificationStatus } from "@prisma/client";
import {
  CheckCircle,
  MoreVertical,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";

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

interface ShopActionsDropdownProps {
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onUpdateVerification: (status: SellerVerificationStatus) => void;
  disabled?: boolean;
}

export function ShopActionsDropdown({
  isActive,
  onActivate,
  onDeactivate,
  onDelete,
  onUpdateVerification,
  disabled = false,
}: ShopActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isActive ? (
          <DropdownMenuItem onClick={onDeactivate}>
            <XCircle className="mr-2 h-4 w-4" />
            Deactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onActivate}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Activate
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Shield className="mr-2 h-4 w-4" />
            Update Verification
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() =>
                onUpdateVerification(SellerVerificationStatus.VERIFIED)
              }
            >
              Verified
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                onUpdateVerification(SellerVerificationStatus.PENDING)
              }
            >
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                onUpdateVerification(SellerVerificationStatus.REJECTED)
              }
            >
              Rejected
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                onUpdateVerification(SellerVerificationStatus.REQUIRES_ACTION)
              }
            >
              Requires Action
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Shop
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
