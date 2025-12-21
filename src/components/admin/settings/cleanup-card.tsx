"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRunCleanup } from "@/hooks";

interface CleanupStats {
  oldNotifications: number;
  oldAuditLogs: number;
  expiredSessions: number;
  orphanedCarts: number;
}

interface CleanupCardProps {
  stats: CleanupStats;
}

export function CleanupCard({ stats }: CleanupCardProps) {
  const { mutate: runCleanup, isPending } = useRunCleanup();

  const handleCleanup = (type: "notifications" | "sessions" | "carts") => {
    if (isPending) return;

    const count =
      type === "notifications"
        ? stats.oldNotifications
        : type === "sessions"
          ? stats.expiredSessions
          : stats.orphanedCarts;

    if (count === 0) {
      toast.info(`No ${type} to clean up`);
      return;
    }

    runCleanup(type);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Data Cleanup
        </CardTitle>
        <CardDescription>
          Clean up old data to keep the system running efficiently
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Old Read Notifications</p>
              <p className="text-sm text-muted-foreground">
                {stats.oldNotifications} notifications older than 30 days
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCleanup("notifications")}
              disabled={isPending || stats.oldNotifications === 0}
            >
              {isPending ? "Cleaning..." : "Clean Up"}
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Expired Sessions</p>
              <p className="text-sm text-muted-foreground">
                {stats.expiredSessions} expired user sessions
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCleanup("sessions")}
              disabled={isPending || stats.expiredSessions === 0}
            >
              {isPending ? "Cleaning..." : "Clean Up"}
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Empty Carts</p>
              <p className="text-sm text-muted-foreground">
                {stats.orphanedCarts} carts with no items
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCleanup("carts")}
              disabled={isPending || stats.orphanedCarts === 0}
            >
              {isPending ? "Cleaning..." : "Clean Up"}
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-muted-foreground">
                Old Audit Logs
              </p>
              <p className="text-sm text-muted-foreground">
                {stats.oldAuditLogs} logs older than 90 days (preserved for
                records)
              </p>
            </div>
            <Button variant="ghost" size="sm" disabled>
              Protected
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
