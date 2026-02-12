"use client";

import {
  AlertTriangle,
  CheckCircle,
  Database,
  RefreshCw,
  Server,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useDatabaseStatus } from "@/hooks";
import { healthCheckAPIService } from "@/services/healthcheck";

interface DatabaseWrapperProps {
  children: React.ReactNode;
}

export function DatabaseWrapper({ children }: DatabaseWrapperProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  const {
    isChecking,
    retry,
    error,
    isConnected,
    lastChecked,
    latency,
    isError,
  } = useDatabaseStatus({
    refetchInterval: isDevelopment ? undefined : 300000,
  });

  const [showReconnecting, setShowReconnecting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isConnected && showReconnecting) {
      timeoutRef.current = setTimeout(() => {
        setShowReconnecting(false);
      }, 2000);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isConnected, showReconnecting, timeoutRef]);

  if (isDevelopment) {
    return <>{children}</>;
  }

  // Show reconnecting screen when connection is restored
  if (isConnected && showReconnecting) {
    return <DatabaseReconnectingPage latency={latency} />;
  }

  // Show children if connected (skip initial loading state to avoid flash)
  if (isConnected) {
    return <>{children}</>;
  }

  if (!isConnected && !isChecking) {
    return (
      <DatabaseErrorPage
        error={error}
        lastChecked={lastChecked}
        isChecking={isChecking}
        onRetry={() => {
          setShowReconnecting(true);
          retry();
        }}
      />
    );
  }

  return <>{children}</>;
}

function DatabaseReconnectingPage({ latency }: { latency?: number }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <Database className="h-24 w-24 text-green-500 animate-pulse" />
            <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Database Connected!
          </h1>
          <p className="text-muted-foreground">
            Connection to the database has been restored.
            {latency && ` Response time: ${Math.round(latency)}ms`}
          </p>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-green-500" />
          <span className="text-sm text-muted-foreground">
            Loading application...
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full animate-pulse"
            style={{ width: "100%" }}
          ></div>
        </div>
      </div>
    </div>
  );
}

function DatabaseErrorPage({
  error,
  lastChecked,
  isChecking,
  onRetry,
}: {
  error?: string;
  lastChecked?: Date;
  isChecking: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <Database className="h-24 w-24 text-muted-foreground" />
            <div className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Database Unavailable
          </h1>
          <p className="text-muted-foreground">
            We're having trouble connecting to our database. This may be a
            temporary issue.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800 font-medium">Error Details:</p>
            <p className="text-xs text-red-600 mt-1 font-mono">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Server className="h-4 w-4" />
            <span>Database connection failed</span>
          </div>

          {lastChecked && (
            <div className="text-xs text-muted-foreground">
              Last checked: {lastChecked.toLocaleTimeString()}
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="text-muted-foreground">
              We're automatically trying to reconnect. You can also try
              refreshing the page or checking back in a few minutes.
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            healthCheckAPIService.resetCircuitBreaker();
            onRetry();
          }}
          disabled={isChecking}
          variant="outline"
          className="w-full"
        >
          {isChecking ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking Connection...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Try Again
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
