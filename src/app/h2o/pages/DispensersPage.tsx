import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Search, MapPin } from "lucide-react";
import { AppShell } from "@/app/h2o/BottomNav";
import { OperatingStatusBadge, ReportFreshnessBadge } from "@/app/h2o/StatusBadge";
import { SignedImage } from "@/app/h2o/SignedImage";
import { listDispensers, distanceMeters, type Dispenser } from "@/lib/h2o/dispensers";
import { listRecentReports, type WaterReport } from "@/lib/h2o/reports";
import { useI18n } from "@/i18n/LanguageProvider";

function fmtDistance(m: number) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}
export function DispensersPage() {
  const { t, formatDate } = useI18n();
  const [dispensers, setDispensers] = useState<Dispenser[] | null>(null);
  const [reports, setReports] = useState<WaterReport[]>([]);
  const [q, setQ] = useState("");
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    Promise.all([listDispensers(), listRecentReports(500)])
      .then(([d, r]) => { setDispensers(d); setReports(r); })
      .catch(() => setDispensers([]));
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { maximumAge: 60_000, timeout: 5_000 },
    );
  }, []);

  const latestByDispenser = useMemo(() => {
    const m = new Map<string, WaterReport>();
    for (const r of reports) if (!m.has(r.dispenser_id)) m.set(r.dispenser_id, r);
    return m;
  }, [reports]);

  const list = useMemo(() => {
    if (!dispensers) return [];
    const t = q.trim().toLowerCase();
    const rows = dispensers
      .filter((d) =>
        !t
          ? true
          : d.name.toLowerCase().includes(t) ||
            (d.address ?? "").toLowerCase().includes(t) ||
            (d.location_description ?? "").toLowerCase().includes(t),
      )
      .map((d) => ({
        d,
        latest: latestByDispenser.get(d.id) ?? null,
        dist: me ? distanceMeters(me, { lat: d.latitude, lng: d.longitude }) : null,
      }));
    if (me) rows.sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
    else rows.sort((a, b) => a.d.name.localeCompare(b.d.name));
    return rows;
  }, [dispensers, latestByDispenser, q, me]);

  return (
    <AppShell>
      <header className="px-4 pt-5 pb-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("dispensers.title")}</h1>
        <p className="text-xs text-muted-foreground">{t("dispensers.subtitle")}</p>
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("common.search")}
            className="w-full h-10 rounded-full border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </header>
      <div className="px-4 pb-6">
        {dispensers === null ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {t("dispensers.empty")}
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map(({ d, latest, dist }) => (
              <li key={d.id}>
                <Link
                  to="/dispensers/$id"
                  params={{ id: d.id }}
                  className="flex gap-3 rounded-2xl border border-border bg-card p-3 active:bg-secondary"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    {d.image_urls[0] ? (
                      <SignedImage path={d.image_urls[0]} alt="" className="h-16 w-16 object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center text-muted-foreground">
                        <MapPin className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold">{d.name}</p>
                      {dist !== null && (
                        <span className="shrink-0 text-[11px] text-muted-foreground">{fmtDistance(dist)}</span>
                      )}
                    </div>
                    {d.address && <p className="truncate text-xs text-muted-foreground">{d.address}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <OperatingStatusBadge status={d.operating_status} />
                      <ReportFreshnessBadge tested_at={latest?.tested_at ?? null} />
                      {latest && (
                        <span className="text-[11px] text-muted-foreground">
                          pH {latest.ph_level.toFixed(1)} · {latest.tds_ppm} ppm · {formatDate(latest.tested_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}