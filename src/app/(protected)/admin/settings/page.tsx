import { Settings } from "lucide-react";
import { Metadata } from "next";

import {
  getAuditLogStatsAction,
  getRecentAuditLogsAction,
} from "@/actions/admin";
import {
  getCleanupStatsAction,
  getPlatformOverviewAction,
  getSystemHealthAction,
} from "@/actions/admin/settings-actions";
import { User } from "@/auth";
import { AdministratorInfoCard } from "@/components/admin/settings/administrator-info-card";
import { CleanupCard } from "@/components/admin/settings/cleanup-card";
import { PlatformOverviewCard } from "@/components/admin/settings/platform-overview-card";
import { RecentActivityCard } from "@/components/admin/settings/recent-activity-card";
import { SystemHealthCard } from "@/components/admin/settings/system-health-card";
import authUtils from "@/lib/utils/auth.utils.server";
import { AdminAction } from "@/types/prisma.types";

export const metadata: Metadata = {
  title: "Settings | Admin Dashboard",
  description: "Admin settings and system information",
};

export default async function AdminSettingsPage() {
  const user: User = await authUtils.getUserData();

  let systemHealth = null;
  let cleanupStats = null;
  let platformOverview = null;
  let auditStats = null;
  let recentActivity = null;

  try {
    const [
      healthResponse,
      cleanupResponse,
      overviewResponse,
      auditResponse,
      activityResponse,
    ] = await Promise.all([
      getSystemHealthAction(),
      getCleanupStatsAction(),
      getPlatformOverviewAction(),
      getAuditLogStatsAction(),
      getRecentAuditLogsAction(5),
    ]);

    if (healthResponse.success) systemHealth = healthResponse.data;
    if (cleanupResponse.success) cleanupStats = cleanupResponse.data;
    if (overviewResponse.success) platformOverview = overviewResponse.data;
    if (auditResponse.success) auditStats = auditResponse.data;
    if (activityResponse.success) recentActivity = activityResponse.data;
  } catch {
    // Handle errors silently; data will remain null
  }

  const typedRecentActivity = recentActivity?.map((log) => ({
    ...log,
    action: log.action as AdminAction,
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        </div>
        <p className="text-muted-foreground">
          System health, cleanup tools, and administrative information
        </p>
      </div>

      {systemHealth && <SystemHealthCard systemHealth={systemHealth} />}

      {platformOverview && (
        <PlatformOverviewCard platformOverview={platformOverview} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {cleanupStats && <CleanupCard stats={cleanupStats} />}

        <RecentActivityCard
          auditStats={auditStats}
          recentActivity={typedRecentActivity ?? null}
        />
      </div>

      <AdministratorInfoCard user={user} />
    </div>
  );
}
