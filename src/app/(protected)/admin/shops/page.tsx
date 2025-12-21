import {
  CheckCircle,
  Clock,
  ShieldCheck,
  ShoppingBag,
  Store,
  XCircle,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { getAllShopsAction, getShopStatsAction } from "@/actions/admin";
import { ShopsTable } from "@/components/admin/shops/shops-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SellerVerificationStatus } from "@/types/prisma.types";

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
  let stats = null;
  let error = null;

  try {
    const [shopsRes, statsRes] = await Promise.all([
      getAllShopsAction({
        cursor,
        search,
        is_active:
          is_active === "true"
            ? true
            : is_active === "false"
              ? false
              : undefined,
        verification_status: verification_status as
          | SellerVerificationStatus
          | undefined,
        limit: 20,
      }).then((response) => {
        return {
          ...response,
          data: {
            ...response.data,
            data: response.data.data.map((shop) => ({
              ...shop,
              verification_status:
                shop.verification_status as SellerVerificationStatus,
            })),
          },
        };
      }),
      getShopStatsAction(),
    ]);

    if (shopsRes.success) shops = shopsRes.data;
    else error = shopsRes.details;

    if (statsRes.success) stats = statsRes.data;
  } catch {
    error = "Failed to load shops";
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Store className="h-7 w-7 text-emerald-600" />
          <h1 className="text-3xl font-bold tracking-tight">Shop Management</h1>
        </div>
        <p className="text-muted-foreground">
          Manage shop activation, verification status, and details
        </p>
        <div className="text-sm text-muted-foreground">
          <Link href="/admin" className="hover:text-primary">
            Dashboard
          </Link>
          {" / "}
          <span>Shops</span>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalShops}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentShops} new this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Shops
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeShops}
              </div>
              <p className="text-xs text-muted-foreground">Typically active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Verified Shops
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.verifiedShops}
              </div>
              <p className="text-xs text-muted-foreground">Identity verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Verify
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {stats.pendingVerification}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Inactive Shops
              </CardTitle>
              <XCircle className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-500">
                {stats.inactiveShops}
              </div>
              <p className="text-xs text-muted-foreground">
                Deactivated or closed
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

      {shops && (
        <ShopsTable initialData={shops} searchParams={await searchParams} />
      )}
    </div>
  );
}
