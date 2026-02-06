import { CreditCard, LayoutDashboard, Star } from "lucide-react";
import { Metadata } from "next";

import {
  getDashboardAnalyticsAction,
  getPayoutStatsAction,
  getRecentAuditLogsAction,
  getReviewStatsAction,
} from "@/actions/admin";
import { DashboardStats } from "@/components/admin/dashboard/dashboard-stats";
import { PlatformHealthStatus } from "@/components/admin/dashboard/platform-health-status";
import { QuickActionsGrid } from "@/components/admin/dashboard/quick-actions-grid";
import { RecentActivityFeed } from "@/components/admin/dashboard/recent-activity-feed";
import { SharedCard } from "@/components/shared/shared-card";
import { AdminAction } from "@/types/prisma.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard | Campus Connect",
  description: "Administrative dashboard for managing Campus Connect",
};

export default async function AdminDashboardPage() {
  let analytics = null;
  let recentActivity = null;
  let payoutStats = null;
  let reviewStats = null;
  let error = null;

  try {
    const [analyticsRes, activityRes, payoutsRes, reviewsRes] =
      await Promise.all([
        getDashboardAnalyticsAction(),
        getRecentAuditLogsAction(5),
        getPayoutStatsAction(),
        getReviewStatsAction(),
      ]);

    if (analyticsRes.success) analytics = analyticsRes.data;
    else error = analyticsRes.details;

    if (activityRes.success) recentActivity = activityRes.data;
    if (payoutsRes.success) payoutStats = payoutsRes.data;
    if (reviewsRes.success) reviewStats = reviewsRes.data;
  } catch {
    error = "Failed to load analytics";
  }

  const typedRecentActivity = recentActivity?.map((log) => ({
    ...log,
    action: log.action as AdminAction,
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your platform.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      {analytics && <DashboardStats analytics={analytics} />}

      {(payoutStats || reviewStats) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {payoutStats && (
            <>
              <SharedCard
                title="Pending Payouts"
                titleClassName="text-sm font-medium"
                headerContent={
                  <CreditCard className="h-4 w-4 text-amber-500" />
                }
                headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
              >
                <div className="text-2xl font-bold">
                  {payoutStats.pendingPayouts}
                </div>
                <p className="text-xs text-muted-foreground">
                  ₹{Number(payoutStats.totalPendingAmount).toLocaleString()}{" "}
                  pending
                </p>
              </SharedCard>
              <SharedCard
                title="Completed Payouts"
                titleClassName="text-sm font-medium"
                headerContent={
                  <CreditCard className="h-4 w-4 text-green-500" />
                }
                headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
              >
                <div className="text-2xl font-bold">
                  {payoutStats.paidPayouts}
                </div>
                <p className="text-xs text-muted-foreground">
                  ₹{Number(payoutStats.totalPaidAmount).toLocaleString()} paid
                  out
                </p>
              </SharedCard>
            </>
          )}
          {reviewStats && (
            <>
              <SharedCard
                title="Total Reviews"
                titleClassName="text-sm font-medium"
                headerContent={<Star className="h-4 w-4 text-yellow-500" />}
                headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
              >
                <div className="text-2xl font-bold">
                  {reviewStats.totalReviews}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reviewStats.recentReviews} this week
                </p>
              </SharedCard>
              <SharedCard
                title="Average Rating"
                titleClassName="text-sm font-medium"
                headerContent={
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                }
                headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
              >
                <div className="text-2xl font-bold">
                  {reviewStats.averageRating.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">out of 5 stars</p>
              </SharedCard>
            </>
          )}
        </div>
      )}

      <QuickActionsGrid />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivityFeed recentActivity={typedRecentActivity ?? null} />

        {analytics && <PlatformHealthStatus analytics={analytics} />}
      </div>
    </div>
  );
}
