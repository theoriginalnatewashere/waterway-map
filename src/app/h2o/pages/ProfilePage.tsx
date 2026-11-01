import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/app/h2o/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { listMyReports, type WaterReport } from "@/lib/h2o/reports";
import { useI18n } from "@/i18n/LanguageProvider";
import { SUPPORTED_LANGUAGES, type AppLanguage } from "@/i18n";

type Profile = { display_name: string | null; full_name: string | null };

export function ProfilePage() {
  const navigate = useNavigate();
  const { t, language, setLanguage, formatDate } = useI18n();
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<WaterReport[] | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
      setEmail(u.user.email ?? null);
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, full_name")
        .eq("id", u.user.id)
        .maybeSingle();
      setProfile(p ?? { display_name: null, full_name: null });
      setDisplayName(p?.display_name ?? "");
      setReports(await listMyReports());
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() || null })
        .eq("id", u.user.id);
      if (error) throw error;
      toast.success(t("profile.saveSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success(t("auth.signedOut"));
    navigate({ to: "/map" });
  };

  const languageLabels: Record<AppLanguage, string> = {
    en: t("profile.languageEnglish"),
    th: t("profile.languageThai"),
  };

  const languageToggle = (
    <section>
      <h2 className="mb-2 text-sm font-semibold">{t("profile.language")}</h2>
      <div
        role="group"
        aria-label={t("profile.language")}
        className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-1.5"
      >
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = language === lang;
          return (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              aria-pressed={active}
              className={`h-11 rounded-xl text-sm font-medium transition ${
                active
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {languageLabels[lang]}
            </button>
          );
        })}
      </div>
    </section>
  );

  if (signedIn === null)
    return (
      <AppShell>
        <div className="p-8 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
      </AppShell>
    );

  if (!signedIn) {
    return (
      <AppShell>
        <div className="px-4 pt-10 pb-8 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("profile.title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("profile.signedOutBody")}</p>
            <Link
              to="/auth"
              search={{ next: "/profile" }}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-primary font-medium text-primary-foreground shadow"
            >
              {t("auth.signIn")}
            </Link>
          </div>
          {languageToggle}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 pt-5 pb-8 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("profile.title")}</h1>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5">{t("profile.displayName")}</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
              placeholder={profile?.full_name ?? t("profile.displayNamePlaceholder")}
              className="w-full h-11 rounded-2xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-foreground px-4 text-sm font-medium text-background shadow disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t("common.save")}
          </button>
        </form>
        {languageToggle}
        <section>
          <h2 className="mb-2 text-sm font-semibold">{t("profile.yourReports")}</h2>
          {reports === null ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              {t("profile.noReports")}
            </p>
          ) : (
            <ul className="space-y-2">
              {reports.map((r) => (
                <li key={r.id}>
                  <Link
                    to="/dispensers/$id"
                    params={{ id: r.dispenser_id }}
                    className="flex items-baseline justify-between rounded-2xl border border-border bg-card p-3"
                  >
                    <span className="text-sm font-medium">
                      pH {r.ph_level.toFixed(1)} · {r.tds_ppm} ppm
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(r.tested_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <button
          type="button"
          onClick={signOut}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-medium text-foreground"
        >
          <LogOut className="h-4 w-4" /> {t("auth.signOut")}
        </button>
      </div>
    </AppShell>
  );
}
