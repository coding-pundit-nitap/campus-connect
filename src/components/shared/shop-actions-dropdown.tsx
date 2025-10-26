import { SellerVerificationStatus } from "@prisma/client";
import { CheckCircle, Shield, Trash2, XCircle } from "lucide-react";

import { ActionsDropdown } from "@/components/shared/actions-dropdown";

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
  const items = [
    isActive
      ? {
          id: "deactivate",
          label: "Deactivate",
          icon: XCircle,
          onClick: onDeactivate,
          separator: true,
        }
      : {
          id: "activate",
          label: "Activate",
          icon: CheckCircle,
          onClick: onActivate,
          separator: true,
        },
    {
      id: "verification",
      label: "Update Verification",
      icon: Shield,
      items: [
        {
          id: "verified",
          label: "Verified",
          onClick: () =>
            onUpdateVerification(SellerVerificationStatus.VERIFIED),
        },
        {
          id: "pending",
          label: "Pending",
          onClick: () => onUpdateVerification(SellerVerificationStatus.PENDING),
        },
        {
          id: "rejected",
          label: "Rejected",
          onClick: () =>
            onUpdateVerification(SellerVerificationStatus.REJECTED),
        },
        {
          id: "requires-action",
          label: "Requires Action",
          onClick: () =>
            onUpdateVerification(SellerVerificationStatus.REQUIRES_ACTION),
        },
      ],
      separator: true,
    },
    {
      id: "delete",
      label: "Delete Shop",
      icon: Trash2,
      onClick: onDelete,
      destructive: true,
    },
  ];

  return <ActionsDropdown items={items} disabled={disabled} />;
}
