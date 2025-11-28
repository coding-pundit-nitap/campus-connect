import { Badge } from "@/components/ui/badge";
import { SellerVerificationStatus } from "@/types/prisma.types";

interface ShopStatusBadgeProps {
  isActive: boolean;
}

export function ShopStatusBadge({ isActive }: ShopStatusBadgeProps) {
  return (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

interface VerificationBadgeProps {
  status: SellerVerificationStatus;
}

export function VerificationBadge({ status }: VerificationBadgeProps) {
  const variants: Record<
    SellerVerificationStatus,
    "default" | "outline" | "secondary" | "destructive" | null | undefined
  > = {
    NOT_STARTED: "secondary",
    PENDING: "outline",
    REQUIRES_ACTION: "destructive",
    VERIFIED: "default",
    REJECTED: "destructive",
  };

  return <Badge variant={variants[status]}>{status.replace(/_/g, " ")}</Badge>;
}
