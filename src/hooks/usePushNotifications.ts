"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { notificationAPIService } from "@/services/notification/notification-api.service";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      await Promise.resolve();

      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!isMounted) return;

      setIsSupported(supported);

      if (!supported) {
        setIsChecking(false);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          if (isMounted) {
            setIsSubscribed(false);
          }
          return;
        }

        const subscription = await registration.pushManager.getSubscription();
        if (isMounted) {
          setIsSubscribed(!!subscription);
        }
      } catch {
        toast.error("Failed to check push subscription");
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      let registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
      }

      if (!registration) {
        throw new Error("Service worker not registered");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        throw new Error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");
      }

      try {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });

        await notificationAPIService.subscribePush(subscription);
        return subscription;
      } catch (err) {
        if (
          err instanceof Error &&
          err.message?.includes("push service error")
        ) {
          throw new Error(
            "Browser is blocking push services. (Brave: Enable 'Google Services for Push' in settings)"
          );
        }
        throw err;
      }
    },
    onSuccess: () => {
      setIsSubscribed(true);
      toast.success("Push notifications enabled");
    },
    onError: (err) => {
      toast.error(`Failed to enable push notifications: ${err.message}`);
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const successful = await subscription.unsubscribe();
        if (successful) {
          await notificationAPIService.unsubscribePush(subscription.endpoint);
        }
      }
    },
    onSuccess: () => {
      setIsSubscribed(false);
      toast.success("Push notifications disabled");
    },
    onError: () => {
      toast.error("Failed to disable push notifications");
    },
  });

  const subscribe = async () => {
    if (!isSupported) return false;
    try {
      await subscribeMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return false;
    try {
      await unsubscribeMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  const isLoading =
    isChecking || subscribeMutation.isPending || unsubscribeMutation.isPending;

  return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe };
}
