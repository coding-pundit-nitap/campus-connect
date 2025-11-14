import { LogOut, Shield, ShieldOff, Trash2 } from "lucide-react";

import { ActionsDropdown } from "./actions-dropdown";

interface UserActionsDropdownProps {
  isAdmin: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onSignOut: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function UserActionsDropdown({
  isAdmin,
  onPromote,
  onDemote,
  onSignOut,
  onDelete,
  disabled = false,
}: UserActionsDropdownProps) {
  const items = [
    isAdmin
      ? {
          id: "demote",
          label: "Remove Admin",
          icons: ShieldOff,
          onClick: onDemote,
        }
      : {
          id: "promote",
          label: "Make Admin",
          icons: Shield,
          onClick: onPromote,
        },
    {
      id: "signout",
      label: "Force Sign Out",
      icons: LogOut,
      onClick: onSignOut,
    },
    {
      id: "delete",
      label: "Delete User",
      icons: Trash2,
      onClick: onDelete,
      className: "text-destructive focus:text-destructive",
    },
  ];
  return <ActionsDropdown items={items} disabled={disabled} />;
}
