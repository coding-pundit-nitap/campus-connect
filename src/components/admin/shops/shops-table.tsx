"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionConfirmationDialog } from "@/components/shared/action-confirmation-dialog";
import { ClientDate } from "@/components/shared/client-date";
import { ShopActionsDropdown } from "@/components/shared/shop-actions-dropdown";
import {
  ShopStatusBadge,
  VerificationBadge,
} from "@/components/shared/shop-badges";
import { ShopFilterBar } from "@/components/shared/shop-filter-bar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useActivateShop,
  useAdminShopFilters,
  useDeactivateShop,
  useDeleteShop,
  useUpdateShopVerification,
} from "@/hooks";
import { SellerVerificationStatus } from "@/types/prisma.types";
import { CursorPaginatedResponse } from "@/types/response.types";

interface ShopsTableProps {
  initialData: CursorPaginatedResponse<{
    id: string;
    name: string;
    description: string;
    location: string;
    is_active: boolean;
    verification_status: SellerVerificationStatus;
    created_at: Date;
    user: {
      id: string;
      name: string;
      email: string;
    } | null;
  }>;
  searchParams: {
    cursor?: string;
    search?: string;
    is_active?: string;
    verification_status?: string;
  };
}

export function ShopsTable({ initialData, searchParams }: ShopsTableProps) {
  const router = useRouter();
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    shopId: string;
    shopName: string;
    action: "activate" | "deactivate" | "delete" | null;
  }>({ open: false, shopId: "", shopName: "", action: null });

  const filters = useAdminShopFilters({
    initialSearch: searchParams.search,
    initialStatus: searchParams.is_active,
    initialVerification: searchParams.verification_status,
  });

  const { mutate: activateShop, isPending: isActivating } = useActivateShop();
  const { mutate: deactivateShop, isPending: isDeactivating } =
    useDeactivateShop();
  const { mutate: deleteShop, isPending: isDeleting } = useDeleteShop();
  const { mutate: updateVerification, isPending: isUpdatingVerification } =
    useUpdateShopVerification();

  const isPending =
    isActivating || isDeactivating || isDeleting || isUpdatingVerification;

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams);
    if (initialData.nextCursor) {
      params.set("cursor", initialData.nextCursor);
    }
    router.push(`/admin/shops?${params.toString()}`);
  };

  const handleActivate = (shopId: string) => {
    activateShop(shopId, {
      onSuccess: () => {
        setActionDialog({
          open: false,
          shopId: "",
          shopName: "",
          action: null,
        });
      },
    });
  };

  const handleDeactivate = (shopId: string) => {
    deactivateShop(shopId, {
      onSuccess: () => {
        setActionDialog({
          open: false,
          shopId: "",
          shopName: "",
          action: null,
        });
      },
    });
  };

  const handleDelete = (shopId: string) => {
    deleteShop(shopId, {
      onSuccess: () => {
        setActionDialog({
          open: false,
          shopId: "",
          shopName: "",
          action: null,
        });
      },
    });
  };

  return (
    <div className="space-y-4">
      <ShopFilterBar
        search={filters.search}
        statusFilter={filters.statusFilter}
        verificationFilter={filters.verificationFilter}
        onSearchChange={filters.setSearch}
        onStatusChange={filters.setStatusFilter}
        onVerificationChange={filters.setVerificationFilter}
        onSearch={filters.handleSearch}
        onClearSearch={filters.handleClearSearch}
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shop Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No shops found
                </TableCell>
              </TableRow>
            ) : (
              initialData.data.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {shop.user?.name ?? "Unassigned"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {shop.user?.email ?? "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{shop.location}</TableCell>
                  <TableCell>
                    <ShopStatusBadge isActive={shop.is_active} />
                  </TableCell>
                  <TableCell>
                    <VerificationBadge status={shop.verification_status} />
                  </TableCell>
                  <TableCell>
                    <ClientDate date={shop.created_at} format="datetime" />
                  </TableCell>
                  <TableCell className="text-right">
                    <ShopActionsDropdown
                      isActive={shop.is_active}
                      onActivate={() =>
                        setActionDialog({
                          open: true,
                          shopId: shop.id,
                          shopName: shop.name,
                          action: "activate",
                        })
                      }
                      onDeactivate={() =>
                        setActionDialog({
                          open: true,
                          shopId: shop.id,
                          shopName: shop.name,
                          action: "deactivate",
                        })
                      }
                      onDelete={() =>
                        setActionDialog({
                          open: true,
                          shopId: shop.id,
                          shopName: shop.name,
                          action: "delete",
                        })
                      }
                      onUpdateVerification={(status) =>
                        updateVerification({ shopId: shop.id, status: status })
                      }
                      disabled={isPending || !shop.user}
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

      <ActionConfirmationDialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !open &&
          setActionDialog({
            open: false,
            shopId: "",
            shopName: "",
            action: null,
          })
        }
        action={actionDialog.action}
        itemName={actionDialog.shopName}
        isLoading={isPending}
        onConfirm={() => {
          if (actionDialog.action === "activate") {
            handleActivate(actionDialog.shopId);
          } else if (actionDialog.action === "deactivate") {
            handleDeactivate(actionDialog.shopId);
          } else if (actionDialog.action === "delete") {
            handleDelete(actionDialog.shopId);
          }
        }}
        messages={{
          activate: {
            title: "Activate Shop",
            description:
              "Are you sure you want to activate this item? The shop will become visible to users.",
          },
          deactivate: {
            title: "Deactivate Shop",
            description:
              "Are you sure you want to deactivate this item? The shop will be hidden from users.",
          },
          delete: {
            title: "Delete Shop",
            description:
              "Are you sure you want to delete this item? This action cannot be undone. All products and orders will be preserved but the shop will be removed.",
          },
        }}
        confirmButtonClassName={
          actionDialog.action === "delete"
            ? "bg-destructive hover:bg-destructive/90"
            : ""
        }
      />
    </div>
  );
}
