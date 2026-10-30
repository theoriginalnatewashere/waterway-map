import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./en";
import { th } from "./th";

export const SUPPORTED_LANGUAGES = ["en", "th"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = "h2o.language";

export function isAppLanguage(v: unknown): v is AppLanguage {
  return v === "en" || v === "th";
}

/** Stored preference → browser/device language → English. */
export function detectInitialLanguage(): AppLanguage {
  try {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isAppLanguage(stored)) return stored;
    }
  } catch {
    // ignore storage failures (private mode)
  }
  try {
    if (typeof navigator !== "undefined") {
      const langs = [navigator.language, ...(navigator.languages ?? [])];
      if (langs.some((l) => typeof l === "string" && l.toLowerCase().startsWith("th"))) return "th";
    }
  } catch {
    // ignore
  }
  return "en";
}

export function storeLanguage(lang: AppLanguage) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, th: { translation: th } },
    lng: "en", // real preference applied on the client after hydration
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export const localeTag: Record<AppLanguage, string> = { en: "en-US", th: "th-TH" };

export default i18n;