import {
  BadgeCheck,
  Clock,
  Hourglass,
  LucideIcon,
  ShieldAlert,
  ShieldX,
} from "lucide-react";

import { SellerVerificationStatus } from "@/types/prisma.types";

interface StatusInfo {
  label: string;
  Icon: LucideIcon;
  colorClassName: string;
  bgClassName: string;
}

export const getVerificationStatusInfo = (
  status: SellerVerificationStatus
): StatusInfo => {
  const info: Record<SellerVerificationStatus, StatusInfo> = {
    VERIFIED: {
      label: "Verified",
      Icon: BadgeCheck,
      colorClassName: "text-green-600",
      bgClassName: "bg-green-500",
    },
    PENDING: {
      label: "Pending Review",
      Icon: Hourglass,
      colorClassName: "text-blue-600",
      bgClassName: "bg-blue-500",
    },
    REQUIRES_ACTION: {
      label: "Action Required",
      Icon: ShieldAlert,
      colorClassName: "text-orange-600",
      bgClassName: "bg-orange-500",
    },
    REJECTED: {
      label: "Rejected",
      Icon: ShieldX,
      colorClassName: "text-red-600",
      bgClassName: "bg-red-500",
    },
    NOT_STARTED: {
      label: "Not Started",
      Icon: Clock,
      colorClassName: "text-yellow-600",
      bgClassName: "bg-yellow-500",
    },
  };
  return info[status];
};
