"use client";

import { CreditCard } from "lucide-react";
import { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PayoutEntry } from "@/actions/admin/payout-actions";
import { ClientDate } from "@/components/shared/client-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUpdatePayoutStatus } from "@/hooks";
import { PayoutStatus } from "@/types/prisma.types";
import { CursorPaginatedResponse } from "@/types/response.types";

const STATUS_CONFIG: Record<
  PayoutStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PENDING: { label: "Pending", variant: "outline" },
  IN_TRANSIT: { label: "In Transit", variant: "secondary" },
  PAID: { label: "Paid", variant: "default" },
  FAILED: { label: "Failed", variant: "destructive" },
};

interface PayoutsTableProps {
  initialData: CursorPaginatedResponse<PayoutEntry>;
  searchParams: {
    cursor?: string;
    search?: string;
    status?: string;
  };
}

export function PayoutsTable({ initialData, searchParams }: PayoutsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.search ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.status ?? "");

  const { mutate: updateStatus, isPending } = useUpdatePayoutStatus();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter && statusFilter !== "ALL")
      params.set("status", statusFilter);
    router.push(`/admin/payouts?${params.toString()}` as Route);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    router.push("/admin/payouts" as Route);
  };

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    if (initialData.nextCursor) {
      params.set("cursor", initialData.nextCursor);
    }
    router.push(`/admin/payouts?${params.toString()}` as Route);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleStatusUpdate = (payoutId: string, newStatus: PayoutStatus) => {
    updateStatus({ payoutId, status: newStatus });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by payout ID or shop..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} variant="secondary">
          Search
        </Button>
        <Button onClick={handleClearFilters} variant="outline">
          Clear
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payout ID</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Arrival Date</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No payouts found
                </TableCell>
              </TableRow>
            ) : (
              initialData.data.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-mono text-xs">
                    {payout.pg_payout_id.slice(0, 12)}...
                  </TableCell>
                  <TableCell>
                    {payout.shop?.name ?? (
                      <span className="text-muted-foreground">
                        Deleted Shop
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(payout.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        STATUS_CONFIG[payout.status]?.variant ?? "secondary"
                      }
                    >
                      {STATUS_CONFIG[payout.status]?.label ?? payout.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ClientDate date={payout.arrival_date} format="date" />
                  </TableCell>
                  <TableCell>
                    <ClientDate date={payout.created_at} format="datetime" />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                        >
                          {isPending ? "Updating..." : "Update Status"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <DropdownMenuItem
                            key={key}
                            onClick={() =>
                              handleStatusUpdate(payout.id, key as PayoutStatus)
                            }
                            disabled={payout.status === key}
                          >
                            Mark as {config.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {initialData.hasMore && (
        <div className="flex justify-center">
          <Button onClick={handleLoadMore} variant="outline">
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
