import { voteWeekly } from "@/app/social-actions";

// Bouton « Pépite de la semaine » sur la page d'un album.
export default function WeeklyVote({ albumId, myVote }: { albumId: number; myVote: number | null }) {
  const votedHere = myVote === albumId;
  return (
    <form action={voteWeekly}>
      <input type="hidden" name="album_id" value={albumId} />
      {votedHere && <input type="hidden" name="remove" value="1" />}
      <button className={votedHere ? "btn gold" : "btn ghost"}>
        {votedHere ? "💎 Ta Pépite de la semaine" : "💎 Voter Pépite de la semaine"}
      </button>
      <p className="small" style={{ margin: "6px 0 0" }}>
        {votedHere
          ? "Clique à nouveau pour retirer ton vote."
          : myVote
            ? "Tu as déjà voté pour un autre album : ton vote ira à celui-ci."
            : "Un vote par semaine, pour ta plus belle découverte."}
      </p>
    </form>
  );
}
