import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AuthorLink from "@/components/AuthorLink";
import Cover from "@/components/Cover";
import ShareButton from "@/components/ShareButton";
import { deleteList, removeFromList } from "@/app/social-actions";
import { getCurrentProfile, getList } from "@/lib/data";

async function loadList(params: PageProps<"/listes/[id]">["params"]) {
  const id = Number((await params).id);
  const list = Number.isInteger(id) && id > 0 ? await getList(id) : null;
  if (!list) notFound();
  return list;
}

export async function generateMetadata({ params }: PageProps<"/listes/[id]">): Promise<Metadata> {
  const list = await loadList(params);
  const title = `${list.title}, une liste de ${list.owner.display_name}`;
  const description = list.description || `${list.items.length} albums choisis par ${list.owner.display_name} sur Pépite.`;
  const cover = list.items[0]?.cover_url?.replace("250x250", "500x500");
  return { title, description, openGraph: { title, description, images: cover ? [cover] : undefined } };
}

export default async function ListPage({ params }: PageProps<"/listes/[id]">) {
  const list = await loadList(params);
  const me = await getCurrentProfile();
  const isMine = me?.id === list.user_id;

  return (
    <>
      <div className="feed-head">
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">Liste</div>
          <h1 style={{ fontSize: 30 }}>{list.title}</h1>
          <div className="who" style={{ marginTop: 8 }}>
            par <AuthorLink user={list.owner} /> · {list.items.length} album{list.items.length > 1 ? "s" : ""}
          </div>
          {list.description && <p style={{ margin: "6px 0 0", maxWidth: "62ch" }}>{list.description}</p>}
        </div>
        <ShareButton title={list.title} />
      </div>

      {list.items.length ? (
        <div className="grid-rated" style={{ marginTop: 20 }}>
          {list.items.map((item) => (
            <div key={item.album_id} className="fav">
              <Link href={`/album/${item.album_id}`}>
                <Cover src={item.cover_url} size="l" alt={`Pochette de ${item.album_title}`} />
                <span className="album-name">{item.album_title}</span>
                <small>{item.artist_name}</small>
              </Link>
              {isMine && (
                <form action={removeFromList}>
                  <input type="hidden" name="list_id" value={list.id} />
                  <input type="hidden" name="album_id" value={item.album_id} />
                  <button className="link-btn">Retirer</button>
                </form>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty" style={{ marginTop: 20 }}>
          {isMine
            ? "Ta liste est vide. Va sur la page d'un album et choisis « Ajouter à la liste »."
            : "Cette liste est encore vide."}
        </div>
      )}

      {isMine && (
        <form action={deleteList} style={{ marginTop: 30 }}>
          <input type="hidden" name="list_id" value={list.id} />
          <button className="link-btn danger">Supprimer cette liste</button>
        </form>
      )}
    </>
  );
}
