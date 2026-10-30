import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n, {
  detectInitialLanguage,
  isAppLanguage,
  localeTag,
  storeLanguage,
  type AppLanguage,
} from "@/i18n";
import { supabase } from "@/integrations/supabase/client";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  locale: string;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  locale: "en-US",
});

async function loadProfileLanguage(): Promise<AppLanguage | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase.from("profiles").select("language").eq("id", u.user.id).maybeSingle();
  const value = (data as { language?: string } | null)?.language;
  return isAppLanguage(value) ? value : null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  const applyLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    void i18n.changeLanguage(lang);
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, []);

  // 1. Local/browser preference on first client render.
  useEffect(() => {
    applyLanguage(detectInitialLanguage());
  }, [applyLanguage]);

  // 2. Signed-in profile preference overrides local/browser.
  useEffect(() => {
    let cancelled = false;
    const sync = () => {
      loadProfileLanguage()
        .then((lang) => {
          if (!cancelled && lang) {
            applyLanguage(lang);
            storeLanguage(lang);
          }
        })
        .catch(() => {
          /* fall back to local preference */
        });
    };
    sync();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") sync();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [applyLanguage]);

  const setLanguage = useCallback(
    (lang: AppLanguage) => {
      applyLanguage(lang);
      storeLanguage(lang);
      void (async () => {
        try {
          const { data: u } = await supabase.auth.getUser();
          if (!u.user) return;
          await supabase.from("profiles").update({ language: lang }).eq("id", u.user.id);
        } catch {
          // local preference still applies
        }
      })();
    },
    [applyLanguage],
  );

  const value = useMemo(
    () => ({ language, setLanguage, locale: localeTag[language] }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Translation + locale-aware date helpers in one hook. */
export function useI18n() {
  const { t } = useTranslation();
  const { locale, language, setLanguage } = useLanguage();
  const formatDate = useCallback(
    (value: string | Date, opts?: Intl.DateTimeFormatOptions) =>
      new Date(value).toLocaleDateString(locale, opts),
    [locale],
  );
  const formatDateTime = useCallback(
    (value: string | Date, opts?: Intl.DateTimeFormatOptions) =>
      new Date(value).toLocaleString(locale, opts),
    [locale],
  );
  return { t, locale, language, setLanguage, formatDate, formatDateTime };
}