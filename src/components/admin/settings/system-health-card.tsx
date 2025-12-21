"use client";

import { Activity, CheckCircle, Database, History, Server } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SystemHealth {
  database: { connected: boolean; responseTime: number };
  stats: {
    totalRecords: number;
    oldestAuditLog: Date | null;
    newestAuditLog: Date | null;
  };
}

interface SystemHealthCardProps {
  systemHealth: SystemHealth;
}

export function SystemHealthCard({ systemHealth }: SystemHealthCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          System Health
        </CardTitle>
        <CardDescription>
          Database connectivity and system status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div
              className={`p-2 rounded-full ${
                systemHealth.database.connected
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {systemHealth.database.connected ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Activity className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="font-medium">Database</p>
              <p className="text-sm text-muted-foreground">
                {systemHealth.database.connected ? "Connected" : "Disconnected"}{" "}
                ({systemHealth.database.responseTime}ms)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Total Records</p>
              <p className="text-sm text-muted-foreground">
                {systemHealth.stats.totalRecords.toLocaleString()} entries
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Audit Log Range</p>
              <p className="text-sm text-muted-foreground">
                {systemHealth.stats.oldestAuditLog
                  ? `Since ${new Date(
                      systemHealth.stats.oldestAuditLog
                    ).toLocaleDateString()}`
                  : "No logs yet"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
