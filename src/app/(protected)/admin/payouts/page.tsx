import { CreditCard } from "lucide-react";
import { Metadata } from "next";

import {
  getAllPayoutsAction,
  getPayoutStatsAction,
  PayoutStats,
} from "@/actions/admin/payout-actions";
import { PayoutsTable } from "@/components/admin/payouts/payouts-table";
import { SharedCard } from "@/components/shared/shared-card";
import { PayoutStatus } from "@/types/prisma.types";

export const metadata: Metadata = {
  title: "Payouts Management | Admin Dashboard",
  description: "Manage shop payouts and payment statuses",
};

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{
    cursor?: string;
    search?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;

  let payouts = null;
  let stats: PayoutStats | null = null;
  let error = null;

  try {
    const [payoutsResponse, statsResponse] = await Promise.all([
      getAllPayoutsAction({
        cursor: params.cursor,
        search: params.search,
        status: params.status as PayoutStatus | undefined,
        limit: 30,
      }),
      getPayoutStatsAction(),
    ]);

    if (payoutsResponse.success) {
      payouts = payoutsResponse.data;
    } else {
      error = payoutsResponse.details;
    }

    if (statsResponse.success) {
      stats = statsResponse.data;
    }
  } catch {
    error = "Failed to load payouts";
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">
            Payouts Management
          </h1>
        </div>
        <p className="text-muted-foreground">
          Track and manage shop payout statuses
        </p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SharedCard
            title="Pending Payouts"
            titleClassName="text-sm font-medium"
            contentClassName=""
          >
            <div className="text-2xl font-bold">{stats.pendingPayouts}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalPendingAmount)} pending
            </p>
          </SharedCard>
          <SharedCard
            title="In Transit"
            titleClassName="text-sm font-medium"
            contentClassName=""
          >
            <div className="text-2xl font-bold">{stats.inTransitPayouts}</div>
            <p className="text-xs text-muted-foreground">Being processed</p>
          </SharedCard>
          <SharedCard
            title="Completed"
            titleClassName="text-sm font-medium"
            contentClassName=""
          >
            <div className="text-2xl font-bold">{stats.paidPayouts}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalPaidAmount)} paid
            </p>
          </SharedCard>
          <SharedCard
            title="Failed"
            titleClassName="text-sm font-medium"
            contentClassName=""
          >
            <div className="text-2xl font-bold text-destructive">
              {stats.failedPayouts}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </SharedCard>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {payouts && <PayoutsTable initialData={payouts} searchParams={params} />}
    </div>
  );
}
