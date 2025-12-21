"use client";

import { History } from "lucide-react";
import { Route } from "next";
import Link from "next/link";

import { ClientDate } from "@/components/shared/client-date";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminAction } from "@/types/prisma.types";

interface AuditLogStats {
  todayLogs: number;
}

interface AuditLogEntry {
  id: string;
  action: AdminAction;
  admin_name: string | null;
  created_at: Date;
}

interface RecentActivityCardProps {
  auditStats: AuditLogStats | null;
  recentActivity: AuditLogEntry[] | null;
}

export function RecentActivityCard({
  auditStats,
  recentActivity,
}: RecentActivityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Activity
          </span>
          <Link
            href={"/admin/audit-logs" as Route}
            className="text-sm font-normal text-primary hover:underline"
          >
            View All →
          </Link>
        </CardTitle>
        <CardDescription>
          {auditStats
            ? `${auditStats.todayLogs} actions today`
            : "Recent admin actions"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2 border rounded text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {log.action.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-muted-foreground">
                    {log.admin_name || "Unknown Admin"}
                  </span>
                </div>
                <ClientDate date={log.created_at} format="datetime" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        )}
      </CardContent>
    </Card>
  );
}
