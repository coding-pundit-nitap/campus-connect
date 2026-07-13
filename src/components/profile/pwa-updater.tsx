"use client";

import { CheckCircle, HardDrive, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";

export function PwaUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  // Store the waiting worker directly — registration.waiting can become
  // null on mobile if the browser discards it between detection and click.
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  const onWaitingWorkerFound = useCallback((worker: ServiceWorker) => {
    waitingWorkerRef.current = worker;
    setUpdateAvailable(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      registrationRef.current = reg;

      if (reg.waiting) {
        onWaitingWorkerFound(reg.waiting);
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            onWaitingWorkerFound(newWorker);
          }
        });
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, [onWaitingWorkerFound]);

  const handleUpdate = async () => {
    setIsUpdating(true);

    // Clear all caches first.
    if ("caches" in window) {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      } catch {
        // Non-fatal — continue with the update.
      }
    }

    // Try to activate the waiting worker.
    let worker = waitingWorkerRef.current;

    // Fallback: if the stored reference is gone, re-check registration.waiting.
    if (!worker) {
      worker = registrationRef.current?.waiting ?? null;
    }

    if (worker) {
      worker.postMessage({ type: "SKIP_WAITING" });
      // The controllerchange listener will reload the page.
      // Set a timeout fallback in case the event doesn't fire (e.g., on some mobile browsers).
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      return;
    }

    // Last resort: the waiting worker was lost entirely (common on mobile
    // after the phone was locked or the app was backgrounded).
    // Force a hard reload to pick up the new service worker.
    try {
      await registrationRef.current?.update();
      const reg = registrationRef.current;
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        return;
      }
    } catch {
      // update() can fail on some mobile browsers — fall through to reload.
    }

    // If nothing else worked, just reload — the browser will pick up the
    // latest SW on next navigation anyway since caches are already cleared.
    window.location.reload();
  };

  const handleManualCheck = async () => {
    const reg = registrationRef.current;
    if (!reg) {
      toast.error("Update service not available");
      return;
    }

    setIsChecking(true);
    try {
      await reg.update();
      if (reg.waiting) {
        onWaitingWorkerFound(reg.waiting);
      } else if (!updateAvailable) {
        toast.success("App is already up to date!");
      }
    } catch {
      toast.error("Failed to check for updates");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <SharedCard
      title="App Updates"
      description="Manage your Progressive Web App updates and cache."
      className="border-2 mt-6"
    >
      <div className="space-y-4">
        {updateAvailable ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20 gap-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary">
                  Update Ready to Install
                </p>
                <p className="text-sm text-muted-foreground">
                  Installing the update will clear your cache and refresh the
                  app to the latest version.
                </p>
              </div>
            </div>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isUpdating ? "animate-spin" : ""}`}
              />
              {isUpdating ? "Updating..." : "Update Now"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 rounded-lg border gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-medium">App is up to date</p>
                <p className="text-sm text-muted-foreground">
                  You are running the latest version of Campus Connect.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleManualCheck}
              disabled={isChecking}
              className="w-full sm:w-auto"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check for Updates"
              )}
            </Button>
          </div>
        )}
      </div>
    </SharedCard>
  );
}
