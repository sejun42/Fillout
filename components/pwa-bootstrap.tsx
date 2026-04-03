"use client";

import { useEffect } from "react";

export function PwaBootstrap() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    async function register() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        if (!cancelled) {
          await registration.update();
        }
      } catch {
        return undefined;
      }
    }

    void register();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
