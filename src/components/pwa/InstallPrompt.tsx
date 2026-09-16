"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "cc-install-dismissed";
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function isDismissedRecently(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) return false;
    const dismissedAt = parseInt(dismissed, 10);
    return Date.now() - dismissedAt < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

function setDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  } catch {
    // Ignore quota or security errors gracefully
  }
}

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const engagementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const engagementElapsedRef = useRef(false);
  const visibilityRetryRef = useRef<(() => void) | null>(null);

  const clearEngagementTimers = useCallback(() => {
    if (engagementTimerRef.current) {
      clearTimeout(engagementTimerRef.current);
      engagementTimerRef.current = null;
    }
    if (visibilityRetryRef.current) {
      document.removeEventListener(
        "visibilitychange",
        visibilityRetryRef.current
      );
      visibilityRetryRef.current = null;
    }
  }, []);

  const handleBeforeInstallPrompt = useCallback(
    (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;

      // Do not show if already running as an installed PWA (Standalone, Android TWA, iOS Web App)
      if (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone
      ) {
        return;
      }

      // Only show on mobile
      if (window.innerWidth >= 768) return;
      if (isDismissedRecently()) return;

      // Show after 30 seconds of engagement. If the tab is backgrounded
      // right at the 30s mark (locked screen, switched apps - very common
      // on mobile), wait for it to become visible again instead of giving
      // up, otherwise the banner silently never appears for the rest of
      // the visit.
      const trigger = () => {
        if (document.visibilityState !== "visible") return;
        setShowPrompt(true);
        clearEngagementTimers();
      };

      engagementTimerRef.current = setTimeout(() => {
        engagementElapsedRef.current = true;
        trigger();
      }, 30_000);

      visibilityRetryRef.current = () => {
        if (engagementElapsedRef.current) trigger();
      };
      document.addEventListener("visibilitychange", visibilityRetryRef.current);
    },
    [clearEngagementTimers]
  );

  const handleAppInstalled = useCallback(() => {
    setShowPrompt(false);
    deferredPromptRef.current = null;
    clearEngagementTimers();
  }, [clearEngagementTimers]);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearEngagementTimers();
    };
  }, [handleBeforeInstallPrompt, handleAppInstalled, clearEngagementTimers]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setDismissed();
    clearEngagementTimers();
  }, [clearEngagementTimers]);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    } else {
      // Treat a native dismiss exactly like a custom dismiss
      handleDismiss();
    }

    deferredPromptRef.current = null;
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-white/20 bg-white/80 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/60"
        >
          <div className="flex items-center gap-3">
            <Image
              src="/android-chrome-192x192.png"
              alt="Campus Connect"
              width={48}
              height={48}
              className="rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <h3
                className="font-heading text-sm font-semibold"
                style={{ color: "oklch(0.21 0.006 285.885)" }}
              >
                Install Campus Connect
              </h3>
              <p className="text-xs text-muted-foreground">
                Get the full app experience
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstall}
                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95"
                style={{
                  backgroundColor: "oklch(0.21 0.006 285.885)",
                }}
              >
                Install
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors hover:bg-black/10 hover:text-foreground dark:hover:bg-white/10"
                aria-label="Dismiss install prompt"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
