"use client";

import { useState } from "react";

type Slide = { src: string; name: string; label: string };

// Envoyer 12 grandes images d'un coup au menu de partage échoue sur beaucoup de
// téléphones. On les convertit donc en JPEG de haute qualité (4 à 5 fois plus légères)
// et on les enregistre par paquets de 4.
const BATCH = 4;

async function toJpeg(slide: Slide): Promise<File> {
  const png = await (await fetch(slide.src, { cache: "force-cache" })).blob();
  const bitmap = await createImageBitmap(png);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  const jpeg = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("jpeg"))), "image/jpeg", 0.95),
  );
  return new File([jpeg], `${slide.name}.jpg`, { type: "image/jpeg" });
}

function download(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default function StudioSlides({ slides, caption }: { slides: Slide[]; caption: string }) {
  const [status, setStatus] = useState("");
  const [done, setDone] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const batches: Slide[][] = [];
  for (let i = 0; i < slides.length; i += BATCH) batches.push(slides.slice(i, i + BATCH));

  async function save(list: Slide[], index: number) {
    setStatus("Préparation…");
    try {
      const files = await Promise.all(list.map(toJpeg));
      const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
      if (isTouchDevice && navigator.canShare?.({ files })) {
        await navigator.share({ files });
      } else {
        for (const f of files) {
          download(f);
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      setDone((d) => new Set(d).add(index));
      setStatus("");
    } catch (error) {
      setStatus(
        error instanceof DOMException && error.name === "AbortError"
          ? ""
          : "Ça n'a pas marché. Réessaie, ou enregistre l’image depuis son menu.",
      );
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <p className="small">
        Sur ordinateur, les images sont téléchargées. Sur téléphone, le menu de partage s&apos;ouvre : choisis
        « Enregistrer » ou « Galerie ».
      </p>
      <div className="studio-actions">
        {batches.map((b, i) => {
          const from = i * BATCH + 1;
          return (
            <button key={i} className={done.has(i) ? "btn ghost" : "btn"} onClick={() => save(b, i)}>
              {done.has(i) ? "✓ " : ""}Images {from} à {from + b.length - 1}
            </button>
          );
        })}
      </div>
      {status && <p className="small">{status}</p>}

      <div className="studio-caption">
        <textarea readOnly value={caption} rows={6} aria-label="Texte de la publication" />
        <button className="btn ghost" onClick={copy}>
          {copied ? "Copié ✓" : "Copier le texte"}
        </button>
      </div>

      <div className="studio-slides">
        {slides.map((s, i) => (
          <figure key={s.src}>
            <button type="button" className="studio-one" onClick={() => save([s], -1 - i)} title="Enregistrer cette image">
              <img src={s.src} alt={s.label} loading={i < 6 ? "eager" : "lazy"} width={1080} height={1920} />
            </button>
            <figcaption>{s.label}</figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
