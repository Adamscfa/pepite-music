import { cookies, headers } from "next/headers";
import { detectLocale, isLocale, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const saved = cookieStore.get("pepite_locale")?.value;
  return isLocale(saved) ? saved : detectLocale(requestHeaders.get("accept-language"));
}
