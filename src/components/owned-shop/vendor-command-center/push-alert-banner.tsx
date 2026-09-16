"use client";

import { BellRing, Loader2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

/**
 * Prompts the vendor to enable push notifications for new orders.
 *
 * The in-app chime (useLiveNotifications) already alerts vendors across any
 * owner-shops page via SSE, but that only works while a tab is open. Push
 * notifications are the only way to alert them with the app fully closed or
 * the phone locked, so this still nudges vendors to subscribe.
 *
 * Visibility is derived from live subscription state rather than a persisted
 * "dismissed" flag, so the prompt returns if permission is later revoked.
 * Dismissal is per-mount only.
 */
export function PushAlertBanner() {
  const { isSupported, isSubscribed, isLoading, isBrave, subscribe } =
    usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  if (!isLoading && !initialCheckDone) {
    setInitialCheckDone(true);
  }

  if (!isSupported || isSubscribed || dismissed || !initialCheckDone)
    return null;

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      await subscribe();
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
      <BellRing className="h-5 w-5 shrink-0 text-blue-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
          Turn on order alerts
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Get alerted the moment an order arrives - even with the app closed or
          your phone locked. Without this, you only hear a sound while a
          dashboard tab is open.
        </p>
        {isBrave && (
          <p className="mt-1 text-[10px] text-muted-foreground/80 leading-relaxed">
            Using Brave? Enable &quot;Use Google services for push
            messaging&quot; in brave://settings/privacy after turning this on,
            or alerts may silently never arrive.
          </p>
        )}
        <Button
          type="button"
          size="sm"
          onClick={() => void handleSubscribe()}
          disabled={isSubscribing}
          aria-busy={isSubscribing}
          className="mt-2 h-11 rounded-xl border-none bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-70"
        >
          {isSubscribing && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          Turn on alerts
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Dismiss notification prompt"
        onClick={() => setDismissed(true)}
        className="h-11 w-11 shrink-0 rounded-xl"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
