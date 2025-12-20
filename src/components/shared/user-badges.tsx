import { Role } from "@/../prisma/generated/client";
import { Badge } from "@/components/ui/badge";

interface UserRoleBadgeProps {
  role: Role;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  return (
    <Badge variant={role === "ADMIN" ? "default" : "secondary"}>{role}</Badge>
  );
}
