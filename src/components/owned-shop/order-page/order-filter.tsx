import { OrderStatus } from "@prisma/client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  selectedStatus?: OrderStatus;
  onStatusChange: (status?: OrderStatus) => void;
};

export default function OrderFilter({ selectedStatus, onStatusChange }: Props) {
  const statuses = Object.values(OrderStatus);

  const handleChange = (value: string) => {
    onStatusChange(value === "ALL" ? undefined : (value as OrderStatus));
  };

  return (
    <div className="w-full md:w-auto">
      <Select value={selectedStatus ?? "ALL"} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          {statuses.map((status) => (
            <SelectItem key={status} value={status} className="capitalize">
              {status.replaceAll(/_/g, " ").toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
