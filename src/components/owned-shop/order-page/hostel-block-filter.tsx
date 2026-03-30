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
  availableBlocks: string[];
};

export default function HostelBlockFilter({
  selectedHostelBlock,
  onHostelBlockChange,
  availableBlocks,
}: Props) {
  const handleChange = (value: string) => {
    onHostelBlockChange(value === "ALL" ? undefined : value);
  };

  return (
    <div className="w-full">
      <Select value={selectedHostelBlock ?? "ALL"} onValueChange={handleChange}>
        <SelectTrigger className="w-full h-9 bg-background border-muted-foreground/30 shadow-sm focus:ring-1 focus:ring-primary">
          <SelectValue placeholder="Filter by hostel block" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">
            <span className="text-muted-foreground">All hostels</span>
          </SelectItem>
          <SelectItem value="UNASSIGNED">
            <span className="text-muted-foreground">Unassigned</span>
          </SelectItem>

          {availableBlocks.map((block) => (
            <SelectItem key={block} value={block}>
              Block {block}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
