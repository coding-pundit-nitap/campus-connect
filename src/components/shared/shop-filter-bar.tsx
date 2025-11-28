import { SharedSearchInput } from "@/components/shared/shared-search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SellerVerificationStatus } from "@/types/prisma.types";

interface ShopFilterBarProps {
  search: string;
  statusFilter: string;
  verificationFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onVerificationChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
}

export function ShopFilterBar({
  search,
  statusFilter,
  verificationFilter,
  onSearchChange,
  onStatusChange,
  onVerificationChange,
  onSearch,
  onClearSearch,
}: ShopFilterBarProps) {
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <SharedSearchInput
          placeholder="Search by shop name or location..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          showIcon
          showClear
          onClear={onClearSearch}
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="true">Active</SelectItem>
          <SelectItem value="false">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <Select value={verificationFilter} onValueChange={onVerificationChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Verification" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Verification</SelectItem>
          <SelectItem value={SellerVerificationStatus.VERIFIED}>
            Verified
          </SelectItem>
          <SelectItem value={SellerVerificationStatus.PENDING}>
            Pending
          </SelectItem>
          <SelectItem value={SellerVerificationStatus.REJECTED}>
            Rejected
          </SelectItem>
          <SelectItem value={SellerVerificationStatus.REQUIRES_ACTION}>
            Requires Action
          </SelectItem>
          <SelectItem value={SellerVerificationStatus.NOT_STARTED}>
            Not Started
          </SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={onSearch}>Search</Button>
    </div>
  );
}
