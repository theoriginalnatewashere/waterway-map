import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
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
  const { data, error } = await supabase
    .from("profiles")
    .select("language")
    .eq("id", u.user.id)
    .maybeSingle();
  if (error) throw error;
  const value = (data as { language?: string } | null)?.language;
  return isAppLanguage(value) ? value : null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const revision = useRef(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

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
      const requestedRevision = ++revision.current;
      loadProfileLanguage()
        .then((lang) => {
          if (!cancelled && lang && revision.current === requestedRevision) {
            applyLanguage(lang);
            storeLanguage(lang);
          }
        })
        .catch(() => {
          /* fall back to local preference */
        });
    };
    sync();
    // Defer Supabase calls until its auth callback releases the session lock.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        void saveQueue.current.then(() => {
          if (!cancelled) sync();
        });
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [applyLanguage]);

  const setLanguage = useCallback(
    (lang: AppLanguage) => {
      revision.current += 1;
      applyLanguage(lang);
      if (!storeLanguage(lang)) toast.error(i18n.t("profile.languageLocalSaveError"));
      // Serialize writes so a slow earlier request cannot overwrite the latest choice.
      saveQueue.current = saveQueue.current.then(async () => {
        try {
          const { data: u, error: authError } = await supabase.auth.getUser();
          if (authError && authError.name !== "AuthSessionMissingError") throw authError;
          if (!u.user) return;
          const { data, error } = await supabase
            .from("profiles")
            .update({ language: lang })
            .eq("id", u.user.id)
            .select("language")
            .single();
          if (error) throw error;
          if (data.language !== lang) throw new Error("Language save was not confirmed");
        } catch {
          toast.error(i18n.t("profile.languageSaveError"));
        }
      });
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
