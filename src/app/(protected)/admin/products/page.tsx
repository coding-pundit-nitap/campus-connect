import { Metadata } from "next";

import { getAllProductsAction } from "@/actions/admin";
import { ProductsTable } from "@/components/admin/products/products-table";

export const metadata: Metadata = {
  title: "Product Management | Admin Dashboard",
  description: "Manage products across all shops",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    cursor?: string;
    search?: string;
    shop_id?: string;
  }>;
}) {
  const { cursor, search, shop_id } = await searchParams;

  let products = null;
  let error = null;

  try {
    const response = await getAllProductsAction({
      cursor,
      search,
      shop_id,
      limit: 20,
    });

    if (response.success) {
      products = response.data;
    } else {
      error = response.details;
    }
  } catch {
    error = "Failed to load products";
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex  flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Product Management
        </h1>
        <p className="text-muted-foreground">
          Manage products across all shops and delete problematic products
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {products && (
        <ProductsTable
          initialData={products}
          searchParams={await searchParams}
        />
      )}
    </div>
  );
}
