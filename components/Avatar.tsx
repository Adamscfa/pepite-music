import { avatarColor } from "@/lib/format";

export default function Avatar({ username, name }: { username: string; name: string }) {
  return (
    <span className="avatar" style={{ background: avatarColor(username) }} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
