// Descendre au dernier message. Sur ordinateur, c'est la page qui défile ; sur téléphone,
// seule la zone des messages (.chat .thread) défile : on fait donc les deux.
export function chatScroller(): HTMLElement | null {
  const thread = document.querySelector<HTMLElement>(".chat .thread");
  return thread && thread.scrollHeight > thread.clientHeight + 1 && getComputedStyle(thread).overflowY !== "visible"
    ? thread
    : null;
}

export function scrollChatToBottom(smooth = false) {
  const behavior: ScrollBehavior = smooth ? "smooth" : "auto";
  window.scrollTo({ top: document.body.scrollHeight, behavior });
  const thread = chatScroller();
  thread?.scrollTo({ top: thread.scrollHeight, behavior });
}

// Distance (en pixels) entre ce qu'on voit et le bas de la conversation.
export function distanceFromBottom() {
  const thread = chatScroller();
  if (thread) return thread.scrollHeight - thread.scrollTop - thread.clientHeight;
  const root = document.scrollingElement ?? document.documentElement;
  return root.scrollHeight - root.scrollTop - window.innerHeight;
}
