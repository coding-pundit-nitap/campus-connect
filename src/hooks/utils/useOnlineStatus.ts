"use client";
import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useOnlineStatus() {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());
  const [wasOffline, setWasOffline] = useState(!isOnline);
  const [isChecking, setIsChecking] = useState(false);
  useEffect(() => {
    const unsubscribe = onlineManager.subscribe((online) => {
      if (online && !isOnline) {
        setWasOffline(true);
      }
      setIsOnline(online);
    });

    return () => {
      unsubscribe();
    };
  }, [isOnline]);

  const retry = async () => {
    setIsChecking(true);
    await queryClient.refetchQueries();
    setIsChecking(false);
  };

  return {
    isOnline,
    isChecking,
    wasOffline,
    acknowledgeReconnection: () => setWasOffline(false),
    retry,
  };
}
