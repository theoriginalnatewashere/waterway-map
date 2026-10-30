import { useEffect, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, MapPin, PlusCircle, Navigation } from "lucide-react";
import { AppShell } from "@/app/h2o/BottomNav";
import { SignedImage, Lightbox } from "@/app/h2o/SignedImage";
import { OperatingStatusBadge, ReportFreshnessBadge, ScreeningNotice, TdsQualityCard } from "@/app/h2o/StatusBadge";
import { getDispenser, type Dispenser } from "@/lib/h2o/dispensers";
import { listReportsForDispenser, isOutdated, type WaterReport } from "@/lib/h2o/reports";
import { signImageUrls } from "@/lib/h2o/images";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/LanguageProvider";

export function DispenserDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { t, formatDateTime } = useI18n();
  const [d, setD] = useState<Dispenser | null | undefined>(undefined);
  const [reports, setReports] = useState<WaterReport[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    setD(undefined);
    (async () => {
      const [disp, rs, u] = await Promise.all([
        getDispenser(id),
        listReportsForDispenser(id),
        supabase.auth.getUser(),
      ]);
      setD(disp);
      // Sort by tested_at desc, fallback created_at desc
      const sorted = [...rs].sort((a, b) => {
        const ta = new Date(a.tested_at).getTime() || new Date(a.created_at).getTime();
        const tb = new Date(b.tested_at).getTime() || new Date(b.created_at).getTime();
        return tb - ta;
      });
      setReports(sorted);
      setSignedIn(!!u.data.user);
    })().catch((e) => {
      setLoadError(e?.message ?? t("dispensers.loadError"));
      setD(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openImage = async (path: string) => {
    const urls = await signImageUrls([path], 300);
    if (urls[0]) setLightboxUrl(urls[0]);
  };

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  };

  if (d === undefined) {
    return <AppShell><div className="p-8 text-center text-sm text-muted-foreground">{t("common.loading")}</div></AppShell>;
  }
  if (d === null) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {loadError ?? t("dispensers.notFound")}
          </p>
          <Link to="/dispensers" className="mt-3 inline-block text-sm font-medium text-primary">{t("common.backToList")}</Link>
        </div>
      </AppShell>
    );
  }

  const latest = reports[0] ?? null;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}`;

  return (
    <AppShell>
      <div className="relative">
        <div className="h-56 w-full bg-secondary">
          {d.image_urls[0] ? (
            <SignedImage
              path={d.image_urls[0]}
              alt={d.name}
              className="h-56 w-full object-cover"
              onClick={() => openImage(d.image_urls[0])}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <MapPin className="h-8 w-8" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={goBack}
          aria-label={t("common.back")}
          className="absolute top-3 left-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 pt-4">
        <h1 className="text-xl font-semibold tracking-tight">{d.name}</h1>
        {d.address && <p className="text-sm text-muted-foreground">{d.address}</p>}
        {d.location_description && (
          <p className="mt-1 text-sm text-muted-foreground">{d.location_description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <OperatingStatusBadge status={d.operating_status} />
          <ReportFreshnessBadge tested_at={latest?.tested_at ?? null} />
        </div>
        <div className="mt-3">
          <TdsQualityCard tds_ppm={latest?.tds_ppm ?? null} />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          {d.latitude.toFixed(5)}, {d.longitude.toFixed(5)}
        </p>

        {d.image_urls.length > 1 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {d.image_urls.slice(1).map((p) => (
              <button key={p} type="button" onClick={() => openImage(p)} className="aspect-square overflow-hidden rounded-xl bg-secondary">
                <SignedImage path={p} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {signedIn ? (
            <Link
              to="/report"
              search={{ dispenserId: d.id }}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-medium shadow"
            >
              <PlusCircle className="h-4 w-4" /> {t("dispensers.reportWaterQuality")}
            </Link>
          ) : (
            <Link
              to="/auth"
              search={{ next: `/report?dispenserId=${d.id}` }}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-medium shadow"
            >
              <PlusCircle className="h-4 w-4" /> {t("dispensers.signInToReport")}
            </Link>
          )}
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-foreground font-medium shadow-sm"
          >
            <Navigation className="h-4 w-4" /> {t("dispensers.getDirections")}
          </a>
        </div>

        <div className="mt-4"><ScreeningNotice /></div>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold">{t("reports.history", { total: reports.length })}</h2>
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
              <p className="text-sm font-medium text-foreground">{t("reports.emptyTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("reports.emptyBody")}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {reports.map((r, idx) => {
                const outdated = isOutdated(r.tested_at);
                const testedDate = new Date(r.tested_at);
                return (
                  <li key={r.id} className="rounded-2xl border border-border bg-card p-3">
                    {/* Card header: labels */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {idx === 0 && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          {t("reports.latest")}
                        </span>
                      )}
                      {outdated && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          {t("reports.outdated")}
                        </span>
                      )}
                    </div>
                    {/* 1. Operating status */}
                    <div className="mt-2">
                      <OperatingStatusBadge status={r.dispenser_status} />
                    </div>
                    {/* 2 & 3. pH and TDS */}
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">pH</p>
                        <p className="text-2xl font-bold leading-tight">{r.ph_level.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">TDS</p>
                        <p className="text-2xl font-bold leading-tight">
                          {r.tds_ppm}
                          <span className="text-sm font-normal text-muted-foreground"> ppm</span>
                        </p>
                      </div>
                    </div>
                    {/* 4. Tested date and time */}
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {t("reports.tested", { date: formatDateTime(testedDate) })}
                      {r.water_temperature_c !== null && ` · ${r.water_temperature_c}°C`}
                      {r.meter_model && ` · ${r.meter_model}`}
                    </p>
                    {/* 5. Observations / notes */}
                    <p className={`mt-2 text-sm ${r.notes ? "text-foreground" : "italic text-muted-foreground"}`}>
                      {r.notes ? r.notes : t("reports.noObservations")}
                    </p>
                    {/* 6. Photos (hidden when none) */}
                    {r.image_urls.length > 0 && (
                      <div className="mt-2 grid grid-cols-4 gap-1.5">
                        {r.image_urls.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => openImage(p)}
                            className="aspect-square overflow-hidden rounded-lg bg-secondary"
                            aria-label={t("reports.openPhoto")}
                          >
                            <SignedImage path={p} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <div className="h-6" />
      </div>
      <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </AppShell>
  );
}