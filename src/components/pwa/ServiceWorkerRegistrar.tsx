"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        // Check for waiting worker on initial load
        if (registration.waiting) {
          promptUpdate(registration.waiting);
        }

        // Listen for new service workers being installed
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              promptUpdate(newWorker);
            }
          });
        });
      } catch (error) {
        console.warn("Service worker registration failed:", error);
      }
    };

    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    registerSW();

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  return null;
}

function promptUpdate(waitingWorker: ServiceWorker) {
  toast("A new version is available", {
    duration: Infinity,
    action: {
      label: "Update",
      onClick: () => {
        waitingWorker.postMessage({ type: "SKIP_WAITING" });
      },
    },
  });
}
