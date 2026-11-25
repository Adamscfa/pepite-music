"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";

const LocaleContext = createContext<Locale>("fr");

export default function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
