"use client";

import { useEffect, useRef, useState } from "react";
import { claimInvite } from "./invite-actions";

// Juste après l'inscription : on accepte l'invitation (s'il y en a une) et on le dit.
export default function ClaimInvite() {
  const [inviter, setInviter] = useState<string | null>(null);
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !document.cookie.includes("pepite_invite=")) return;
    done.current = true;
    claimInvite().then((r) => r.inviter && setInviter(r.inviter));
  }, []);
  if (!inviter) return null;
  return (
    <p className="notice invite-ok">
      🎉 Invitation acceptée : {inviter} et toi êtes maintenant abonnés l&apos;un à l&apos;autre.
    </p>
  );
}
