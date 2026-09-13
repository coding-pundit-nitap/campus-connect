"use client";

import { useEffect } from "react";

import { logger } from "@/lib/logger";

let refreshing = false;
let controllerListenerRegistered = false;

function bindControllerChange() {
  if (controllerListenerRegistered) return;
  controllerListenerRegistered = true;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;

    window.location.reload();
  });
}

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    bindControllerChange();

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      logger.error({ err: error }, "Service worker registration failed:");
    });
  }, []);

  return null;
}
