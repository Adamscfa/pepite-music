// Pépite : programme qui tourne en arrière-plan sur le téléphone.
// Il affiche les notifications et ouvre la bonne page quand on touche l'une d'elles.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Le site envoie un simple « réveil » : on lui demande ce qu'il y a de neuf.
self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let news = { title: "Pépite", body: "Du nouveau t'attend sur Pépite.", url: "/" };
      try {
        const res = await fetch("/api/push/latest", { credentials: "include", cache: "no-store" });
        if (res.ok) news = await res.json();
      } catch {
        // Pas de réseau : on garde le message par défaut.
      }
      await self.registration.showNotification(news.title, {
        body: news.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-96.png",
        tag: news.tag,
        renotify: Boolean(news.tag),
        data: { url: news.url || "/" },
      });
    })(),
  );
});

// Toucher la notification : on ouvre (ou on réutilise) un onglet Pépite sur la bonne page.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const tabs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const tab of tabs) {
        if (new URL(tab.url).origin === self.location.origin && "focus" in tab) {
          await tab.navigate(url).catch(() => {});
          return tab.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
