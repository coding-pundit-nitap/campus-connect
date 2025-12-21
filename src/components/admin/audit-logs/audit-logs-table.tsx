"use client";

import { History } from "lucide-react";
import { Route } from "next";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AuditLogEntry } from "@/actions/admin/audit-log-actions";
import { ClientDate } from "@/components/shared/client-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { AdminAction } from "@/types/prisma.types";
import { CursorPaginatedResponse } from "@/types/response.types";

const ACTION_CONFIG: Record<
  AdminAction,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  SHOP_VERIFY: { label: "Shop Verified", variant: "default" },
  SHOP_REJECT: { label: "Shop Rejected", variant: "destructive" },
  SHOP_ACTIVATE: { label: "Shop Activated", variant: "default" },
  SHOP_DEACTIVATE: { label: "Shop Deactivated", variant: "secondary" },
  SHOP_DELETE: { label: "Shop Deleted", variant: "destructive" },
  USER_MAKE_ADMIN: { label: "User Promoted", variant: "default" },
  USER_REMOVE_ADMIN: { label: "Admin Demoted", variant: "secondary" },
  USER_SUSPEND: { label: "User Suspended", variant: "destructive" },
  USER_UNSUSPEND: { label: "User Unsuspended", variant: "default" },
  USER_DELETE: { label: "User Deleted", variant: "destructive" },
  USER_FORCE_SIGNOUT: { label: "Force Sign Out", variant: "secondary" },
  BROADCAST_CREATE: { label: "Broadcast Sent", variant: "outline" },
  ORDER_STATUS_OVERRIDE: { label: "Order Override", variant: "secondary" },
};

interface AuditLogsTableProps {
  initialData: CursorPaginatedResponse<AuditLogEntry>;
  searchParams: {
    cursor?: string;
    search?: string;
    action?: string;
    start_date?: string;
    end_date?: string;
  };
}

export function AuditLogsTable({
  initialData,
  searchParams,
}: AuditLogsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.search ?? "");
  const [actionFilter, setActionFilter] = useState(searchParams.action ?? "");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (actionFilter && actionFilter !== "ALL")
      params.set("action", actionFilter);
    router.push(`/admin/audit-logs?${params.toString()}` as Route);
  };

  const handleClearFilters = () => {
    setSearch("");
    setActionFilter("");
    router.push("/admin/audit-logs" as Route);
  };

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    if (initialData.nextCursor) {
      params.set("cursor", initialData.nextCursor);
    }
    router.push(`/admin/audit-logs?${params.toString()}` as Route);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const actionGroups = useMemo(
    () => [
      {
        label: "Shop Actions",
        actions: [
          "SHOP_VERIFY",
          "SHOP_REJECT",
          "SHOP_ACTIVATE",
          "SHOP_DEACTIVATE",
          "SHOP_DELETE",
        ],
      },
      {
        label: "User Actions",
        actions: [
          "USER_MAKE_ADMIN",
          "USER_REMOVE_ADMIN",
          "USER_SUSPEND",
          "USER_UNSUSPEND",
          "USER_DELETE",
          "USER_FORCE_SIGNOUT",
        ],
      },
      {
        label: "Other Actions",
        actions: ["BROADCAST_CREATE", "ORDER_STATUS_OVERRIDE"],
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by target ID or admin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-w-xs"
        />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Actions</SelectItem>
            {actionGroups.map((group) => (
              <div key={group.label}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {group.label}
                </div>
                {group.actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {ACTION_CONFIG[action as AdminAction]?.label ?? action}
                  </SelectItem>
                ))}
              </div>
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
              <TableHead>Time</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              initialData.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    <ClientDate date={log.created_at} format="datetime" />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {log.admin_name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {log.admin_email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ACTION_CONFIG[log.action]?.variant ?? "secondary"
                      }
                    >
                      {ACTION_CONFIG[log.action]?.label ?? log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded w-fit">
                        {log.target_type}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {log.target_id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    {log.details ? (
                      <span className="text-xs text-muted-foreground truncate block">
                        {typeof log.details === "object"
                          ? JSON.stringify(log.details).slice(0, 50) + "..."
                          : String(log.details)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
