import {
  CheckCircle2,
  CircleDot,
  CookingPot,
  Package,
  XCircle,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { OrderStatus } from "@/types/prisma.types";

type Props = {
  selectedStatus?: OrderStatus;
  onStatusChange: (status?: OrderStatus) => void;
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: typeof CircleDot; color: string }
> = {
  NEW: { label: "New", icon: CircleDot, color: "text-blue-500" },
  PREPARING: { label: "Preparing", icon: CookingPot, color: "text-orange-500" },
  READY_FOR_PICKUP: {
    label: "Ready for Pickup",
    icon: Package,
    color: "text-yellow-600",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    icon: Package,
    color: "text-purple-500",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-500",
  },
  CANCELLED: { label: "Cancelled", icon: XCircle, color: "text-red-500" },
};

export default function OrderFilter({ selectedStatus, onStatusChange }: Props) {
  const handleChange = (value: string) => {
    onStatusChange(value === "ALL" ? undefined : (value as OrderStatus));
  };

  return (
    <div className="w-full">
      <Select value={selectedStatus ?? "ALL"} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">
            <span className="text-muted-foreground">All Statuses</span>
          </SelectItem>
          {Object.entries(STATUS_CONFIG).map(
            ([status, { label, icon: Icon, color }]) => (
              <SelectItem key={status} value={status}>
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", color)} />
                  <span>{label}</span>
                </div>
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
