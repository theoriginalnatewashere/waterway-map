import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Loader2, Navigation, Droplet, Lock, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export const LOCATION_ONBOARDED_PREFIX = "h2o.locationOnboarded:";
export const AUTO_LOCATE_KEY = "h2o.autoLocate";

function Row({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start py-3">
      <div className="h-10 w-10 shrink-0 rounded-full bg-secondary flex items-center justify-center">
        <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={2.2} />
      </div>
      <div className="flex-1 pt-0.5">
        <h3 className="text-[14px] font-semibold text-foreground leading-snug">{title}</h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground leading-snug">{desc}</p>
      </div>
    </div>
  );
}

export function LocationIntro({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [requesting, setRequesting] = useState(false);

  function markOnboarded() {
    try {
      localStorage.setItem(LOCATION_ONBOARDED_PREFIX + userId, "1");
    } catch {
      // ignore
    }
  }

  function goToMap(autoLocate: boolean) {
    try {
      if (autoLocate) sessionStorage.setItem(AUTO_LOCATE_KEY, "1");
      else sessionStorage.removeItem(AUTO_LOCATE_KEY);
    } catch {
      // ignore
    }
    navigate({ to: "/", replace: true });
  }

  function handleAllow() {
    if (requesting) return;
    markOnboarded();
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      goToMap(false);
      return;
    }
    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setRequesting(false);
        goToMap(true);
      },
      () => {
        setRequesting(false);
        goToMap(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  function handleSkip() {
    markOnboarded();
    goToMap(false);
  }

  return (
    <main className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-5 pt-8 pb-8 flex flex-col">
        <div className="mx-auto mb-6 flex h-44 w-full max-w-xs items-center justify-center rounded-3xl bg-secondary/60">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-card border border-border shadow-sm">
            <MapPin className="h-9 w-9 text-primary" strokeWidth={2.2} />
            <span className="absolute inset-0 -m-3 rounded-full border border-dashed border-primary/30" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-center text-foreground">
          {t("onboarding.title")}
        </h1>
        <p className="mt-3 text-center text-muted-foreground leading-relaxed text-[15px]">
          {t("onboarding.subtitle")}
        </p>

        <section className="mt-6 rounded-3xl bg-card border border-border p-4 divide-y divide-border">
          <Row icon={Navigation} title={t("onboarding.centerTitle")} desc={t("onboarding.centerDesc")} />
          <Row icon={Droplet} title={t("onboarding.nearbyTitle")} desc={t("onboarding.nearbyDesc")} />
          <Row icon={Lock} title={t("onboarding.privateTitle")} desc={t("onboarding.privateDesc")} />
        </section>

        <button
          type="button"
          onClick={handleAllow}
          disabled={requesting}
          className="mt-6 w-full h-13 py-3.5 rounded-2xl bg-foreground text-background font-medium text-[15px] flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-sm disabled:opacity-70"
        >
          {requesting ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <MapPin className="h-[18px] w-[18px]" strokeWidth={2.2} />
          )}
          {requesting ? t("onboarding.requesting") : t("onboarding.allow")}
        </button>

        <button
          type="button"
          onClick={handleSkip}
          disabled={requesting}
          className="mt-3 w-full h-12 rounded-2xl text-foreground font-medium text-[15px] flex items-center justify-center hover:bg-secondary transition disabled:opacity-70"
        >
          {t("onboarding.notNow")}
        </button>
      </div>
    </main>
  );
}