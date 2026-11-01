"use client";

import { useEffect } from "react";
import { logError } from "@/app/error-actions";

// Note les erreurs qui arrivent dans le navigateur (au plus 3 par page, pour ne pas inonder).
export default function ErrorReporter() {
  useEffect(() => {
    let sent = 0;
    const report = (message: string) => {
      if (sent >= 3 || !message) return;
      // Erreurs d'extensions du navigateur ou de scripts externes : pas les nôtres.
      if (/extension|ResizeObserver loop/i.test(message)) return;
      sent += 1;
      logError({ message, path: window.location.pathname });
    };
    const onError = (e: ErrorEvent) => report(e.message);
    const onRejection = (e: PromiseRejectionEvent) =>
      report(e.reason instanceof Error ? e.reason.message : String(e.reason ?? ""));
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
