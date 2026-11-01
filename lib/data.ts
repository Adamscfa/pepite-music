import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import { hasSupabaseConfig } from "./supabase/config";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  // Membre de démonstration (fichier 06-comptes-demo.sql), affiché avec l'étiquette « Démo ».
  is_demo?: boolean;
};

export type Author = Pick<Profile, "username" | "display_name" | "avatar_url" | "is_demo">;

export type Review = {
  id: number;
  user_id: string;
  album_id: number;
  album_title: string;
  artist_name: string;
  cover_url: string | null;
  release_year: number | null;
  // Rempli quand l'avis porte sur une chanson plutôt que sur l'album entier.
  track_id: number | null;
  track_title: string | null;
  rating: number;
  body: string;
  // Coup de cœur : le membre adore vraiment.
  heart: boolean;
  updated_at: string;
  profile: Author;
  likes: number;
  liked: boolean;
  comments: number;
  reactions: Reaction[];
  // Les deux derniers commentaires, affichés sous l'avis dans le fil.
  preview: Comment[];
};

export const EMOJIS = ["🔥", "😂", "😢", "💎"] as const;
export type Reaction = { emoji: string; count: number; mine: boolean };

export type Comment = {
  id: number;
  body: string;
  created_at: string;
  user_id: string;
  // Commentaire auquel celui-ci répond (null pour un commentaire de premier niveau).
  parent_id: number | null;
  profile: Author;
  likes: number;
  liked: boolean;
};

export type AlbumRef = {
  album_id: number;
  album_title: string;
  artist_name: string;
  cover_url: string | null;
};

export type Favorite = AlbumRef & { position: number };

export type List = {
  id: number;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  items: (AlbumRef & { added_at: string })[];
};

// "*" plutôt qu'une liste de colonnes : la page marche même si une colonne manque encore.
const REVIEW_FIELDS = "*, profile:profiles!reviews_user_id_fkey!inner(*)";

type RawReview = Omit<Review, "likes" | "liked" | "comments" | "reactions" | "profile" | "preview"> & {
  profile: Profile;
  hidden?: boolean;
};

const author = (p: Profile): Author => ({
  username: p.username,
  display_name: p.display_name,
  avatar_url: p.avatar_url ?? null,
  is_demo: Boolean(p.is_demo),
});

// Le membre connecté et son profil, ou null. Mis en cache le temps d'une requête.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (!hasSupabaseConfig) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return profile ? { ...profile, avatar_url: profile.avatar_url ?? null } : null;
});

// Ajoute à chaque avis ses « j'aime », commentaires et réactions, et retire les avis masqués.
// Requêtes séparées : si ces tables n'existent pas encore, les avis s'affichent quand même.
async function withSocial(raw: RawReview[] | null): Promise<Review[]> {
  const reviews = (raw ?? []).filter((r) => !r.hidden);
  if (!reviews.length) return [];
  const supabase = await createClient();
  const ids = reviews.map((r) => r.id);
  const [me, likes, comments, reactions] = await Promise.all([
    getCurrentProfile(),
    supabase.from("review_likes").select("review_id, user_id").in("review_id", ids),
    supabase
      .from("review_comments")
      .select("*, profile:profiles!inner(*)")
      .in("review_id", ids)
      .order("created_at", { ascending: false })
      .returns<RawComment[]>(),
    supabase.from("review_reactions").select("review_id, user_id, emoji").in("review_id", ids),
  ]);
  return reviews.map((r) => {
    const mine = (likes.data ?? []).filter((l) => l.review_id === r.id);
    const reacts = (reactions.data ?? []).filter((x) => x.review_id === r.id);
    return {
      ...r,
      track_id: r.track_id ?? null,
      track_title: r.track_title ?? null,
      heart: Boolean(r.heart),
      profile: author(r.profile),
      likes: mine.length,
      liked: Boolean(me && mine.some((l) => l.user_id === me.id)),
      comments: (comments.data ?? []).filter((c) => c.review_id === r.id).length,
      preview: (comments.data ?? [])
        .filter((c) => c.review_id === r.id && !c.parent_id)
        .slice(0, 2)
        .reverse()
        .map((c) => toComment(c, [], me?.id)),
      reactions: EMOJIS.map((emoji) => {
        const of = reacts.filter((x) => x.emoji === emoji);
        return { emoji, count: of.length, mine: Boolean(me && of.some((x) => x.user_id === me.id)) };
      }),
    };
  });
}

export async function getRecentReviews({ followedBy }: { followedBy?: string } = {}): Promise<Review[]> {
  if (!hasSupabaseConfig) return [];
  const supabase = await createClient();
  let query = supabase.from("reviews").select(REVIEW_FIELDS).order("updated_at", { ascending: false }).limit(50);
  if (followedBy) {
    const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", followedBy);
    const ids = (follows ?? []).map((f) => f.following_id);
    if (!ids.length) return [];
    query = query.in("user_id", ids);
  }
  const { data } = await query.returns<RawReview[]>();
  return withSocial(data);
}

// Avis sur l'album entier (sans ceux qui portent sur une de ses chansons).
export async function getAlbumReviews(albumId: number): Promise<Review[]> {
  if (!hasSupabaseConfig) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_FIELDS)
    .eq("album_id", albumId)
    .order("updated_at", { ascending: false })
    .returns<RawReview[]>();
  return withSocial((data ?? []).filter((r) => !r.track_id));
}

export async function getTrackReviews(trackId: number): Promise<Review[]> {
  if (!hasSupabaseConfig) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_FIELDS)
    .eq("track_id", trackId)
    .order("updated_at", { ascending: false })
    .returns<RawReview[]>();
  return withSocial(data);
}

export async function getUserReviews(userId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_FIELDS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .returns<RawReview[]>();
  return withSocial(data);
}

export const getReview = cache(async (id: number): Promise<Review | null> => {
  if (!hasSupabaseConfig) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select(REVIEW_FIELDS).eq("id", id).returns<RawReview[]>();
  const [review] = await withSocial(data);
  return review ?? null;
});

type RawComment = Omit<Comment, "profile" | "likes" | "liked" | "parent_id"> & {
  review_id: number;
  parent_id?: number | null;
  profile: Profile;
};

function toComment(c: RawComment, likes: { comment_id: number; user_id: string }[], meId?: string): Comment {
  const mine = likes.filter((l) => l.comment_id === c.id);
  return {
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    user_id: c.user_id,
    parent_id: c.parent_id ?? null,
    profile: author(c.profile),
    likes: mine.length,
    liked: Boolean(meId && mine.some((l) => l.user_id === meId)),
  };
}

// Tous les commentaires d'un avis, réponses comprises (rangées ensuite par la page).
export async function getComments(reviewId: number): Promise<Comment[]> {
  const supabase = await createClient();
  const [me, { data }] = await Promise.all([
    getCurrentProfile(),
    supabase
      .from("review_comments")
      .select("*, profile:profiles!inner(*)")
      .eq("review_id", reviewId)
      .order("created_at", { ascending: true })
      .returns<RawComment[]>(),
  ]);
  const raw = data ?? [];
  // Si le fichier 05 n'a pas encore été exécuté, la table n'existe pas : 0 j'aime partout.
  const { data: likes } = raw.length
    ? await supabase
        .from("comment_likes")
        .select("comment_id, user_id")
        .in(
          "comment_id",
          raw.map((c) => c.id),
        )
    : { data: [] };
  return raw.map((c) => toComment(c, likes ?? [], me?.id));
}

export const getProfileByUsername = cache(async (username: string): Promise<Profile | null> => {
  if (!hasSupabaseConfig) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
  return data ? { ...data, avatar_url: data.avatar_url ?? null } : null;
});

export async function getFavorites(userId: string): Promise<Favorite[]> {
  if (!hasSupabaseConfig) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("favorites").select("*").eq("user_id", userId).order("position");
  return data ?? [];
}

export async function getFollowStats(userId: string, meId?: string) {
  const supabase = await createClient();
  const [followers, following, mine] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    meId
      ? supabase.from("follows").select("follower_id").eq("follower_id", meId).eq("following_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return { followers: followers.count ?? 0, following: following.count ?? 0, iFollow: Boolean(mine.data) };
}

const LIST_FIELDS = "*, items:list_items(album_id, album_title, artist_name, cover_url, added_at)";

const sortItems = (list: List): List => ({
  ...list,
  items: [...list.items].sort((a, b) => a.added_at.localeCompare(b.added_at)),
});

export async function getUserLists(userId: string): Promise<List[]> {
  if (!hasSupabaseConfig) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("lists")
    .select(LIST_FIELDS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<List[]>();
  return (data ?? []).map(sortItems);
}

export const getList = cache(async (id: number): Promise<(List & { owner: Author }) | null> => {
  if (!hasSupabaseConfig) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("lists")
    .select(`${LIST_FIELDS}, owner:profiles!inner(*)`)
    .eq("id", id)
    .returns<(List & { owner: Profile })[]>();
  const list = data?.[0];
  return list ? { ...sortItems(list), owner: author(list.owner) } : null;
});

// ---- Classement Pépite : les albums les mieux notés par les membres ----

export type RankedAlbum = AlbumRef & { average: number; count: number };

export async function getTopRatedAlbums(limit = 12): Promise<RankedAlbum[]> {
  if (!hasSupabaseConfig) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .is("track_id", null)
    .order("updated_at", { ascending: false })
    .limit(2000);
  const byAlbum = new Map<number, RankedAlbum>();
  for (const r of (data ?? []) as RawReview[]) {
    if (r.hidden) continue;
    const a = byAlbum.get(r.album_id) ?? {
      album_id: r.album_id,
      album_title: r.album_title,
      artist_name: r.artist_name,
      cover_url: r.cover_url,
      average: 0,
      count: 0,
    };
    a.average = (a.average * a.count + r.rating) / (a.count + 1);
    a.count += 1;
    byAlbum.set(r.album_id, a);
  }
  // Une moyenne pondérée : un seul 5 étoiles ne passe pas devant dix 4,5.
  const score = (a: RankedAlbum) => (a.average * a.count + 3 * 2) / (a.count + 2);
  return [...byAlbum.values()].sort((a, b) => score(b) - score(a)).slice(0, limit);
}

// ---- Notifications ----

export type Notification = {
  id: number;
  kind: "like" | "comment" | "reply" | "follow" | "reaction" | "message" | "recommend";
  review_id: number | null;
  emoji: string | null;
  read_at: string | null;
  created_at: string;
  actor: Author;
  review: { album_title: string; track_title: string | null } | null;
};

export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*, actor:profiles!notifications_actor_id_fkey!inner(*), review:reviews(album_title, track_title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60)
    .returns<(Omit<Notification, "actor"> & { actor: Profile })[]>();
  return (data ?? []).map((n) => ({ ...n, actor: author(n.actor) }));
}

// Nombre de notifications et de messages pas encore lus, pour les pastilles du menu.
export const getUnreadCounts = cache(async (userId: string) => {
  const supabase = await createClient();
  const [notifs, messages] = await Promise.all([
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .is("read_at", null),
  ]);
  return { notifications: notifs.count ?? 0, messages: messages.count ?? 0 };
});

// ---- Amis et messages privés ----

// On est amis quand l'un des deux est abonné à l'autre.
export async function getFriends(userId: string): Promise<(Author & { id: string })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id, following_id")
    .or(`follower_id.eq.${userId},following_id.eq.${userId}`);
  const ids = [...new Set((data ?? []).map((f) => (f.follower_id === userId ? f.following_id : f.follower_id)))];
  if (!ids.length) return [];
  const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids).order("display_name");
  return (profiles ?? []).map((p: Profile) => ({ id: p.id, ...author(p) }));
}

export async function areFriends(a: string, b: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .or(`and(follower_id.eq.${a},following_id.eq.${b}),and(follower_id.eq.${b},following_id.eq.${a})`)
    .limit(1);
  return Boolean(data?.length);
}

export type Message = {
  id: number;
  sender_id: string;
  recipient_id: string;
  body: string;
  album_id: number | null;
  album_title: string | null;
  artist_name: string | null;
  cover_url: string | null;
  read_at: string | null;
  created_at: string;
};

export type Conversation = { friend: Author & { id: string }; last: Message; unread: number };

export async function getConversations(userId: string): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<Message[]>();
  const byFriend = new Map<string, { last: Message; unread: number }>();
  for (const m of data ?? []) {
    const other = m.sender_id === userId ? m.recipient_id : m.sender_id;
    const c = byFriend.get(other) ?? { last: m, unread: 0 };
    if (m.recipient_id === userId && !m.read_at) c.unread += 1;
    byFriend.set(other, c);
  }
  if (!byFriend.size) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", [...byFriend.keys()]);
  return (profiles ?? [])
    .map((p: Profile) => ({ friend: { id: p.id, ...author(p) }, ...byFriend.get(p.id)! }))
    .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
}

export async function getThread(userId: string, otherId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`)
    .order("created_at", { ascending: true })
    .limit(300)
    .returns<Message[]>();
  return data ?? [];
}

// ---- Goûts en commun ----

export type SharedRating = {
  album_id: number;
  track_id: number | null;
  title: string;
  artist_name: string;
  cover_url: string | null;
  mine: number;
  theirs: number;
};

// Ce que deux membres ont noté tous les deux, et un pourcentage de goûts en commun :
// 100 % si toutes les notes sont identiques, 0 % si elles sont toujours opposées (1 contre 5).
export async function getSharedRatings(meId: string, otherId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select("*").in("user_id", [meId, otherId]).returns<RawReview[]>();
  const key = (r: RawReview) => `${r.album_id}-${r.track_id ?? ""}`;
  const mine = new Map((data ?? []).filter((r) => r.user_id === meId).map((r) => [key(r), r]));
  const shared: SharedRating[] = [];
  for (const r of data ?? []) {
    const m = r.user_id === otherId ? mine.get(key(r)) : undefined;
    if (!m) continue;
    shared.push({
      album_id: r.album_id,
      track_id: r.track_id ?? null,
      title: r.track_title ?? r.album_title,
      artist_name: r.artist_name,
      cover_url: r.cover_url,
      mine: m.rating,
      theirs: r.rating,
    });
  }
  const match = shared.length
    ? Math.round((shared.reduce((s, x) => s + (1 - Math.abs(x.mine - x.theirs) / 4), 0) / shared.length) * 100)
    : null;
  return { shared, match };
}

// ---- Pépite de la semaine ----

export type WeeklyAlbum = AlbumRef & { votes: number };

// Lundi de la semaine (en UTC, comme la base), au format AAAA-MM-JJ.
export function weekStart(offsetWeeks = 0): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) - 7 * offsetWeeks);
  return d.toISOString().slice(0, 10);
}

function tally(rows: (AlbumRef & { created_at: string })[]): WeeklyAlbum[] {
  const byAlbum = new Map<number, WeeklyAlbum & { first: string }>();
  for (const r of rows) {
    const a = byAlbum.get(r.album_id) ?? { ...r, votes: 0, first: r.created_at };
    a.votes += 1;
    if (r.created_at < a.first) a.first = r.created_at;
    byAlbum.set(r.album_id, a);
  }
  // À égalité, l'album qui a reçu son premier vote le plus tôt passe devant.
  return [...byAlbum.values()]
    .sort((a, b) => b.votes - a.votes || a.first.localeCompare(b.first))
    .map((a) => ({
      album_id: a.album_id,
      album_title: a.album_title,
      artist_name: a.artist_name,
      cover_url: a.cover_url,
      votes: a.votes,
    }));
}

export async function getWeeklyPepite(meId?: string) {
  if (!hasSupabaseConfig) return { current: [], lastWinner: null, myVote: null };
  const supabase = await createClient();
  const [thisWeek, lastWeek] = await Promise.all([
    supabase.from("weekly_votes").select("*").eq("week", weekStart()),
    supabase.from("weekly_votes").select("*").eq("week", weekStart(1)),
  ]);
  const current = tally(thisWeek.data ?? []);
  const myVote: number | null = (thisWeek.data ?? []).find((v) => v.user_id === meId)?.album_id ?? null;
  return { current, lastWinner: tally(lastWeek.data ?? [])[0] ?? null, myVote };
}

// ---- Accueil et Explorer ----

export type Contributor = Author & { count: number };

// Les membres qui ont publié le plus d'avis.
export async function getTopContributors(limit = 3): Promise<Contributor[]> {
  if (!hasSupabaseConfig) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_FIELDS)
    .order("updated_at", { ascending: false })
    .limit(3000)
    .returns<{ user_id: string; hidden?: boolean; profile: Profile }[]>();
  const byUser = new Map<string, Contributor>();
  for (const r of data ?? []) {
    if (r.hidden) continue;
    const c = byUser.get(r.user_id) ?? { ...author(r.profile), count: 0 };
    c.count += 1;
    byUser.set(r.user_id, c);
  }
  return [...byUser.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export type Discussed = {
  album_id: number;
  album_title: string;
  artist_name: string;
  cover_url: string | null;
  track_id: number | null;
  track_title: string | null;
  comments: number;
  reviews: number;
};

// Les titres (ou albums) dont on parle le plus : avis + commentaires reçus.
export async function getMostDiscussed({ tracks, limit = 8 }: { tracks: boolean; limit?: number }) {
  if (!hasSupabaseConfig) return [];
  const supabase = await createClient();
  let query = supabase.from("reviews").select("*").order("updated_at", { ascending: false }).limit(2000);
  query = tracks ? query.not("track_id", "is", null) : query.is("track_id", null);
  const { data } = await query.returns<RawReview[]>();
  const reviews = (data ?? []).filter((r) => !r.hidden);
  if (!reviews.length) return [];
  const { data: comments } = await supabase
    .from("review_comments")
    .select("review_id")
    .in(
      "review_id",
      reviews.map((r) => r.id),
    );
  const countByReview = new Map<number, number>();
  for (const c of comments ?? []) countByReview.set(c.review_id, (countByReview.get(c.review_id) ?? 0) + 1);
  const byItem = new Map<number, Discussed>();
  for (const r of reviews) {
    const key = tracks ? r.track_id! : r.album_id;
    const item = byItem.get(key) ?? {
      album_id: r.album_id,
      album_title: r.album_title,
      artist_name: r.artist_name,
      cover_url: r.cover_url,
      track_id: r.track_id ?? null,
      track_title: r.track_title ?? null,
      comments: 0,
      reviews: 0,
    };
    item.reviews += 1;
    item.comments += countByReview.get(r.id) ?? 0;
    byItem.set(key, item);
  }
  return [...byItem.values()]
    .sort((a, b) => b.comments - a.comments || b.reviews - a.reviews)
    .slice(0, limit);
}

// Nombre d'avis Pépite par album, pour une liste d'albums.
export async function getReviewCounts(albumIds: number[]): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  if (!hasSupabaseConfig || !albumIds.length) return counts;
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select("album_id").in("album_id", albumIds);
  for (const r of data ?? []) counts.set(r.album_id, (counts.get(r.album_id) ?? 0) + 1);
  return counts;
}
