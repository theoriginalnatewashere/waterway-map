import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/app/h2o/BottomNav";
import { PhotoPicker, type PhotoDraft } from "@/app/h2o/PhotoPicker";
import { ScreeningNotice } from "@/app/h2o/StatusBadge";
import { listDispensers, type Dispenser, type OperatingStatus } from "@/lib/h2o/dispensers";
import { uploadDispenserImages } from "@/lib/h2o/images";
import { createReport } from "@/lib/h2o/reports";
import { useTranslation } from "react-i18next";
import { reportSchema } from "@/lib/h2o/validation";

function nowLocalInput(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ReportPage() {
  const search = useSearch({ from: "/_authenticated/report" }) as { dispenserId?: string };
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [dispensers, setDispensers] = useState<Dispenser[] | null>(null);
  const [dispenserId, setDispenserId] = useState<string>(search.dispenserId ?? "");
  const [q, setQ] = useState("");

  const [ph, setPh] = useState<string>("7.0");
  const [tds, setTds] = useState<string>("");
  const [temp, setTemp] = useState<string>("");
  const [meter, setMeter] = useState<string>("");
  const [status, setStatus] = useState<OperatingStatus>("working");
  const [testedAt, setTestedAt] = useState<string>(nowLocalInput());
  const [notes, setNotes] = useState<string>("");
  const [directly, setDirectly] = useState<boolean>(true);
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listDispensers().then(setDispensers).catch(() => setDispensers([]));
  }, []);

  const chosen = useMemo(
    () => dispensers?.find((d) => d.id === dispenserId) ?? null,
    [dispensers, dispenserId],
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!dispensers) return [];
    if (!t) return dispensers.slice(0, 20);
    return dispensers
      .filter((d) => d.name.toLowerCase().includes(t) || (d.address ?? "").toLowerCase().includes(t))
      .slice(0, 20);
  }, [dispensers, q]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!dispenserId) return toast.error(t("validation.chooseDispenser"));
    const phNum = Number(ph);
    const tdsNum = Number(tds);
    if (!Number.isFinite(phNum) || phNum < 0 || phNum > 14) return toast.error(t("validation.phRange"));
    if (!Number.isInteger(tdsNum) || tdsNum < 0 || tdsNum > 5000) return toast.error(t("validation.tdsRange"));
    if (temp !== "" && (!Number.isFinite(Number(temp)) || Number(temp) < -10 || Number(temp) > 100)) return toast.error(t("validation.temperatureRange"));
    if (!directly) return toast.error(t("validation.directOutlet"));
    setSubmitting(true);
    try {
      reportSchema.parse({ dispenser_id: dispenserId, ph_level: phNum, tds_ppm: tdsNum, tested_at: testedAt, water_temperature_c: temp === "" ? null : Number(temp), meter_model: meter, notes, dispenser_status: status, tested_directly_from_outlet: directly });
      const image_urls = await uploadDispenserImages(photos.map((p) => p.file));
      await createReport({
        dispenser_id: dispenserId,
        ph_level: phNum,
        tds_ppm: tdsNum,
        tested_at: new Date(testedAt).toISOString(),
        water_temperature_c: temp === "" ? null : Number(temp),
        meter_model: meter,
        dispenser_status: status,
        notes,
        image_urls,
        tested_directly_from_outlet: directly,
      });
      toast.success(t("reports.form.success"));
      navigate({ to: "/dispensers/$id", params: { id: dispenserId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("validation.reportFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <form onSubmit={submit} className="px-4 pt-5 pb-8 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("reports.form.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("reports.form.subtitle")}</p>
        </div>
        <ScreeningNotice />

        <div>
          <label className="block text-xs font-semibold mb-1.5">{t("reports.form.dispenser")}</label>
          {chosen ? (
            <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{chosen.name}</p>
                {chosen.address && <p className="truncate text-[11px] text-muted-foreground">{chosen.address}</p>}
              </div>
              <button type="button" onClick={() => setDispenserId("")} className="text-xs font-medium text-primary">{t("common.change")}</button>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("reports.form.searchPlaceholder")}
                  className="w-full h-10 rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" />
              </div>
              <ul className="mt-2 max-h-56 overflow-auto">
                {(dispensers === null ? [] : filtered).map((d) => (
                  <li key={d.id}>
                    <button type="button" onClick={() => setDispenserId(d.id)}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary">
                      <span className="block font-medium">{d.name}</span>
                      {d.address && <span className="block text-[11px] text-muted-foreground">{d.address}</span>}
                    </button>
                  </li>
                ))}
                {dispensers && filtered.length === 0 && (
                  <li className="px-3 py-2 text-xs text-muted-foreground">
                    {t("reports.form.noMatches")}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5">{t("reports.form.phLabel")}</label>
            <input type="number" step="0.1" min={0} max={14} required value={ph} onChange={(e) => setPh(e.target.value)}
              className="w-full h-11 rounded-2xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{t("reports.form.tdsLabel")}</label>
            <input type="number" step="1" min={0} max={5000} required value={tds} onChange={(e) => setTds(e.target.value)}
              className="w-full h-11 rounded-2xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{t("reports.form.tempLabel")}</label>
            <input type="number" step="0.1" min={-10} max={100} value={temp} onChange={(e) => setTemp(e.target.value)}
              className="w-full h-11 rounded-2xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">{t("reports.form.meterLabel")}</label>
            <input value={meter} onChange={(e) => setMeter(e.target.value)} maxLength={120} placeholder={t("reports.form.meterPlaceholder")}
              className="w-full h-11 rounded-2xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">{t("reports.form.testedAt")}</label>
          <input type="datetime-local" required value={testedAt} onChange={(e) => setTestedAt(e.target.value)}
            className="w-full h-11 rounded-2xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">{t("reports.form.dispenserStatus")}</label>
          <div className="grid grid-cols-3 gap-2">
            {(["working", "out_of_service", "unknown"] as OperatingStatus[]).map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)}
                className={`h-10 rounded-xl border text-xs font-medium ${status === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                {t(`reports.status.${s}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">{t("reports.form.notes")}</label>
          <textarea rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder={t("reports.form.notesPlaceholder")}
            className="w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary" />
        </div>

        <PhotoPicker photos={photos} onChange={setPhotos} onError={toast.error} />

        <label className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-xs">
          <input type="checkbox" checked={directly} onChange={(e) => setDirectly(e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>{t("reports.form.directly")}</span>
        </label>

        <button type="submit" disabled={submitting || !dispenserId}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-foreground text-background font-medium shadow disabled:opacity-60">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />} {t("reports.form.submit")}
        </button>
      </form>
    </AppShell>
  );
}