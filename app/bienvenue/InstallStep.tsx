import AppPanel from "@/components/AppPanel";
import { finishOnboarding } from "./actions";
import { type Locale, t } from "@/lib/i18n";

export default function InstallStep({ locale }: { locale: Locale }) {
  return (
    <>
      <h1>{t(locale, "phoneStepTitle")}</h1>
      <p className="small">{t(locale, "phoneStepInstruction")}</p>
      <p className="small">{t(locale, "notificationStepInstruction")}</p>
      <AppPanel variant="card" loggedIn showWhenUnavailable locale={locale} />
      <form action={finishOnboarding} className="onboard-actions">
        <button className="btn big-btn">{t(locale, "startNow")}</button>
      </form>
    </>
  );
}
