"use client";

import { Activity } from "lucide-react";
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

interface AuditLogEntry {
  id: string;
  action: AdminAction; // Or string
  admin_name: string | null;
  created_at: Date;
}

interface RecentActivityFeedProps {
  recentActivity: AuditLogEntry[] | null;
}

export function RecentActivityFeed({
  recentActivity,
}: RecentActivityFeedProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Latest admin actions</CardDescription>
        </div>
        <Link
          href={"/admin/audit-logs" as Route}
          className="text-sm text-primary hover:underline"
        >
          View All
        </Link>
      </CardHeader>
      <CardContent>
        {recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <Badge variant="outline" className="text-xs font-normal">
                      {log.action.replace(/_/g, " ")}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      by {log.admin_name || "Unknown Admin"}
                    </p>
                  </div>
                </div>
                <ClientDate date={log.created_at} format="datetime" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
