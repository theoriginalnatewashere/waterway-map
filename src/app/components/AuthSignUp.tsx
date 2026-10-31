import { useState, type FormEvent } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getPostAuthRedirect } from "@/lib/profileRouting";
import authIllustration from "@/assets/h2o-auth-hero.png.asset.json";
import { authCallbackUrl } from "@/lib/authRedirect";
import { useLanguage } from "@/i18n/LanguageProvider";

type Mode = "signup" | "login";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.88 0 3.14.8 3.86 1.48l2.63-2.54C16.85 3.4 14.66 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12S6.76 21.5 12 21.5c6.92 0 9.5-4.86 9.5-7.4 0-.5-.05-.88-.13-1.26H12z"
      />
    </svg>
  );
}

export function AuthSignUp() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const search = useSearch({ from: "/auth" }) as { next?: string };
  const next = search.next;
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        const emailRedirectTo = authCallbackUrl(window.location.origin, next);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo, data: { language } },
        });
        if (error) throw error;
        if (data.session && data.user) {
          toast.success(t("auth.accountCreated"));
          if (next) navigate({ href: next });
          else navigate({ to: getPostAuthRedirect(data.user.id) });
        } else {
          toast.success(t("auth.checkEmail"));
          setMode("login");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.signedIn"));
        if (next) {
          navigate({ href: next });
        } else {
          const dest = data.user ? getPostAuthRedirect(data.user.id) : "/";
          navigate({ to: dest });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      // Return to the public /auth page; it forwards signed-in users to `next`.
      const redirectTo = authCallbackUrl(window.location.origin, next);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        toast.error(error.message ?? t("auth.googleFailed"));
        setGoogleLoading(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.googleFailed"));
    } finally {
      setGoogleLoading(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-6 pt-10 pb-8 flex flex-col">
        <div className="mx-auto mt-2 mb-8 w-full overflow-hidden rounded-3xl bg-secondary/60">
          <img
            src={authIllustration.url}
            alt={t("auth.illustrationAlt")}
            className="block w-full h-auto"
          />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-center text-foreground">
          {isSignup ? t("auth.joinTitle") : t("auth.welcomeBack")}
        </h1>
        <p className="mt-3 text-center text-muted-foreground leading-relaxed text-[15px]">
          {isSignup ? t("auth.joinSubtitle") : t("auth.loginSubtitle")}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1 text-sm font-medium">
          {(["signup", "login"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`h-9 rounded-xl transition ${
                mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {m === "signup" ? t("auth.signUp") : t("auth.logIn")}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className="sr-only">{t("auth.email")}</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                className="w-full h-12 pl-10 pr-3 rounded-2xl bg-card border border-border text-[15px] outline-none focus:border-primary"
              />
            </div>
          </label>
          <label className="block">
            <span className="sr-only">{t("auth.password")}</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.password")}
                className="w-full h-12 pl-10 pr-3 rounded-2xl bg-card border border-border text-[15px] outline-none focus:border-primary"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-foreground text-background font-medium text-[15px] flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-sm disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignup ? t("auth.createAccount") : t("auth.signIn")}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          {t("common.or")}
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full h-12 rounded-2xl bg-card border border-border text-foreground font-medium text-[15px] flex items-center justify-center gap-2 active:scale-[0.99] transition disabled:opacity-60"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          {t("auth.continueWithGoogle")}
        </button>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t("auth.terms")}</p>
      </div>
    </main>
  );
}
