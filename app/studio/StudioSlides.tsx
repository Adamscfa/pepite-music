"use client";

import { useState } from "react";

type Slide = { src: string; name: string; label: string };

// Aperçu des images, texte à copier, et un bouton pour tout enregistrer d'un coup :
// sur téléphone, le menu de partage s'ouvre (Enregistrer les images, ou TikTok directement) ;
// sur ordinateur, les images se téléchargent une par une.
export default function StudioSlides({ slides, caption }: { slides: Slide[]; caption: string }) {
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);

  async function files() {
    return Promise.all(
      slides.map(async (s) => {
        const blob = await (await fetch(s.src, { cache: "force-cache" })).blob();
        return new File([blob], `${s.name}.png`, { type: "image/png" });
      }),
    );
  }

  function download(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function saveAll() {
    setStatus("Préparation des images…");
    try {
      const list = await files();
      if (navigator.canShare?.({ files: list })) {
        setStatus("");
        await navigator.share({ files: list });
        return;
      }
      for (const f of list) {
        download(f);
        await new Promise((r) => setTimeout(r, 400));
      }
      setStatus("Images téléchargées ✓");
    } catch (error) {
      setStatus(error instanceof DOMException && error.name === "AbortError" ? "" : "Échec, réessaie dans un instant.");
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="studio-actions">
        <button className="btn" onClick={saveAll}>
          Enregistrer les {slides.length} images
        </button>
        {status && <span className="small">{status}</span>}
      </div>

      <div className="studio-caption">
        <textarea readOnly value={caption} rows={6} aria-label="Texte de la publication" />
        <button className="btn ghost" onClick={copy}>
          {copied ? "Copié ✓" : "Copier le texte"}
        </button>
      </div>

      <div className="studio-slides">
        {slides.map((s, i) => (
          <figure key={s.src}>
            <a href={s.src} download={`${s.name}.png`} title="Télécharger cette image">
              <img src={s.src} alt={s.label} loading={i < 6 ? "eager" : "lazy"} width={1080} height={1920} />
            </a>
            <figcaption>{s.label}</figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
