"use client";

import { Folder } from "lucide-react";
import { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CategoryEntry } from "@/actions/admin/category-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CursorPaginatedResponse } from "@/types/response.types";

interface CategoriesTableProps {
  initialData: CursorPaginatedResponse<CategoryEntry>;
  searchParams: {
    cursor?: string;
    search?: string;
  };
}

export function CategoriesTable({
  initialData,
  searchParams,
}: CategoriesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.search ?? "");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    router.push(`/admin/categories?${params.toString()}` as Route);
  };

  const handleClearFilters = () => {
    setSearch("");
    router.push("/admin/categories" as Route);
  };

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    if (initialData.nextCursor) {
      params.set("cursor", initialData.nextCursor);
    }
    router.push(`/admin/categories?${params.toString()}` as Route);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by category or shop name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-w-xs"
        />
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
              <TableHead>Category Name</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Products</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground py-8"
                >
                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              initialData.data.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{category.shop.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        category.productCount > 0 ? "default" : "secondary"
                      }
                    >
                      {category.productCount} product
                      {category.productCount !== 1 ? "s" : ""}
                    </Badge>
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
