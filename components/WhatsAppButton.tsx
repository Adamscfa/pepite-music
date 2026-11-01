"use client";

import Icon from "./Icon";

// Partage sur WhatsApp : ouvre l'appli (ou WhatsApp Web) avec le texte et le lien déjà écrits.
// Le lien affiche ensuite une belle image de l'avis dans la conversation.
export default function WhatsAppButton({ text, path }: { text: string; path: string }) {
  return (
    <button
      type="button"
      className="action whatsapp"
      title="Partager sur WhatsApp"
      onClick={() => {
        const url = new URL(path, window.location.origin).href;
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
      }}
    >
      <Icon name="whatsapp" size={20} />
      <span className="action-label">WhatsApp</span>
    </button>
  );
}
