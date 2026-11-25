"use client";

import { useEffect, useRef, useState } from "react";
import { deezerAt } from "@/lib/images";

// Vidéos verticales du Studio (1080 × 1920), fabriquées directement dans le navigateur :
// chaque image est dessinée sur un <canvas>, puis le navigateur enregistre le canvas
// pendant la lecture (MediaRecorder). Aucun serveur vidéo, aucun outil à installer.
//   « note » : « Quel album mérite 5 étoiles ? », puis chaque album avec ses étoiles ;
//   « duel » : « Duel d'albums », puis des manches 1 contre 2 (« Commente 1 ou 2 »).
// La vidéo est muette : la musique s'ajoute dans TikTok (sons autorisés par TikTok).

export type VideoItem = { id: number; title: string; artist: string; cover: string };
export type VideoMode = "note" | "duel";
type Kind = "albums" | "titres" | "artistes";
type VideoLocale = "fr" | "en" | "es";
type SearchResults = { albums: VideoItem[]; tracks: VideoItem[] };
const MAX_VIDEO_ITEMS = 4;

const W = 1080;
const H = 1920;
const FPS = 30;
const GREEN = "#35D68A";
const YELLOW = "#FFC531";
const GREY = "rgba(255,255,255,.62)";

type RGB = [number, number, number];
type Loaded = VideoItem & { img: HTMLImageElement | null; color: RGB };
type Ctx = CanvasRenderingContext2D;
type Segment = { dur: number; draw: (ctx: Ctx, t: number, dur: number) => void };

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
// Avance de 0 à 1 entre « start » et « start + dur » (en secondes).
const step = (t: number, start: number, dur: number) => ease((t - start) / dur);

// ---------- Dessin ----------

let FONT = "system-ui, sans-serif";
const font = (weight: number, size: number) => `${weight} ${size}px ${FONT}`;

function background(ctx: Ctx, color: RGB) {
  ctx.fillStyle = "#0A0D0C";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 620, 40, W / 2, 620, 1150);
  glow.addColorStop(0, `rgba(${color.join(",")},.62)`);
  glow.addColorStop(0.55, `rgba(${color.join(",")},.16)`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

function lines(ctx: Ctx, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      out.push(line);
      line = word;
    } else line = test;
  }
  if (line) out.push(line);
  if (out.length > maxLines) {
    out.length = maxLines;
    let last = out[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    out[maxLines - 1] = `${last.trimEnd()}…`;
  }
  return out;
}

// Texte centré sur x, sur plusieurs lignes si besoin. Renvoie le y sous la dernière ligne.
function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  o: { size: number; weight?: number; color?: string; maxWidth?: number; maxLines?: number; lineHeight?: number },
) {
  ctx.font = font(o.weight ?? 800, o.size);
  ctx.fillStyle = o.color ?? "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const rows = lines(ctx, value, o.maxWidth ?? 940, o.maxLines ?? 3);
  const lh = o.size * (o.lineHeight ?? 1.18);
  rows.forEach((row, i) => ctx.fillText(row, x, y + i * lh));
  return y + (rows.length - 1) * lh;
}

function starPath(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
  }
  ctx.closePath();
}

// 5 étoiles centrées ; « value » de 0 à 5 (les étoiles se remplissent l'une après l'autre).
function stars(ctx: Ctx, cy: number, size: number, value: number) {
  const gap = size * 1.22;
  const x0 = W / 2 - gap * 2;
  for (let i = 0; i < 5; i++) {
    const cx = x0 + i * gap;
    starPath(ctx, cx, cy, size / 2);
    ctx.fillStyle = "rgba(255,255,255,.14)";
    ctx.fill();
    const fill = clamp(value - i);
    if (fill > 0) {
      ctx.save();
      starPath(ctx, cx, cy, (size / 2) * (0.7 + 0.3 * fill));
      ctx.fillStyle = YELLOW;
      ctx.globalAlpha *= fill;
      ctx.fill();
      ctx.restore();
    }
  }
}

function cover(ctx: Ctx, img: HTMLImageElement | null, x: number, y: number, size: number) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.55)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 24;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 22);
  ctx.fillStyle = "#1C2220";
  ctx.fill();
  ctx.restore();
  if (!img) return;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 22);
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

function header(ctx: Ctx, locale: VideoLocale) {
  const tagline = { fr: "Écoute · Note · Partage", en: "Listen · Rate · Share", es: "Escucha · Puntúa · Comparte" }[locale];
  text(ctx, "PÉPITE", W / 2, 135, { size: 54, color: GREEN });
  text(ctx, tagline, W / 2, 185, { size: 28, weight: 600, color: GREY });
}

function circle(ctx: Ctx, cx: number, cy: number, r: number, fill: string, label: string, color: string, size: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.font = font(800, size);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy + size * 0.04);
  ctx.textBaseline = "alphabetic";
}

// Petit effet « pop » : grossit légèrement autour d'un point puis revient à la normale.
function pop(ctx: Ctx, cx: number, cy: number, p: number, draw: () => void) {
  const s = 0.82 + 0.18 * p;
  ctx.save();
  ctx.globalAlpha *= p;
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);
  draw();
  ctx.restore();
}

// ---------- Scènes ----------

const PEPITE_GREEN: RGB = [24, 120, 74];

function outro(site: string, tags: string, line1: string, line2: string, locale: VideoLocale): Segment {
  return {
    dur: 3.6,
    draw(ctx, t) {
      background(ctx, PEPITE_GREEN);
      pop(ctx, W / 2, 660, step(t, 0, 0.5), () => text(ctx, "PÉPITE", W / 2, 700, { size: 170, color: GREEN }));
      ctx.save();
      ctx.globalAlpha *= step(t, 0.3, 0.5);
      let y = text(ctx, line1, W / 2, 820, { size: 50, weight: 700, maxWidth: 740 });
      text(ctx, line2, W / 2, y + 85, { size: 40, weight: 500, color: GREY, maxWidth: 620 });
      ctx.restore();
      pop(ctx, W / 2, 1255, step(t, 0.8, 0.45), () => {
        ctx.beginPath();
        ctx.roundRect(W / 2 - 380, 1180, 760, 150, 75);
        ctx.fillStyle = GREEN;
        ctx.fill();
        text(ctx, { fr: "Crée ton compte", en: "Create your account", es: "Crea tu cuenta" }[locale], W / 2, 1275, {
          size: 58,
          color: "#0A2A1B",
        });
      });
      ctx.save();
      ctx.globalAlpha *= step(t, 1.1, 0.5);
      y = text(ctx, site, W / 2, 1430, { size: 40, weight: 700 });
      if (tags) text(ctx, tags, W / 2, y + 66, { size: 34, weight: 500, color: GREY });
      ctx.restore();
    },
  };
}

function noteTimeline(
  items: Loaded[],
  kind: Kind,
  hook: string,
  site: string,
  tags: string,
  locale: VideoLocale,
): Segment[] {
  const intro: Segment = {
    dur: 3,
    draw(ctx, t) {
      background(ctx, PEPITE_GREEN);
      header(ctx, locale);
      ctx.save();
      ctx.globalAlpha *= step(t, 0, 0.4);
      const y = text(ctx, hook, W / 2, 830, { size: 80, maxWidth: 900 });
      ctx.restore();
      pop(ctx, W / 2, y + 140, step(t, 0.5, 0.45), () =>
        text(ctx, { fr: "5 ÉTOILES ?", en: "5 STARS?", es: "5 ESTRELLAS?" }[locale], W / 2, y + 175, {
          size: 118,
          color: YELLOW,
        }),
      );
      stars(ctx, y + 380, 104, 5 * clamp((t - 1) / 1.2));
    },
  };
  const album = (it: Loaded): Segment => ({
    dur: 2.8,
    draw(ctx, t) {
      background(ctx, it.color);
      header(ctx, locale);
      const p = step(t, 0, 0.45);
      const size = 640 * (0.9 + 0.1 * p);
      ctx.save();
      ctx.globalAlpha *= p;
      cover(ctx, it.img, (W - size) / 2, 370 + (640 - size) / 2, size);
      let y = text(ctx, it.title, W / 2, 1125, { size: 70, maxWidth: 940, maxLines: 2 });
      if (kind !== "artistes") y = text(ctx, it.artist, W / 2, y + 66, { size: 44, weight: 600, color: GREY, maxLines: 1 });
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= step(t, 0.35, 0.3);
      text(ctx, { fr: "Ta note ?", en: "Your rating?", es: "¿Tu nota?" }[locale], W / 2, y + 110, {
        size: 46,
        color: GREEN,
      });
      stars(ctx, y + 215, 100, 5 * clamp((t - 0.6) / 1.2));
      ctx.restore();
    },
  });
  const sub = locale === "en"
    ? kind === "albums" ? "Rate and review the albums you listen to" : "Rate and review the music you listen to"
    : locale === "es"
      ? kind === "albums" ? "Puntúa y reseña los álbumes que escuchas" : "Puntúa y reseña la música que escuchas"
      : kind === "albums" ? "Note et critique les albums que tu écoutes" : "Note et critique la musique que tu écoutes";
  const ending = {
    fr: "et découvre ce que la communauté écoute.",
    en: "and discover what the community is listening to.",
    es: "y descubre lo que escucha la comunidad.",
  }[locale];
  return [intro, ...items.map(album), outro(site, tags, sub, ending, locale)];
}

function duelTimeline(
  items: Loaded[],
  kind: Kind,
  site: string,
  tags: string,
  locale: VideoLocale,
  category: string,
  question: string,
  votePrompt: string,
): Segment[] {
  const intro: Segment = {
    dur: 2.4,
    draw(ctx, t) {
      background(ctx, PEPITE_GREEN);
      pop(ctx, W / 2, 800, step(t, 0, 0.45), () => text(ctx, "DUEL", W / 2, 870, { size: 200, color: YELLOW }));
      ctx.save();
      ctx.globalAlpha *= step(t, 0.3, 0.4);
      text(ctx, category, W / 2, 1020, { size: 112 });
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= step(t, 0.7, 0.4);
      text(ctx, question, W / 2, 1130, { size: 50, weight: 600, color: GREY });
      ctx.restore();
    },
  };
  const round = (a: Loaded, b: Loaded, n: number): Segment => ({
    dur: 4.2,
    draw(ctx, t) {
      // Lueur : moyenne des couleurs des deux pochettes.
      background(ctx, a.color.map((c, i) => Math.round((c + b.color[i]) / 2)) as RGB);
      header(ctx, locale);
      ctx.save();
      ctx.globalAlpha *= step(t, 0, 0.3);
      text(ctx, locale === "fr" ? `MANCHE ${n}` : locale === "es" ? `RONDA ${n}` : `ROUND ${n}`, W / 2, 330, {
        size: 64,
        color: YELLOW,
      });
      ctx.restore();
      const size = 470;
      const top = 500;
      const slide = step(t, 0.15, 0.45);
      const sides: [Loaded, number, string, string][] = [
        [a, 50 - (1 - slide) * 600, GREEN, "1"],
        [b, 560 + (1 - slide) * 600, YELLOW, "2"],
      ];
      for (const [it, x, badge, label] of sides) {
        cover(ctx, it.img, x, top, size);
        circle(ctx, x + 34, top + 34, 46, badge, label, "#0A0D0C", 54);
        const y = text(ctx, it.title, x + size / 2, top + size + 70, { size: 42, maxWidth: 450, maxLines: 2 });
        if (kind !== "artistes")
          text(ctx, it.artist, x + size / 2, y + 48, { size: 32, weight: 600, color: GREY, maxWidth: 450, maxLines: 1 });
      }
      pop(ctx, W / 2, top + size / 2, step(t, 0.55, 0.35), () => {
        ctx.beginPath();
        ctx.arc(W / 2, top + size / 2, 82, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        circle(ctx, W / 2, top + size / 2, 74, "#0A0D0C", "VS", "#FFFFFF", 62);
      });
      // « Qui gagne ? » bat doucement comme un cœur pour attirer l'œil.
      const beat = 1 + 0.04 * Math.sin(Math.max(0, t - 1.4) * 6);
      pop(ctx, W / 2, 1320, step(t, 1, 0.4), () => {
        ctx.save();
        ctx.translate(W / 2, 1320);
        ctx.scale(beat, beat);
        ctx.translate(-W / 2, -1320);
        text(ctx, { fr: "Qui gagne ?", en: "Who wins?", es: "¿Quién gana?" }[locale], W / 2, 1350, {
          size: 116,
        });
        ctx.restore();
      });
      ctx.save();
      ctx.globalAlpha *= step(t, 1.3, 0.4);
      text(ctx, votePrompt, W / 2, 1480, { size: 60, color: GREEN });
      ctx.restore();
    },
  });
  const rounds: Segment[] = [];
  for (let i = 0; i + 1 < items.length; i += 2) rounds.push(round(items[i], items[i + 1], i / 2 + 1));
  const sub = locale === "en"
    ? kind === "albums" ? "Rate your favorite albums" : "Rate your favorite music"
    : locale === "es"
      ? kind === "albums" ? "Puntúa tus álbumes favoritos" : "Puntúa tu música favorita"
      : kind === "albums" ? "Note tes albums préférés" : "Note ta musique préférée";
  const ending = {
    fr: "et vois ce que la communauté écoute.",
    en: "and see what the community is listening to.",
    es: "y mira lo que escucha la comunidad.",
  }[locale];
  return [intro, ...rounds, outro(site, tags, sub, ending, locale)];
}

// Image complète au temps t (en secondes) : la scène en cours, avec un fondu au noir
// rapide entre deux scènes.
function frame(ctx: Ctx, segments: Segment[], t: number) {
  let start = 0;
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (t < start + s.dur || i === segments.length - 1) {
      const local = Math.min(t - start, s.dur);
      ctx.save();
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      const fadeIn = i === 0 ? 1 : clamp(local / 0.25);
      const fadeOut = i === segments.length - 1 ? 1 : clamp((s.dur - local) / 0.25);
      ctx.globalAlpha = Math.min(fadeIn, fadeOut);
      s.draw(ctx, local, s.dur);
      ctx.restore();
      return;
    }
    start += s.dur;
  }
}

// ---------- Chargement des pochettes ----------

async function load(item: VideoItem): Promise<Loaded> {
  const fallback: Loaded = { ...item, img: null, color: PEPITE_GREEN };
  if (!item.cover) return fallback;
  try {
    const img = new Image();
    img.src = `/studio/cover?u=${encodeURIComponent(deezerAt(item.cover, 1000))}`;
    await img.decode();
    // Couleur moyenne de la pochette, un peu ravivée, pour la lueur du fond.
    const c = document.createElement("canvas");
    c.width = c.height = 12;
    const cx = c.getContext("2d")!;
    cx.drawImage(img, 0, 0, 12, 12);
    const d = cx.getImageData(0, 0, 12, 12).data;
    const sum = [0, 0, 0];
    for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) sum[k] += d[i + k];
    const avg = sum.map((v) => v / (d.length / 4));
    const max = Math.max(...avg, 1);
    const color = avg.map((v) => Math.round(Math.min(255, (v / max) * 170))) as RGB;
    return { ...item, img, color };
  } catch {
    return fallback;
  }
}

function pickMime() {
  const options = [
    "video/mp4;codecs=avc1.42E028",
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm",
  ];
  return options.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) ?? "";
}

// ---------- Composant ----------

export default function StudioVideo({
  mode,
  items,
  kind,
  defaultHook,
  defaultDuelCategory,
  defaultDuelQuestion,
  defaultDuelVote,
  locale,
  site,
  tags,
  caption,
}: {
  mode: VideoMode;
  items: VideoItem[];
  kind: Kind;
  defaultHook: string;
  defaultDuelCategory: string;
  defaultDuelQuestion: string;
  defaultDuelVote: string;
  locale: VideoLocale;
  site: string;
  tags: string;
  caption: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const loaded = useRef<Loaded[] | null>(null);
  const playing = useRef(0);
  const [videoItems, setVideoItems] = useState(items);
  const [searchQuery, setSearchQuery] = useState("");
  const [completedQuery, setCompletedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VideoItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hook, setHook] = useState(defaultHook);
  const [duelQuestion, setDuelQuestion] = useState(defaultDuelQuestion);
  const [duelVote, setDuelVote] = useState(defaultDuelVote);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Chargement des pochettes…");
  const [result, setResult] = useState<{ url: string; file: File } | null>(null);
  const [copied, setCopied] = useState(false);

  const timeline = () =>
    mode === "duel"
      ? duelTimeline(loaded.current ?? [], kind, site, tags, locale, defaultDuelCategory, duelQuestion, duelVote)
      : noteTimeline(loaded.current ?? [], kind, hook, site, tags, locale);
  const total = (segments: Segment[]) => segments.reduce((s, x) => s + x.dur, 0);
  const currentCaption =
    mode === "duel"
      ? caption.replace(defaultDuelQuestion, duelQuestion).replace(defaultDuelVote, duelVote)
      : caption;

  useEffect(() => {
    const q = searchQuery.trim();
    if (kind === "artistes" || q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Recherche Deezer impossible (${response.status})`);
        const data = (await response.json()) as SearchResults;
        if (controller.signal.aborted) return;
        const matches = kind === "albums" ? data.albums : data.tracks;
        setSearchResults(Array.isArray(matches) ? matches : []);
        setCompletedQuery(q);
      } catch {
        if (controller.signal.aborted) return;
        setSearchResults([]);
        setCompletedQuery(q);
        setSearchError("La recherche n’a pas abouti. Vérifie ta connexion et réessaie.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [kind, searchQuery]);

  // Police du site (Plus Jakarta Sans), pochettes, puis première image.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      FONT = getComputedStyle(document.body).fontFamily || FONT;
      await Promise.all([500, 600, 700, 800].map((w) => document.fonts.load(font(w, 60), "ÉéÀàç?"))).catch(() => {});
      const list = await Promise.all(videoItems.map(load));
      if (cancelled) return;
      loaded.current = list;
      const segments =
        mode === "duel"
          ? duelTimeline(
              list,
              kind,
              site,
              tags,
              locale,
              defaultDuelCategory,
              defaultDuelQuestion,
              defaultDuelVote,
            )
          : noteTimeline(list, kind, defaultHook, site, tags, locale);
      setDuration(total(segments));
      setReady(true);
      const missing = list.filter((l) => !l.img).length;
      setStatus(missing ? `${missing} pochette(s) indisponible(s) : une case vide les remplace.` : "");
    })();
    return () => {
      cancelled = true;
      playing.current++;
    };
  }, [
    defaultDuelCategory,
    defaultDuelQuestion,
    defaultDuelVote,
    defaultHook,
    kind,
    locale,
    mode,
    site,
    tags,
    videoItems,
  ]);

  // Image fixe d'aperçu quand rien ne joue (et quand l'accroche change).
  useEffect(() => {
    if (!ready || busy) return;
    const ctx = canvas.current?.getContext("2d");
    if (ctx) frame(ctx, timeline(), mode === "duel" ? 3.6 : 2.4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hook, duelQuestion, duelVote, locale, busy]);

  // Joue la vidéo une fois sur le canvas ; se termine à la fin (ou si on relance).
  function play(): Promise<void> {
    const ctx = canvas.current!.getContext("2d")!;
    const segments = timeline();
    const length = total(segments);
    const id = ++playing.current;
    const start = performance.now();
    return new Promise((resolve) => {
      const tick = () => {
        if (id !== playing.current) return resolve();
        const t = (performance.now() - start) / 1000;
        frame(ctx, segments, Math.min(t, length));
        if (t >= length) return resolve();
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  async function preview() {
    setBusy(true);
    await play();
    setBusy(false);
  }

  async function record() {
    const mime = pickMime();
    if (!mime || !canvas.current?.captureStream) {
      setStatus("Ce navigateur ne sait pas enregistrer de vidéo. Essaie avec Chrome (ordinateur ou Android).");
      return;
    }
    setBusy(true);
    setResult(null);
    setStatus("Enregistrement en cours… Garde cette page ouverte et visible jusqu'à la fin.");
    try {
      const stream = canvas.current.captureStream(FPS);
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const stopped = new Promise((r) => (recorder.onstop = r));
      recorder.start(250);
      await play();
      // Garde la dernière image un court instant pour qu'elle soit bien dans le fichier.
      await new Promise((r) => setTimeout(r, 300));
      recorder.stop();
      await stopped;
      stream.getTracks().forEach((tr) => tr.stop());
      const type = mime.split(";")[0];
      const ext = type === "video/mp4" ? "mp4" : "webm";
      const blob = new Blob(chunks, { type });
      const file = new File([blob], `pepite-${mode}.${ext}`, { type });
      if (result) URL.revokeObjectURL(result.url);
      setResult({ url: URL.createObjectURL(blob), file });
      setStatus(
        ext === "mp4"
          ? "Vidéo prête."
          : "Vidéo prête au format WebM (ce navigateur ne fait pas le MP4). TikTok l'accepte depuis un ordinateur ; sur téléphone, préfère Chrome Android à jour.",
      );
    } catch {
      setStatus("L'enregistrement n'a pas marché. Réessaie, ou essaie avec Chrome.");
    }
    setBusy(false);
  }

  async function save() {
    if (!result) return;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (touch && navigator.canShare?.({ files: [result.file] })) {
      try {
        await navigator.share({ files: [result.file] });
      } catch {
        // Partage annulé.
      }
      return;
    }
    const a = document.createElement("a");
    a.href = result.url;
    a.download = result.file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function copy() {
    await navigator.clipboard.writeText(currentCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function replaceVideoItems(next: VideoItem[]) {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setReady(false);
    setStatus("Chargement des pochettes…");
    setVideoItems(next);
  }

  function addVideoItem(item: VideoItem) {
    if (busy || videoItems.length >= MAX_VIDEO_ITEMS || videoItems.some((selected) => selected.id === item.id)) {
      return;
    }
    replaceVideoItems([...videoItems, item]);
  }

  const validSelection =
    videoItems.length > 0 &&
    (mode !== "duel" || (videoItems.length >= 2 && videoItems.length % 2 === 0));
  const length = ready && validSelection ? Math.round(duration) : 0;

  return (
    <div className="studio-video">
      <canvas ref={canvas} width={W} height={H} className="studio-video-canvas" />
      <div className="studio-video-side">
        {kind === "artistes" ? (
          <p className="small">Pour choisir toi-même les contenus, sélectionne « Albums » ou « Titres » dans le type du Studio.</p>
        ) : (
          <section className="studio-video-picker" aria-label="Choix des albums et titres de la vidéo">
            <div className="studio-video-picker-head">
              <strong>{kind === "albums" ? "Albums de la vidéo" : "Titres de la vidéo"}</strong>
              <span className="small">{videoItems.length}/{MAX_VIDEO_ITEMS}</span>
            </div>
            <p className="small">
              Les premières propositions sont déjà choisies. Retire celles que tu ne veux pas, puis ajoute tes choix.
              L’ordre de sélection sera celui de la vidéo.
            </p>
            <button
              type="button"
              className="btn ghost"
              onClick={() => replaceVideoItems([])}
              disabled={busy || videoItems.length === 0}
            >
              Tout retirer
            </button>
            <label className="studio-video-search">
              Rechercher {kind === "albums" ? "un album" : "un titre"}
              <input
                type="search"
                value={searchQuery}
                placeholder={kind === "albums" ? "Nom de l’album ou de l’artiste" : "Nom du titre ou de l’artiste"}
                autoComplete="off"
                maxLength={100}
                disabled={busy}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCompletedQuery("");
                  setSearchResults([]);
                  setSearchError("");
                  setSearching(false);
                }}
              />
            </label>
            {searching && <p className="small" role="status">Recherche en cours…</p>}
            {searchError && <p className="error" role="alert">{searchError}</p>}
            {completedQuery === searchQuery.trim() && !searching && !searchError && searchResults.length === 0 && (
              <p className="small">Aucun résultat trouvé.</p>
            )}
            {searchResults.length > 0 && (
              <ul className="studio-video-picker-list" aria-label="Résultats de recherche">
                {searchResults.map((item) => {
                  const alreadySelected = videoItems.some((selected) => selected.id === item.id);
                  return (
                    <li key={item.id}>
                      <div className="studio-video-choice">
                        <img src={item.cover} alt="" />
                        <span className="studio-video-choice-text">
                          <strong>{item.title}</strong>
                          <small>{item.artist}</small>
                        </span>
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={() => addVideoItem(item)}
                          disabled={busy || alreadySelected || videoItems.length >= MAX_VIDEO_ITEMS}
                        >
                          {alreadySelected ? "Ajouté" : "Ajouter"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {videoItems.length > 0 && (
              <ol className="studio-video-picker-list" aria-label="Éléments choisis pour la vidéo">
                {videoItems.map((item, index) => (
                  <li key={`${item.id}-${index}`}>
                    <div className="studio-video-choice">
                      <img src={item.cover} alt="" />
                      <span className="studio-video-choice-text">
                        <strong>{index + 1}. {item.title}</strong>
                        <small>{item.artist}</small>
                      </span>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => replaceVideoItems(videoItems.filter((_, i) => i !== index))}
                        disabled={busy}
                        aria-label={`Retirer ${item.title} de la vidéo`}
                      >
                        Retirer
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {mode === "duel" && !validSelection && (
              <p className="small" role="status">Un duel nécessite 2 ou 4 titres ou albums.</p>
            )}
          </section>
        )}
        {mode === "note" && (
          <label className="field studio-video-hook">
            Accroche (avant « 5 étoiles ? »)
            <input value={hook} onChange={(e) => setHook(e.target.value)} maxLength={60} disabled={busy} />
          </label>
        )}
        {mode === "duel" && (
          <>
            <label className="field studio-video-hook">
              Question du duel
              <input value={duelQuestion} onChange={(e) => setDuelQuestion(e.target.value)} maxLength={54} disabled={busy} />
            </label>
            <label className="field studio-video-hook">
              Consigne de vote
              <input value={duelVote} onChange={(e) => setDuelVote(e.target.value)} maxLength={40} disabled={busy} />
            </label>
          </>
        )}
        <p className="small">
          Vidéo muette de {length || "…"} secondes, en 1080 × 1920. Ajoute la musique dans TikTok au moment de publier.
          L&apos;enregistrement se fait en direct : il prend autant de temps que la vidéo.
        </p>
        <div className="studio-actions">
          <button className="btn ghost" onClick={preview} disabled={!ready || !validSelection || busy}>
            ▶ Aperçu
          </button>
          <button className="btn" onClick={record} disabled={!ready || !validSelection || busy}>
            {busy ? "En cours…" : "● Enregistrer la vidéo"}
          </button>
          {result && (
            <button className="btn" onClick={save}>
              Télécharger la vidéo
            </button>
          )}
        </div>
        {status && <p className="small">{status}</p>}
        {result && <video src={result.url} controls playsInline className="studio-video-result" />}
        <div className="studio-caption">
          <textarea readOnly value={currentCaption} rows={6} aria-label="Texte de la publication" />
          <button className="btn ghost" onClick={copy}>
            {copied ? "Copié ✓" : "Copier le texte"}
          </button>
        </div>
      </div>
    </div>
  );
}
