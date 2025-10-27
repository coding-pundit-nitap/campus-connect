import { Crown, Mail, User as UserIcon } from "lucide-react";

import { User } from "@/auth";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  user: User;
};

export default function UserDetail({ user }: Props) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Crown className="h-3 w-3" />;
      default:
        return <UserIcon className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      default:
        return "secondary";
    }
  };
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="truncate">
              <p className="text-sm font-medium truncate">
                {user.name || "User"}
              </p>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant={getRoleBadgeVariant(user.role)} className="h-5">
                {getRoleIcon(user.role)}
                <span className="ml-1 text-xs">{user.role}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.role}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {user.email && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="truncate flex items-center space-x-1 mt-1">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.email}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
