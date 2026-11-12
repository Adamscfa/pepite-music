"use client";

import { useEffect, useState } from "react";
import { distanceFromBottom, scrollChatToBottom } from "./scroll";

// Flèche ronde en bas de la conversation, comme sur WhatsApp : elle apparaît dès qu'on
// remonte dans les messages, et ramène au dernier message d'un toucher.
export default function ScrollDown() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const update = () => setShow(distanceFromBottom() > 240);
    const thread = document.querySelector(".chat .thread");
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    thread?.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      thread?.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <button
      type="button"
      className={`chat-down${show ? " show" : ""}`}
      onClick={() => scrollChatToBottom(true)}
      aria-label="Descendre au dernier message"
      title="Descendre au dernier message"
      tabIndex={show ? 0 : -1}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
