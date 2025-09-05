"use client";

import { useEffect, useState } from "react";

import { getDatabaseStatus } from "@/lib/utils-functions/database.utils";

interface DatabaseStatus {
  isConnected: boolean;
  latency?: number;
  error?: string;
  lastChecked?: Date;
}

export function useDatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus>({
    isConnected: true,
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const dbStatus = await getDatabaseStatus();
      setStatus({
        ...dbStatus,
        lastChecked: new Date(),
      });
    } catch (error) {
      setStatus({
        isConnected: false,
        error: error instanceof Error ? error.message : "Unknown error",
        lastChecked: new Date(),
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();

    const interval = setInterval(() => {
      if (!status.isConnected) {
        checkStatus();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [status.isConnected]);

  const retry = () => {
    checkStatus();
  };

  return {
    ...status,
    isChecking,
    retry,
  };
}
