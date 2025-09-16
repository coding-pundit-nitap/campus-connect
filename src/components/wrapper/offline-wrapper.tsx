"use client";

import { CheckCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface OfflineWrapperProps {
  children: React.ReactNode;
}

export function OfflineWrapper({ children }: OfflineWrapperProps) {
  const { isOnline, wasOffline, acknowledgeReconnection, isChecking, retry } =
    useOnlineStatus();

  useEffect(() => {
    if (isOnline && wasOffline) {
      const timer = setTimeout(() => {
        acknowledgeReconnection();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, acknowledgeReconnection]);

  if (isOnline && wasOffline) {
    return <ReconnectingPage />;
  }

  if (!isOnline) {
    return <OfflinePage isChecking={isChecking} onRetry={retry} />;
  }

  return <>{children}</>;
}

export function ReconnectingPage() {
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
            Your connection has been restored. Updating content...
          </p>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-green-500" />
          <span className="text-sm text-muted-foreground">Updating...</span>
        </div>
      </div>
    </div>
  );
}

interface OfflinePageProps {
  isChecking: boolean;
  onRetry: () => void;
}

export function OfflinePage({ isChecking, onRetry }: OfflinePageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <WifiOff className="h-24 w-24 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">You're Offline</h1>
          <p className="text-muted-foreground">
            It looks like you've lost your internet connection. Please check
            your network settings.
          </p>
        </div>
        <Button
          onClick={onRetry}
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
              <Wifi className="mr-2 h-4 w-4" />
              Try Again
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
