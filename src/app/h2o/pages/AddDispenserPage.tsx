import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, MapPin, Crosshair } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/app/h2o/BottomNav";
import { MapView } from "@/app/h2o/MapView";
import { PhotoPicker, type PhotoDraft } from "@/app/h2o/PhotoPicker";
import { uploadDispenserImages } from "@/lib/h2o/images";
import { createDispenser, type OperatingStatus } from "@/lib/h2o/dispensers";
import { useTranslation } from "react-i18next";

export function AddDispenserPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<OperatingStatus>("working");
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const bestAccuracyRef = useRef<number>(Number.POSITIVE_INFINITY);

  // Sample geolocation for a short window and keep the reading with the
  // smallest accuracy value. Works around single-shot readings on mobile
  // that often return a coarse cell/wifi fix before the GPS chip warms up.
  const sampleBestLocation = (opts: { silent?: boolean } = {}) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      if (!opts.silent) toast.error(t("validation.geolocationUnavailable"));
      return;
    }
    setLocating(true);
    bestAccuracyRef.current = Number.POSITIVE_INFINITY;
    let watchId: number | null = null;
    let stopTimer: ReturnType<typeof setTimeout> | null = null;
    let gotAny = false;

    const stop = () => {
      if (watchId !== null) {
        try { navigator.geolocation.clearWatch(watchId); } catch { /* noop */ }
        watchId = null;
      }
      if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
      setLocating(false);
      if (!gotAny && !opts.silent) toast.error(t("validation.locationFailed"));
    };

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          gotAny = true;
          const acc = pos.coords.accuracy ?? Number.POSITIVE_INFINITY;
          if (acc < bestAccuracyRef.current) {
            bestAccuracyRef.current = acc;
            setPicked({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
          // Good enough — stop early to save battery.
          if (acc <= 10) stop();
        },
        (err) => {
          if (!gotAny && !opts.silent) {
            const msg =
              err.code === 1
                ? t("validation.locationDenied")
                : err.code === 3
                ? t("validation.locationTimeout")
                : t("validation.locationFailed");
            toast.error(msg);
          }
          stop();
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
      );
    } catch {
      stop();
      return;
    }

    // Sample for up to 8s, then keep the best reading.
    stopTimer = setTimeout(stop, 8_000);
  };

  useEffect(() => {
    sampleBestLocation({ silent: true });
    // Cleanup handled by stop() inside sampleBestLocation via its own timer;
    // no additional teardown needed on unmount for a short-lived watch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => sampleBestLocation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim()) return toast.error(t("validation.nameRequired"));
    if (!picked) return toast.error(t("validation.locationRequired"));
    setSubmitting(true);
    try {
      const image_urls = await uploadDispenserImages(photos.map((p) => p.file));
      const created = await createDispenser({
        name,
        address,
        location_description: description,
        latitude: picked.lat,
        longitude: picked.lng,
        operating_status: status,
        image_urls,
      });
      toast.success(t("dispensers.add.success"));
      navigate({ to: "/dispensers/$id", params: { id: created.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("validation.dispenserFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <form onSubmit={submit} className="px-4 pt-5 pb-8 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("dispensers.add.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("dispensers.add.subtitle")}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">{t("dispensers.add.name")}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120}
            placeholder={t("dispensers.add.namePlaceholder")}
            className="w-full h-11 rounded-2xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">{t("dispensers.add.address")}</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200}
            placeholder={t("dispensers.add.addressPlaceholder")}
            className="w-full h-11 rounded-2xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">{t("dispensers.add.description")}</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} rows={2}
            placeholder={t("dispensers.add.descriptionPlaceholder")}
            className="w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold">{t("dispensers.add.locationOnMap")}</label>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
              {locating ? t("dispensers.add.locating") : t("dispensers.add.useMyLocation")}
            </button>
          </div>
          <MapView markers={[]} pickedLocation={picked}
            onPickLocation={(lat, lng) => setPicked({ lat, lng })}
            initialCenter={picked ?? undefined} height="40vh" />
          <p className="mt-1 text-[11px] text-muted-foreground">{t("dispensers.add.mapHint")}</p>
          {picked && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              <MapPin className="inline h-3 w-3" /> {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
              {Number.isFinite(bestAccuracyRef.current) && (
                <> · ±{Math.round(bestAccuracyRef.current)}m</>
              )}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">{t("dispensers.add.operatingStatus")}</label>
          <div className="grid grid-cols-3 gap-2">
            {(["working", "out_of_service", "unknown"] as OperatingStatus[]).map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)}
                className={`h-10 rounded-xl border text-xs font-medium ${status === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                {t(`reports.status.${s}`)}
              </button>
            ))}
          </div>
        </div>

        <PhotoPicker photos={photos} onChange={setPhotos} onError={toast.error} />

        <button type="submit" disabled={submitting}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-foreground text-background font-medium shadow disabled:opacity-60">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />} {t("dispensers.add.submit")}
        </button>
      </form>
    </AppShell>
  );
}