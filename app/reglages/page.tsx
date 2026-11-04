import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle, { type Theme } from "@/components/ThemeToggle";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: t(locale, "settings") };
}

export default async function SettingsPage() {
  const [locale, cookieStore] = await Promise.all([getLocale(), cookies()]);
  const theme = (cookieStore.get("theme")?.value ?? "auto") as Theme;

  return (
    <div className="legal-narrow account-settings">
      <div className="eyebrow">{t(locale, "accountSettings")}</div>
      <h1>{t(locale, "settings")}</h1>
      <section className="box account-setting">
        <div>
          <h2>{t(locale, "language")}</h2>
          <p className="small">{t(locale, "languageDescription")}</p>
        </div>
        <LanguageSelector locale={locale} />
        <p className="small">{t(locale, "languageSaved")}</p>
      </section>
      <section className="box account-setting">
        <div>
          <h2>{t(locale, "theme")}</h2>
          <p className="small">{t(locale, "themeDescription")}</p>
        </div>
        <ThemeToggle initial={theme} withLabel locale={locale} />
      </section>
      <Link href="/reglages/bloques" className="link-under">
        {t(locale, "blockedMembers")}
      </Link>
    </div>
  );
}
