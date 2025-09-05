"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import connectivityAPIService from "@/services/api/connectivity-api.service";

export function useOnlineStatus() {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const isInitialLoad = useRef(true);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    const result = await connectivityAPIService.check();
    setIsChecking(false);

    if (result && !isOnline) {
      setWasOffline(true);
      await queryClient.refetchQueries();
    }

    if (isInitialLoad.current && !result) {
      setWasOffline(true);
    }
    isInitialLoad.current = false;

    setIsOnline(result);
  }, [isOnline, queryClient]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    checkStatus();

    const handleOnline = () => checkStatus();
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(checkStatus, 60000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [checkStatus]);

  return {
    isOnline,
    isChecking,
    wasOffline,
    acknowledgeReconnection: () => setWasOffline(false),
    retry: checkStatus,
  };
}
