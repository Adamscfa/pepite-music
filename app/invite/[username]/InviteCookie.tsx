"use client";

import { useEffect } from "react";

// Retient qui a invité (30 jours) : l'invitation est acceptée juste après l'inscription.
export default function InviteCookie({ username }: { username: string }) {
  useEffect(() => {
    document.cookie = `pepite_invite=${encodeURIComponent(username)}; path=/; max-age=${30 * 24 * 3600}; samesite=lax`;
  }, [username]);
  return null;
}
