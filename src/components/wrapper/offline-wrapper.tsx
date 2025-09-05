"use client";

import { CheckCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import axiosInstance from "@/lib/axios";

interface OfflineWrapperProps {
  children: React.ReactNode;
}

export function OfflineWrapper({ children }: OfflineWrapperProps) {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline && !isReconnecting) {
      setIsReconnecting(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  }, [isOnline, wasOffline, isReconnecting]);

  if (isOnline && wasOffline && isReconnecting) {
    return <ReconnectingPage />;
  }

  if (!isOnline) {
    return <OfflinePage />;
  }

  return <>{children}</>;
}

function ReconnectingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <Wifi className="h-24 w-24 text-green-500 animate-pulse" />
            <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Back Online!</h1>
          <p className="text-muted-foreground">
            Your internet connection has been restored. Refreshing the page to
            get the latest content...
          </p>
        </div>

        {/* Loading Animation */}
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-green-500" />
          <span className="text-sm text-muted-foreground">Refreshing...</span>
        </div>

        {/* Progress indicator */}
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

function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);

    try {
      const response = await axiosInstance.head("/favicon.ico", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (response.status === 200) {
        window.location.reload();
      }
    } catch {
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Offline Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <WifiOff className="h-24 w-24 text-muted-foreground" />
            <div className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">You're Offline</h1>
          <p className="text-muted-foreground">
            It looks like you've lost your internet connection. Please check
            your network and try again.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <WifiOff className="h-4 w-4" />
            <span>No internet connection detected</span>
          </div>
        </div>

        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          variant="outline"
          className="w-full"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking Connection...
            </>
          ) : (
            <>
              <Wifi className="mr-2 h-4 w-4" />
              Try Again
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
