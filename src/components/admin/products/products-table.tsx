"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionConfirmationDialog } from "@/components/shared/action-confirmation-dialog";
import { ClientDate } from "@/components/shared/client-date";
import { ProductActionsDropdown } from "@/components/shared/product-actions-dropdown";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteProduct } from "@/hooks";
import { CursorPaginatedResponse } from "@/types/response.types";

interface ProductsTableProps {
  initialData: CursorPaginatedResponse<{
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
    created_at: Date;
    shop: {
      id: string;
      name: string;
    };
  }>;
  searchParams: {
    cursor?: string;
    search?: string;
    shop_id?: string;
  };
}

export function ProductsTable({
  initialData,
  searchParams,
}: ProductsTableProps) {
  const router = useRouter();
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    productId: string;
    productName: string;
  }>({ open: false, productId: "", productName: "" });

  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams);
    if (initialData.nextCursor) {
      params.set("cursor", initialData.nextCursor);
    }
    router.push(`/admin/products?${params.toString()}`);
  };

  const handleDelete = (productId: string) => {
    deleteProduct(productId, {
      onSuccess: () => {
        setActionDialog({
          open: false,
          productId: "",
          productName: "",
        });
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Created</TableHead>
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
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              initialData.data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.shop.name}</TableCell>
                  <TableCell>₹{product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        product.stock_quantity === 0
                          ? "text-destructive"
                          : product.stock_quantity < 10
                            ? "text-yellow-600"
                            : ""
                      }
                    >
                      {product.stock_quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ClientDate date={product.created_at} format="datetime" />
                  </TableCell>
                  <TableCell className="text-right">
                    <ProductActionsDropdown
                      onDelete={() =>
                        setActionDialog({
                          open: true,
                          productId: product.id,
                          productName: product.name,
                        })
                      }
                      disabled={isDeleting}
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
          <Button onClick={handleLoadMore} disabled={isDeleting}>
            {isDeleting ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      <ActionConfirmationDialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !open &&
          setActionDialog({
            open: false,
            productId: "",
            productName: "",
          })
        }
        action="delete"
        itemName={actionDialog.productName}
        isLoading={isDeleting}
        onConfirm={() => handleDelete(actionDialog.productId)}
        messages={{
          delete: {
            title: "Delete Product",
            description:
              "Are you sure you want to delete this product? This action cannot be undone. Note: Products with order history cannot be deleted.",
          },
        }}
        confirmButtonClassName="bg-destructive hover:bg-destructive/90"
      />
    </div>
  );
}
