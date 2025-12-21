import { AlertCircle, Archive, Package, RefreshCw } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { getAllProductsAction, getProductStatsAction } from "@/actions/admin";
import { ProductsTable } from "@/components/admin/products/products-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  let stats = null;
  let error = null;

  try {
    const [productsRes, statsRes] = await Promise.all([
      getAllProductsAction({
        cursor,
        search,
        shop_id,
        limit: 20,
      }),
      getProductStatsAction(),
    ]);

    if (productsRes.success) products = productsRes.data;
    else error = productsRes.details;

    if (statsRes.success) stats = statsRes.data;
  } catch {
    error = "Failed to load products";
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Package className="h-7 w-7 text-indigo-600" />
          <h1 className="text-3xl font-bold tracking-tight">
            Product Management
          </h1>
        </div>
        <p className="text-muted-foreground">
          View all products, monitor stock levels, and manage listings
        </p>
        <div className="text-sm text-muted-foreground">
          <Link href="/admin" className="hover:text-primary">
            Dashboard
          </Link>
          {" / "}
          <span>Products</span>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentProducts} new this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
              <Archive className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.inStockProducts}
              </div>
              <p className="text-xs text-muted-foreground">
                Available for sale
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Out of Stock
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.outOfStockProducts}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently unavailable
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Updates
              </CardTitle>
              <RefreshCw className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.recentProducts}
              </div>
              <p className="text-xs text-muted-foreground">
                Added in last 7 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
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
