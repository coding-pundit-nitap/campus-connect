import { SharedSearchInput } from "@/components/shared/shared-search-input";
import { Button } from "@/components/ui/button";

interface UserFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
}

export function UserFilterBar({
  search,
  onSearchChange,
  onSearch,
  onClearSearch,
}: UserFilterBarProps) {
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <SharedSearchInput
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          showIcon
          showClear
          onClear={onClearSearch}
        />
      </div>
      <Button onClick={onSearch}>Search</Button>
    </div>
  );
}
