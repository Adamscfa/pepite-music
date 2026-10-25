import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";

// "/profil" mène à son propre profil, ou à la connexion.
export default async function MyProfilePage() {
  const me = await getCurrentProfile();
  redirect(me ? `/profil/${me.username}` : "/connexion");
}
