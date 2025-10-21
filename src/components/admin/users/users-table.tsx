"use client";

import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { UserActionsDropdown } from "@/components/shared/user-actions-dropdown";
import { UserRoleBadge } from "@/components/shared/user-badges";
import { UserFilterBar } from "@/components/shared/user-filter-bar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDemoteUser, usePromoteUser } from "@/hooks/tanstack/useUserAdmin";
import { useAdminUserFilters } from "@/hooks/useAdminUserFilters";
import { CursorPaginatedResponse } from "@/types/response.types";

interface UsersTableProps {
  initialData: CursorPaginatedResponse<{
    id: string;
    name: string;
    email: string;
    role: Role;
    phone: string | null;
    image: string | null;
    created_at: Date;
  }>;
  searchParams: { cursor?: string; search?: string; role?: string };
}

export function UsersTable({ initialData, searchParams }: UsersTableProps) {
  const router = useRouter();
  const filters = useAdminUserFilters({ initialSearch: searchParams.search });
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    userId: string;
    userEmail: string;
    action: "promote" | "demote" | null;
  }>({ open: false, userId: "", userEmail: "", action: null });

  const { mutate: promoteUser, isPending: isPromoting } = usePromoteUser();
  const { mutate: demoteUser, isPending: isDemoting } = useDemoteUser();

  const isPending = isPromoting || isDemoting;

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams);
    if (initialData.nextCursor) {
      params.set("cursor", initialData.nextCursor);
    }
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleConfirmAction = () => {
    if (actionDialog.action === "promote") {
      promoteUser(actionDialog.userId);
    } else if (actionDialog.action === "demote") {
      demoteUser(actionDialog.userId);
    }
    setActionDialog({ open: false, userId: "", userEmail: "", action: null });
  };

  return (
    <div className="space-y-4">
      <UserFilterBar
        search={filters.search}
        onSearchChange={filters.setSearch}
        onSearch={filters.handleSearch}
        onClearSearch={filters.handleClearSearch}
      />

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              initialData.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <UserRoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>{user.phone || "—"}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActionsDropdown
                      isAdmin={user.role === "ADMIN"}
                      onPromote={() =>
                        setActionDialog({
                          open: true,
                          userId: user.id,
                          userEmail: user.email,
                          action: "promote",
                        })
                      }
                      onDemote={() =>
                        setActionDialog({
                          open: true,
                          userId: user.id,
                          userEmail: user.email,
                          action: "demote",
                        })
                      }
                      disabled={isPending}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {initialData.hasMore && (
        <div className="flex justify-center">
          <Button onClick={handleLoadMore} disabled={isPending}>
            {isPending ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      <AlertDialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !open &&
          setActionDialog({
            open: false,
            userId: "",
            userEmail: "",
            action: null,
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.action === "promote"
                ? "Promote to Admin"
                : "Remove Admin Privileges"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.action === "promote"
                ? `Are you sure you want to promote ${actionDialog.userEmail} to admin? They will have full access to the admin panel.`
                : `Are you sure you want to remove admin privileges from ${actionDialog.userEmail}? They will lose access to the admin panel.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isPending}
            >
              {isPending ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
