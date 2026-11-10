"use client";

import { useActionState } from "react";
import { reviewVideo } from "./actions";

const initialState: { error?: string; success?: string } = {};

export default function VideoReview({ id }: { id: string }) {
  const [state, action, pending] = useActionState(reviewVideo, initialState);

  return (
    <div className="video-review">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="decision" value="approved" />
        <button className="btn" type="submit" disabled={pending}>
          Approuver
        </button>
      </form>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="decision" value="rejected" />
        <button className="btn danger-btn" type="submit" disabled={pending}>
          Refuser
        </button>
      </form>
      {state.error && <p className="small error" role="alert">{state.error}</p>}
      {state.success && <p className="small" role="status">{state.success}</p>}
    </div>
  );
}
