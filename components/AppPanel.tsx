"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription } from "@/app/push-actions";
import Icon from "./Icon";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type PushState = "unsupported" | "denied" | "off" | "on" | "busy" | "ios-install";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

// La clé publique arrive en base64url, le navigateur la veut en octets.
function keyBytes(base64: string) {
  const raw = atob(base64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// Enregistre le programme d'arrière-plan (public/sw.js) dès l'ouverture du site :
// c'est ce qui rend Pépite installable et capable de recevoir des notifications.
export function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

// « Installer l'appli » et « Activer les notifications ».
// variant="side" : version compacte de la barre latérale ; "card" : encadré du profil.
export default function AppPanel({ variant, loggedIn }: { variant: "side" | "card"; loggedIn: boolean }) {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [push, setPush] = useState<PushState>("unsupported");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    // Lecture de l'état de l'appareil au chargement (ne peut pas se faire au rendu serveur).
    /* eslint-disable react-hooks/set-state-in-effect */
    setInstalled(standalone);
    setIos(isIos);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (!VAPID || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      // Sur iPhone, les notifications ne marchent qu'une fois l'appli installée.
      setPush(isIos && !standalone ? "ios-install" : "unsupported");
    } else if (Notification.permission === "denied") {
      setPush("denied");
    } else {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setPush(sub ? "on" : "off"))
        .catch(() => setPush("unsupported"));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function enablePush() {
    setPush("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPush(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID) }));
      const { ok } = await savePushSubscription(sub.toJSON());
      setPush(ok ? "on" : "off");
    } catch {
      setPush("off");
    }
  }

  async function disablePush() {
    setPush("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
    } finally {
      setPush("off");
    }
  }

  const canInstall = !installed && (install || ios);
  const pushButton = loggedIn && push !== "unsupported" && (
    <button
      type="button"
      className={variant === "side" ? "side-app-btn" : "btn ghost"}
      disabled={push === "busy" || push === "denied" || push === "ios-install"}
      aria-pressed={push === "on"}
      onClick={push === "on" ? disablePush : enablePush}
      title={
        push === "denied"
          ? "Les notifications sont bloquées : autorise-les dans les réglages du navigateur pour ce site."
          : push === "ios-install"
            ? "Sur iPhone, installe d'abord Pépite sur l'écran d'accueil."
            : undefined
      }
    >
      <Icon name="bell" size={18} />
      {push === "on"
        ? "Notifications activées"
        : push === "denied"
          ? "Notifications bloquées"
          : push === "ios-install"
            ? "Notifications : installe l'appli"
            : push === "busy"
              ? "Un instant…"
              : "Activer les notifications"}
    </button>
  );

  if (!canInstall && !pushButton) return null;

  const installButton = canInstall && (
    <button
      type="button"
      className={variant === "side" ? "side-app-btn" : "btn"}
      onClick={async () => {
        if (install) {
          await install.prompt();
          await install.userChoice;
          setInstall(null);
        } else setShowIosHelp(!showIosHelp);
      }}
    >
      <Icon name="download" size={18} /> Installer l&apos;appli
    </button>
  );

  const iosHelp = showIosHelp && (
    <p className={variant === "side" ? "side-app-help" : "small"}>
      Sur iPhone : touche le bouton <b>Partager</b> (le carré avec une flèche) en bas de Safari, puis{" "}
      <b>Sur l&apos;écran d&apos;accueil</b>.
    </p>
  );

  if (variant === "side") {
    return (
      <div className="side-app">
        {installButton}
        {iosHelp}
        {pushButton}
      </div>
    );
  }
  return (
    <section className="box app-card">
      <h2 className="section-title">Pépite sur ton téléphone</h2>
      <p className="small">
        Installe Pépite comme une appli, avec son icône sur l&apos;écran d&apos;accueil, et reçois une notification
        quand on t&apos;écrit, qu&apos;on aime tes avis ou qu&apos;on te répond.
      </p>
      <div className="row" style={{ justifyContent: "flex-start" }}>
        {installButton}
        {pushButton}
      </div>
      {iosHelp}
    </section>
  );
}
