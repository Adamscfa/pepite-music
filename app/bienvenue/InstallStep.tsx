import AppPanel from "@/components/AppPanel";
import { finishOnboarding } from "./actions";

export default function InstallStep() {
  return (
    <>
      <h1>Emporte Pépite sur ton téléphone</h1>
      <p className="small">
        Ajoute Pépite à ton écran d&apos;accueil pour la retrouver comme une appli. C&apos;est facultatif : tu peux aussi
        continuer sur le site.
      </p>
      <p className="small">
        Pense aussi à activer les notifications pour être averti des messages et des réponses. Si le bouton indique
        « Notifications activées », c&apos;est déjà fait.
      </p>
      <AppPanel variant="card" loggedIn showWhenUnavailable />
      <form action={finishOnboarding} className="onboard-actions">
        <button className="btn big-btn">C&apos;est parti →</button>
      </form>
    </>
  );
}
