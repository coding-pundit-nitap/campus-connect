import { Trash2 } from "lucide-react";

import { ActionsDropdown } from "./actions-dropdown";

interface ProductActionsDropdownProps {
  onDelete: () => void;
  disabled?: boolean;
}

export function ProductActionsDropdown({
  onDelete,
  disabled = false,
}: ProductActionsDropdownProps) {
  const items = [
    {
      id: "delete",
      label: "Delete Product",
      icons: Trash2,
      onClick: onDelete,
      className: "text-destructive focus:text-destructive",
    },
  ];
  return <ActionsDropdown items={items} disabled={disabled} />;
}
