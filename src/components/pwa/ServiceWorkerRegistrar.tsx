"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { logger } from "@/lib/logger";

const TOAST_ID = "sw-update";
let updateRequested = false;
let refreshing = false;
let controllerListenerRegistered = false;

function bindControllerChange() {
  if (controllerListenerRegistered) return;
  controllerListenerRegistered = true;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!updateRequested) return;

    if (refreshing) return;
    refreshing = true;

    window.location.reload();
  });
}

function promptUpdate(waitingWorker: ServiceWorker) {
  toast("A new version of Campus Connect is available.", {
    id: TOAST_ID,
    duration: Infinity,
    action: {
      label: "Update",
      onClick: () => {
        updateRequested = true;
        toast.dismiss(TOAST_ID);
        waitingWorker.postMessage({ type: "SKIP_WAITING" });
      },
    },
  });
}

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    bindControllerChange();

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

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

        if (registration.waiting) {
          promptUpdate(registration.waiting);
        }
      } catch (error) {
        logger.error({ err: error }, "Service worker registration failed:");
      }
    };

    registerSW();
  }, []);

  return null;
}
