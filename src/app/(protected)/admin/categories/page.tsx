import { Folder } from "lucide-react";
import { Metadata } from "next";

import {
  CategoryStats,
  getAllCategoriesAction,
  getCategoryStatsAction,
} from "@/actions/admin/category-actions";
import { CategoriesTable } from "@/components/admin/categories/categories-table";
import { SharedCard } from "@/components/shared/shared-card";

export const metadata: Metadata = {
  title: "Categories Overview | Admin Dashboard",
  description: "View and manage product categories across all shops",
};

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    cursor?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;

  let categories = null;
  let stats: CategoryStats | null = null;
  let error = null;

  try {
    const [categoriesResponse, statsResponse] = await Promise.all([
      getAllCategoriesAction({
        cursor: params.cursor,
        search: params.search,
        limit: 30,
      }),
      getCategoryStatsAction(),
    ]);

    if (categoriesResponse.success) {
      categories = categoriesResponse.data;
    } else {
      error = categoriesResponse.details;
    }

    if (statsResponse.success) {
      stats = statsResponse.data;
    }
  } catch {
    error = "Failed to load categories";
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Folder className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">
            Categories Overview
          </h1>
        </div>
        <p className="text-muted-foreground">
          View all product categories across shops
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SharedCard
            title="Total Categories"
            titleClassName="text-sm font-medium"
            contentClassName=""
          >
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">Across all shops</p>
          </SharedCard>
          <SharedCard
            title="With Products"
            titleClassName="text-sm font-medium"
            contentClassName=""
          >
            <div className="text-2xl font-bold">
              {stats.categoriesWithProducts}
            </div>
            <p className="text-xs text-muted-foreground">Active categories</p>
          </SharedCard>
          <SharedCard
            title="Empty Categories"
            titleClassName="text-sm font-medium"
            contentClassName=""
          >
            <div className="text-2xl font-bold text-amber-600">
              {stats.emptyCategories}
            </div>
            <p className="text-xs text-muted-foreground">
              No products assigned
            </p>
          </SharedCard>
          <SharedCard
            title="Top Category"
            titleClassName="text-sm font-medium"
            contentClassName=""
          >
            <div className="text-xl font-bold truncate">
              {stats.topCategories[0]?.name ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.topCategories[0]?.count ?? 0} products
            </p>
          </SharedCard>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {categories && (
        <CategoriesTable initialData={categories} searchParams={params} />
      )}
    </div>
  );
}
