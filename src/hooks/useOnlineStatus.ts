"use client";

import { useEffect, useState } from "react";

import { checkConnectivity } from "@/lib/utils-functions/connectivity.utils";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      const isActuallyOnline = await checkConnectivity();
      setIsOnline(isActuallyOnline);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const initialCheck = async () => {
      if (navigator.onLine) {
        const isActuallyOnline = await checkConnectivity();
        setIsOnline(isActuallyOnline);
        if (!isActuallyOnline) {
          setWasOffline(true);
        }
      }
    };

    initialCheck();

    const interval = setInterval(async () => {
      if (!isOnline) {
        const isNowOnline = await checkConnectivity();
        if (isNowOnline) {
          setIsOnline(true);
        }
      }
    }, 10000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  return { isOnline, wasOffline };
}
