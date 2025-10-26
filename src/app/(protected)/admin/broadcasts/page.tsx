import { Metadata } from "next";

import { BroadcastForm } from "@/components/admin/broadcasts/broadcast-form";

export const metadata: Metadata = {
  title: "Broadcast Notifications | Admin Dashboard",
  description: "Send notifications to all users",
};

export default async function AdminBroadcastsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Broadcast Notifications
        </h1>
        <p className="text-muted-foreground">
          Send notifications to all users in the system
        </p>
      </div>

      <BroadcastForm />
    </div>
  );
}
