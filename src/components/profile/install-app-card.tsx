"use client";

import { CheckCircle, Download } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    !!(window.navigator as Navigator & { standalone?: boolean }).standalone
  );
}

// A manual, always-available way to install the app. The floating
// install banner only appears once per visit (after 30s, and never again
// for 30 days once dismissed) - this gives users who missed or dismissed
// it a permanent way back in from Settings.
export function InstallAppCard() {
  const [installed, setInstalled] = useState(isStandalone);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  const handleBeforeInstallPrompt = useCallback((e: Event) => {
    e.preventDefault();
    deferredPromptRef.current = e as BeforeInstallPromptEvent;
    setCanInstall(true);
  }, []);

  const handleAppInstalled = useCallback(() => {
    setInstalled(true);
    setCanInstall(false);
    deferredPromptRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [handleBeforeInstallPrompt, handleAppInstalled]);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setCanInstall(false);
    }
    deferredPromptRef.current = null;
  };

  if (installed || !canInstall) return null;

  return (
    <SharedCard
      title="Install App"
      description="Get the full Campus Connect experience on your device."
      className="border-2 mt-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 rounded-lg border gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="font-medium">Campus Connect is installable</p>
            <p className="text-sm text-muted-foreground">
              Install it for quick access and an app-like experience.
            </p>
          </div>
        </div>
        <Button onClick={handleInstall} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Install App
        </Button>
      </div>
    </SharedCard>
  );
}
