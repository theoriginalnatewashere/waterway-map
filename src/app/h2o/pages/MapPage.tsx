import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Loader2, Search, Crosshair } from "lucide-react";
import { AppShell } from "@/app/h2o/BottomNav";
import { MapView, MapLegend, markerFromDispenser } from "@/app/h2o/MapView";
import { listDispensers, type Dispenser } from "@/lib/h2o/dispensers";
import { listRecentReports, type WaterReport } from "@/lib/h2o/reports";
import { supabase } from "@/integrations/supabase/client";
import { AUTO_LOCATE_KEY } from "@/app/h2o/LocationIntro";
import { useTranslation } from "react-i18next";

export function MapPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [dispensers, setDispensers] = useState<Dispenser[] | null>(null);
  const [reports, setReports] = useState<WaterReport[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [q, setQ] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [d, r, u] = await Promise.all([
        listDispensers(),
        listRecentReports(300),
        supabase.auth.getUser(),
      ]);
      setDispensers(d);
      setReports(r);
      setSignedIn(!!u.data.user);
    })().catch(() => setDispensers([]));
  }, []);

  // Auto-center on the user when we can do so silently:
  // 1. Just came from the location onboarding with permission granted.
  // 2. Returning user whose browser already has geolocation permission granted.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof navigator === "undefined" || !navigator.geolocation) return;
      let shouldLocate = false;
      try {
        if (sessionStorage.getItem(AUTO_LOCATE_KEY) === "1") {
          sessionStorage.removeItem(AUTO_LOCATE_KEY);
          shouldLocate = true;
        }
      } catch {
        // ignore
      }
      if (!shouldLocate) {
        try {
          const perms = (navigator as Navigator & { permissions?: Permissions }).permissions;
          if (perms?.query) {
            const status = await perms.query({ name: "geolocation" as PermissionName });
            if (status.state === "granted") shouldLocate = true;
          }
        } catch {
          // Permissions API unavailable — do not prompt.
        }
      }
      if (!cancelled && shouldLocate) handleLocateMe();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLocateMe() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocateError(t("map.errors.unsupported"));
      return;
    }
    setIsLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      (err) => {
        let message = t("map.errors.generic");
        if (err.code === 1) message = t("map.errors.denied");
        else if (err.code === 2) message = t("map.errors.unavailable");
        else if (err.code === 3) message = t("map.errors.timeout");
        setLocateError(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  const latestByDispenser = useMemo(() => {
    const m = new Map<string, WaterReport>();
    for (const r of reports) if (!m.has(r.dispenser_id)) m.set(r.dispenser_id, r);
    return m;
  }, [reports]);

  const filtered = useMemo(() => {
    if (!dispensers) return [];
    const t = q.trim().toLowerCase();
    if (!t) return dispensers;
    return dispensers.filter(
      (d) =>
        d.name.toLowerCase().includes(t) ||
        (d.address ?? "").toLowerCase().includes(t) ||
        (d.location_description ?? "").toLowerCase().includes(t),
    );
  }, [dispensers, q]);

  const markers = useMemo(
    () => filtered.map((d) => markerFromDispenser(d, latestByDispenser.get(d.id) ?? null)),
    [filtered, latestByDispenser],
  );

  return (
    <AppShell>
      <header className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("map.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("map.subtitle")}</p>
          </div>
          <Link
            to={signedIn ? "/dispensers/new" : "/auth"}
            search={signedIn ? undefined : { next: "/dispensers/new" }}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow"
          >
            <Plus className="h-4 w-4" /> {t("map.add")}
          </Link>
        </div>
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("map.searchPlaceholder")}
            className="w-full h-10 rounded-full border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </header>
      <div className="px-4">
        <div className="relative">
          {dispensers === null ? (
            <div className="flex h-[60vh] items-center justify-center rounded-xl bg-secondary/40">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <MapView
              markers={markers}
              onSelect={(id) => navigate({ to: "/dispensers/$id", params: { id } })}
              currentLocation={currentLocation}
            />
          )}
          {dispensers !== null && (
            <div className="absolute bottom-4 right-4 z-[1000] flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                aria-label={t("map.locateMe")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-background text-foreground shadow-lg border border-border active:scale-95 transition disabled:opacity-70"
              >
                {isLocating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Crosshair className="h-5 w-5" />
                )}
              </button>
              {locateError && (
                <div className="max-w-[220px] rounded-2xl bg-card/95 border border-border p-3 text-xs text-destructive shadow">
                  {locateError}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-3"><MapLegend /></div>
        <p className="mt-4 mb-6 text-[11px] text-muted-foreground">{t("map.disclaimer")}</p>
      </div>
    </AppShell>
  );
}