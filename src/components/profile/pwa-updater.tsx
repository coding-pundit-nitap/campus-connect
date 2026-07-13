"use client";

import { CheckCircle, HardDrive, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";

export function PwaUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        setRegistration(reg);

        if (reg.waiting) {
          setUpdateAvailable(true);
        }

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = async () => {
    if (!registration || !registration.waiting) return;

    if ("caches" in window) {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      } catch {
        toast.error("Failed to clear caches");
      }
    }

    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  };

  const handleManualCheck = () => {
    if (registration) {
      registration.update().then(() => {
        if (!registration.waiting && !updateAvailable) {
        }
      });
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
            <Button onClick={handleUpdate} className="w-full sm:w-auto">
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Now
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
              className="w-full sm:w-auto"
            >
              Check for Updates
            </Button>
          </div>
        )}
      </div>
    </SharedCard>
  );
}
