import { Megaphone, Radio, Users } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { getBroadcastStatsAction } from "@/actions/admin";
import { BroadcastForm } from "@/components/admin/broadcasts/broadcast-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Broadcast Notifications | Admin Dashboard",
  description: "Send notifications to all users",
};

export default async function AdminBroadcastsPage() {
  let stats = null;

  try {
    const response = await getBroadcastStatsAction();
    if (response.success) {
      stats = response.data;
    }
  } catch (error) {
    console.error("Failed to load broadcast stats:", error);
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Megaphone className="h-7 w-7 text-rose-600" />
          <h1 className="text-3xl font-bold tracking-tight">
            Broadcast Notifications
          </h1>
        </div>
        <p className="text-muted-foreground">
          Send announcements and system notifications to all users
        </p>
        <div className="text-sm text-muted-foreground">
          <Link href="/admin" className="hover:text-primary">
            Dashboard
          </Link>
          {" / "}
          <span>Broadcasts</span>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Audience
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users reachable
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Broadcasts
              </CardTitle>
              <Megaphone className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBroadcasts}</div>
              <p className="text-xs text-muted-foreground">Sent to date</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
              <Radio className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentBroadcasts}</div>
              <p className="text-xs text-muted-foreground">
                Sent in last 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <BroadcastForm />
    </div>
  );
}
