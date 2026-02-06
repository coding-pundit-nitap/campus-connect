"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  selectedHostelBlock?: string;
  onHostelBlockChange: (hostelBlock?: string) => void;
};

export default function HostelBlockFilter({
  selectedHostelBlock,
  onHostelBlockChange,
}: Props) {
  const handleChange = (value: string) => {
    onHostelBlockChange(value === "ALL" ? undefined : value);
  };

  return (
    <div className="w-full">
      <Select value={selectedHostelBlock ?? "ALL"} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filter by hostel block" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">
            <span className="text-muted-foreground">All hostels</span>
          </SelectItem>
          <SelectItem value="UNASSIGNED">
            <span className="text-muted-foreground">Unassigned</span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
