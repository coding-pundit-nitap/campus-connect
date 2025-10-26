import { SellerVerificationStatus } from "@prisma/client";
import { Metadata } from "next";

import { getAllShopsAction } from "@/actions/admin";
import { ShopsTable } from "@/components/admin/shops/shops-table";

export const metadata: Metadata = {
  title: "Shop Management | Admin Dashboard",
  description: "Manage shops, verification, and activation status",
};

export default async function AdminShopsPage({
  searchParams,
}: {
  searchParams: Promise<{
    cursor?: string;
    search?: string;
    is_active?: string;
    verification_status?: string;
  }>;
}) {
  const { cursor, search, is_active, verification_status } = await searchParams;

  let shops = null;
  let error = null;

  try {
    const response = await getAllShopsAction({
      cursor,
      search,
      is_active:
        is_active === "true" ? true : is_active === "false" ? false : undefined,
      verification_status: verification_status as
        | SellerVerificationStatus
        | undefined,
      limit: 20,
    });

    if (response.success) {
      shops = response.data;
    } else {
      error = response.details;
    }
  } catch {
    error = "Failed to load shops";
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Shop Management</h1>
        <p className="text-muted-foreground">
          Manage shop activation, verification, and deletion
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {shops && (
        <ShopsTable initialData={shops} searchParams={await searchParams} />
      )}
    </div>
  );
}
