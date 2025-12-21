import { Activity, Calendar, History, UserCog } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import {
  getAuditLogsAction,
  getAuditLogStatsAction,
} from "@/actions/admin/audit-log-actions";
import { AuditLogsTable } from "@/components/admin/audit-logs/audit-logs-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminAction } from "@/types/prisma.types";

export const metadata: Metadata = {
  title: "Audit Logs | Admin Dashboard",
  description: "View administrative action history and audit trail",
};

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    cursor?: string;
    search?: string;
    action?: string;
    start_date?: string;
    end_date?: string;
  }>;
}) {
  const params = await searchParams;

  let logs = null;
  let stats = null;
  let error = null;

  try {
    const [logsRes, statsRes] = await Promise.all([
      getAuditLogsAction({
        cursor: params.cursor,
        search: params.search,
        action: params.action as AdminAction | undefined,
        start_date: params.start_date ? new Date(params.start_date) : undefined,
        end_date: params.end_date ? new Date(params.end_date) : undefined,
        limit: 30,
      }),
      getAuditLogStatsAction(),
    ]);

    if (logsRes.success) logs = logsRes.data;
    else error = logsRes.details;

    if (statsRes.success) stats = statsRes.data;
  } catch {
    error = "Failed to load audit logs";
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <History className="h-7 w-7 text-slate-600" />
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        </div>
        <p className="text-muted-foreground">
          Track administrative actions, security events, and system changes
        </p>
        <div className="text-sm text-muted-foreground">
          <Link href="/admin" className="hover:text-primary">
            Dashboard
          </Link>
          {" / "}
          <span>Audit Logs</span>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Lists</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
              <p className="text-xs text-muted-foreground">Recorded actions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.todayLogs}
              </div>
              <p className="text-xs text-muted-foreground">Actions today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Top Active Admin
              </CardTitle>
              <UserCog className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">
                {stats.topAdmins[0]?.admin_name || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.topAdmins[0]?.count || 0} actions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Most Common</CardTitle>
              <Activity className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold truncate">
                {stats.recentActionCounts[0]?.action?.replace(/_/g, " ") ||
                  "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.recentActionCounts[0]?.count || 0} times recently
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

      {logs && <AuditLogsTable initialData={logs} searchParams={params} />}
    </div>
  );
}
