import "server-only";
import { createPrivateKey, sign, type KeyObject } from "node:crypto";
import type { createClient } from "./supabase/server";

// Notifications sur le téléphone (Web Push), sans bibliothèque en plus.
// On envoie un simple « réveil » sans contenu : l'appli demande ensuite elle-même
// au site ce qu'il y a de neuf (/api/push/latest). Rien de privé ne transite donc
// par les serveurs de Google, Apple ou Mozilla.
//
// Clés à mettre dans Vercel > Settings > Environment Variables (voir le README) :
// NEXT_PUBLIC_VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY.
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT =
  process.env.VAPID_SUBJECT ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "mailto:contact@pepite.invalid");

export const hasPush = Boolean(PUBLIC_KEY && PRIVATE_KEY);

type Supabase = Awaited<ReturnType<typeof createClient>>;

let key: KeyObject | null = null;
function privateKey(): KeyObject {
  if (key) return key;
  const pub = Buffer.from(PUBLIC_KEY, "base64url"); // 65 octets : 0x04, puis x et y
  key = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      d: PRIVATE_KEY,
      x: pub.subarray(1, 33).toString("base64url"),
      y: pub.subarray(33, 65).toString("base64url"),
    },
    format: "jwk",
  });
  return key;
}

// Signature « VAPID » : prouve au service de notifications que c'est bien Pépite qui envoie.
function authorization(endpoint: string): string {
  const part = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = part({ typ: "JWT", alg: "ES256" });
  const body = part({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: SUBJECT,
  });
  const signature = sign("sha256", Buffer.from(`${head}.${body}`), {
    key: privateKey(),
    dsaEncoding: "ieee-p1363",
  }).toString("base64url");
  return `vapid t=${head}.${body}.${signature}, k=${PUBLIC_KEY}`;
}

// Envoie un « réveil » à ces appareils. Ceux qui n'existent plus sont signalés à forget().
export async function wakeUp(endpoints: string[], forget: (endpoint: string) => PromiseLike<unknown>) {
  if (!hasPush) return { sent: 0, gone: 0 };
  let sent = 0;
  let gone = 0;
  // Par petits groupes, pour ne pas tout lancer d'un coup.
  for (let i = 0; i < endpoints.length; i += 20) {
    await Promise.all(
      endpoints.slice(i, i + 20).map(async (endpoint) => {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { TTL: "86400", Urgency: "high", Authorization: authorization(endpoint), "Content-Length": "0" },
          });
          // 404 / 410 : l'appareil s'est désabonné, on l'oublie.
          if (res.status === 404 || res.status === 410) {
            gone += 1;
            await forget(endpoint);
          } else if (res.ok) sent += 1;
          else console.error(`Notification refusée (${res.status}) : ${await res.text()}`);
        } catch (error) {
          console.error("Notification impossible à envoyer", error);
        }
      }),
    );
  }
  return { sent, gone };
}

// Réveille les appareils de ces membres. La base ne donne leurs adresses que si
// le membre connecté vient de leur envoyer un message ou une notification.
export async function pushTo(supabase: Supabase, userIds: (string | null | undefined)[]) {
  if (!hasPush) return;
  const targets = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  for (const target of targets) {
    const { data } = await supabase.rpc("push_targets", { target });
    const endpoints = ((data ?? []) as { endpoint: string }[]).map((d) => d.endpoint);
    await wakeUp(endpoints, (endpoint) => supabase.rpc("forget_push", { old_endpoint: endpoint }));
  }
}
