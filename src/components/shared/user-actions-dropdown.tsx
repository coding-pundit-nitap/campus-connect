import { Shield, ShieldOff } from "lucide-react";

import { ActionsDropdown } from "./actions-dropdown";

interface UserActionsDropdownProps {
  isAdmin: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onSignOut: () => void;
  disabled?: boolean;
}

export function UserActionsDropdown({
  isAdmin,
  onPromote,
  onDemote,
  onSignOut,
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
      icons: ShieldOff,
      onClick: onSignOut,
    },
  ];
  return <ActionsDropdown items={items} disabled={disabled} />;
}
