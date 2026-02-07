import { Badge } from "@/components/ui/badge";
import { Role } from "@/generated/client";

interface UserRoleBadgeProps {
  role: Role;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  return (
    <Badge variant={role === "ADMIN" ? "default" : "secondary"}>{role}</Badge>
  );
}
