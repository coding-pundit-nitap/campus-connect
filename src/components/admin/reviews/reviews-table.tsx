"use client";

import { Star, Trash2 } from "lucide-react";
import { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ReviewEntry } from "@/actions/admin/review-actions";
import { ClientDate } from "@/components/shared/client-date";
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
import { useDeleteReview } from "@/hooks";
import { CursorPaginatedResponse } from "@/types/response.types";

interface ReviewsTableProps {
  initialData: CursorPaginatedResponse<ReviewEntry>;
  searchParams: {
    cursor?: string;
    search?: string;
    rating?: string;
  };
}

export function ReviewsTable({ initialData, searchParams }: ReviewsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.search ?? "");
  const [ratingFilter, setRatingFilter] = useState(searchParams.rating ?? "");
  const { mutate: deleteReview, isPending } = useDeleteReview();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    reviewId: string;
    productName: string;
    userName: string;
  }>({ open: false, reviewId: "", productName: "", userName: "" });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (ratingFilter && ratingFilter !== "ALL")
      params.set("rating", ratingFilter);
    router.push(`/admin/reviews?${params.toString()}` as Route);
  };

  const handleClearFilters = () => {
    setSearch("");
    setRatingFilter("");
    router.push("/admin/reviews" as Route);
  };

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    if (initialData.nextCursor) {
      params.set("cursor", initialData.nextCursor);
    }
    router.push(`/admin/reviews?${params.toString()}` as Route);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteDialog.reviewId) return;
    deleteReview(deleteDialog.reviewId, {
      onSettled: () => {
        setDeleteDialog({
          open: false,
          reviewId: "",
          productName: "",
          userName: "",
        });
      },
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by comment, user, or product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-w-xs"
        />
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((rating) => (
              <SelectItem key={rating} value={String(rating)}>
                {rating} Star{rating !== 1 ? "s" : ""}
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
              <TableHead>User</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="max-w-[300px]">Comment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No reviews found
                </TableCell>
              </TableRow>
            ) : (
              initialData.data.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {review.user.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {review.user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {review.product.name}
                      </span>
                      <Badge variant="outline" className="text-xs w-fit mt-0.5">
                        {review.product.shop.name}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {review.comment}
                    </p>
                  </TableCell>
                  <TableCell>
                    <ClientDate date={review.created_at} format="date" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          reviewId: review.id,
                          productName: review.product.name,
                          userName: review.user.name,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open &&
          setDeleteDialog({
            open: false,
            reviewId: "",
            productName: "",
            userName: "",
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review by{" "}
              {deleteDialog.userName} on "{deleteDialog.productName}"? This
              action cannot be undone. The user will be notified that their
              review was removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete Review"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
