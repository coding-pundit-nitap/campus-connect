"use client";

import { Calendar, LogOut, Monitor, Shield, Smartphone } from "lucide-react";

import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRevokeOtherSessions, useRevokeSession, useSessions } from "@/hooks";
import { useSession } from "@/lib/auth-client";

export function SecurityTab() {
  const { data: sessionData } = useSession();
  const { data: sessions = [], isLoading } = useSessions();
  const { mutate: revokeSession, isPending: isRevokingSession } =
    useRevokeSession();
  const { mutate: revokeOtherSessions, isPending: isRevokingOthers } =
    useRevokeOtherSessions();

  const isPending = isRevokingSession || isRevokingOthers;

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor className="h-5 w-5" />;
    const ua = userAgent.toLowerCase();
    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <SharedCard title="Security">
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </SharedCard>
    );
  }

  return (
    <SharedCard title="Security" description="Manage your account security">
      <div className="space-y-6">
        <div className="p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Account Information</h4>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{sessionData?.user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Created</span>
              <span>
                {sessionData?.user?.createdAt
                  ? formatDate(new Date(sessionData.user.createdAt))
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email Verified</span>
              <span>{sessionData?.user?.emailVerified ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Active Sessions</h4>
            {sessions.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => revokeOtherSessions()}
                disabled={isPending}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign out all others
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(session.userAgent)}
                  <div>
                    <p className="text-sm font-medium">
                      {session.userAgent?.split(" ")[0] || "Unknown Device"}
                      {session.current && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          Current
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(session.createdAt)}
                      {session.ipAddress && (
                        <>
                          <span>•</span>
                          <span>{session.ipAddress}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {!session.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeSession(session.id)}
                    disabled={isPending}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </SharedCard>
  );
}
