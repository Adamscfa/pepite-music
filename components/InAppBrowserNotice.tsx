"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

type BrowserNotice = { platform: "android" | "ios"; openUrl: string };

const COPY: Record<Locale, { android: string; ios: string; open: string; close: string }> = {
  fr: {
    android: "Pour te connecter plus facilement, ouvre Pépite dans Chrome.",
    ios: "Pour une meilleure expérience et te connecter facilement, appuie sur ••• en haut à droite, puis sur « Ouvrir dans le navigateur ».",
    open: "Ouvrir dans Chrome",
    close: "Fermer le message",
  },
  en: {
    android: "For an easier sign-in, open Pépite in Chrome.",
    ios: "For a better experience and easier sign-in, tap ••• in the top right, then “Open in browser”.",
    open: "Open in Chrome",
    close: "Dismiss message",
  },
  es: {
    android: "Para iniciar sesión más fácilmente, abre Pépite en Chrome.",
    ios: "Para disfrutar de una mejor experiencia e iniciar sesión fácilmente, toca ••• arriba a la derecha y luego «Abrir en el navegador».",
    open: "Abrir en Chrome",
    close: "Cerrar mensaje",
  },
};

export default function InAppBrowserNotice({ locale }: { locale: Locale }) {
  const [notice, setNotice] = useState<BrowserNotice | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    if (!/(Instagram|TikTok|musical_ly)/i.test(userAgent)) return;

    const platform = /Android/i.test(userAgent)
      ? "android"
      : /iPhone|iPad|iPod/i.test(userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
        ? "ios"
        : null;
    if (!platform) return;

    const currentUrl = new URL(window.location.href);
    const destination = `${currentUrl.pathname}${currentUrl.search}`;
    const openUrl =
      platform === "android"
        ? `intent://${currentUrl.host}${destination}#Intent;scheme=${currentUrl.protocol.slice(0, -1)};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(currentUrl.href)};end`
        : "";

    // Let OAuth return pages finish in the current browser so the session code is not lost.
    const isAuthCallback = currentUrl.pathname.startsWith("/auth/callback");
    /* eslint-disable react-hooks/set-state-in-effect */
    setNotice({ platform, openUrl });
    /* eslint-enable react-hooks/set-state-in-effect */

    if (platform !== "android" || isAuthCallback) return;
    try {
      if (sessionStorage.getItem("pepite-opened-external-browser") === "1") return;
      sessionStorage.setItem("pepite-opened-external-browser", "1");
      window.location.assign(openUrl);
    } catch {
      // Storage can be disabled in embedded browsers; the visible link remains available.
    }
  }, []);

  if (!notice || dismissed) return null;
  const copy = COPY[locale];

  return (
    <aside className="in-app-browser-notice" role="status">
      <p>{notice.platform === "android" ? copy.android : copy.ios}</p>
      {notice.platform === "android" && (
        <a href={notice.openUrl} className="in-app-browser-open">
          {copy.open} <span aria-hidden="true">↗</span>
        </a>
      )}
      <button
        type="button"
        className="in-app-browser-close"
        aria-label={copy.close}
        onClick={() => setDismissed(true)}
      >
        ×
      </button>
    </aside>
  );
}
