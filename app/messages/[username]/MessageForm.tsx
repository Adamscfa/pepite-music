"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendMessage, type FormState } from "@/app/social-actions";
import Icon from "@/components/Icon";

type AlbumHit = { id: number; title: string; artist: string; cover: string };

// Barre d'écriture collée en bas de l'écran, comme dans WhatsApp.
// Entrée envoie le message, Maj + Entrée passe à la ligne. Le bouton 💿 recommande un album.
export default function MessageForm({ to, onTyping }: { to: string; onTyping?: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendMessage, {});
  const form = useRef<HTMLFormElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [picking, setPicking] = useState(false);
  const [album, setAlbum] = useState<AlbumHit | null>(null);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ q: string; albums: AlbumHit[] } | null>(null);

  // La zone de texte grandit avec le message (jusqu'à quelques lignes).
  const grow = () => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  // Après l'envoi : on vide, on garde le curseur dans le champ et on descend au dernier message.
  useEffect(() => {
    if (!state.done) return;
    form.current?.reset();
    grow();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlbum(null);
    field.current?.focus();
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, [state]);

  // Recherche d'albums pendant qu'on tape (300 ms après la dernière lettre).
  const q = query.trim();
  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = res.ok ? await res.json() : { albums: [] };
        setFound({ q, albums: data.albums ?? [] });
      } catch {
        // Recherche annulée par une nouvelle lettre.
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);
  const results = found?.q === q ? found.albums : [];

  return (
    <form action={action} ref={form} className="composer">
      {state.error && <p className="error">{state.error}</p>}

      {picking && (
        <div className="album-pick">
          <div className="album-pick-head">
            <b>Recommander un album</b>
            <button type="button" className="text-btn" onClick={() => setPicking(false)}>
              Fermer
            </button>
          </div>
          <input
            type="search"
            placeholder="Cherche un album ou un artiste"
            aria-label="Chercher un album à recommander"
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="album-pick-list">
            {results.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setAlbum(a);
                  setPicking(false);
                  setQuery("");
                  field.current?.focus();
                }}
              >
                <img src={a.cover} alt="" className="cover s" />
                <span>
                  {a.title}
                  <small>{a.artist}</small>
                </span>
              </button>
            ))}
            {q.length >= 2 && found?.q === q && results.length === 0 && <p className="small">Aucun album trouvé.</p>}
          </div>
        </div>
      )}

      {album && (
        <div className="album-chosen">
          <img src={album.cover} alt="" className="cover s" />
          <span>
            <small>💿 Album à recommander</small>
            <b>{album.title}</b>
            <small>{album.artist}</small>
          </span>
          <button type="button" className="text-btn" onClick={() => setAlbum(null)} aria-label="Retirer l'album">
            ✕
          </button>
          <input type="hidden" name="album_id" value={album.id} />
        </div>
      )}

      <input type="hidden" name="to" value={to} />
      <button
        type="button"
        className="composer-btn"
        aria-label="Recommander un album"
        aria-expanded={picking}
        title="Recommander un album"
        onClick={() => setPicking(!picking)}
      >
        💿
      </button>
      <textarea
        ref={field}
        name="body"
        required={!album}
        rows={1}
        maxLength={1000}
        placeholder={album ? "Ajoute un mot (facultatif)" : "Écris un message"}
        aria-label="Ton message"
        onInput={() => {
          grow();
          onTyping?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (album || field.current?.value.trim()) form.current?.requestSubmit();
          }
        }}
      />
      <button className="send round" disabled={pending} aria-label="Envoyer">
        <Icon name="send" size={20} />
      </button>
    </form>
  );
}
