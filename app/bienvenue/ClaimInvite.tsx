"use client";

import { useEffect, useRef, useState } from "react";
import { claimInvite } from "./invite-actions";
import { type Locale, t } from "@/lib/i18n";

// Juste après l'inscription : on accepte l'invitation (s'il y en a une) et on le dit.
export default function ClaimInvite({ locale }: { locale: Locale }) {
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
      {t(locale, "invitationAccepted").replace("{inviter}", inviter)}
    </p>
  );
}
