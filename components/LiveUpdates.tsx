"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";

// Écoute en direct les messages et notifications reçus par le membre connecté,
// et remet la page à jour quand il en arrive un (pastilles du menu, conversation ouverte).
// Il faut avoir exécuté supabase/07-temps-reel.sql. Sinon, la page se met quand même
// à jour quand on revient dessus (changement d'onglet ou d'appli).
export default function LiveUpdates({ userId }: { userId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const path = useRef(pathname);
  useEffect(() => {
    path.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let pending: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    const supabase = getBrowserClient();

    // Plusieurs nouveautés d'un coup = une seule mise à jour.
    const refresh = () => {
      clearTimeout(pending);
      pending = setTimeout(() => router.refresh(), 250);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    if (supabase) {
      supabase.auth.getSession().then(async ({ data }) => {
        if (cancelled || !data.session) return;
        // Le temps réel utilise la session du membre : les règles de sécurité s'appliquent.
        await supabase.realtime.setAuth(data.session.access_token);
        if (cancelled) return;
        channel = supabase
          .channel(`live-${userId}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` },
            refresh,
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
            refresh,
          )
          // Mes messages lus par l'autre personne : les coches passent au bleu (seulement sur les messages).
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "messages", filter: `sender_id=eq.${userId}` },
            () => {
              if (path.current.startsWith("/messages")) refresh();
            },
          )
          // Un message effacé par son auteur disparaît aussi ici.
          .on(
            "postgres_changes",
            { event: "DELETE", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` },
            refresh,
          )
          .subscribe();
      });
    }

    return () => {
      cancelled = true;
      clearTimeout(pending);
      document.removeEventListener("visibilitychange", onVisible);
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [router, userId]);

  return null;
}
