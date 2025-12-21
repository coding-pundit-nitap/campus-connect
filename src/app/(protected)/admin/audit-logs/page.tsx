import { History } from "lucide-react";
import { Metadata } from "next";

import { getAuditLogsAction } from "@/actions/admin/audit-log-actions";
import { AuditLogsTable } from "@/components/admin/audit-logs/audit-logs-table";
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
  let error = null;

  try {
    const response = await getAuditLogsAction({
      cursor: params.cursor,
      search: params.search,
      action: params.action as AdminAction | undefined,
      start_date: params.start_date ? new Date(params.start_date) : undefined,
      end_date: params.end_date ? new Date(params.end_date) : undefined,
      limit: 30,
    });

    if (response.success) {
      logs = response.data;
    } else {
      error = response.details;
    }
  } catch {
    error = "Failed to load audit logs";
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <History className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        </div>
        <p className="text-muted-foreground">
          View all administrative actions and maintain accountability
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {logs && <AuditLogsTable initialData={logs} searchParams={params} />}
    </div>
  );
}
