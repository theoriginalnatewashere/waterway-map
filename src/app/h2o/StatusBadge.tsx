import type { OperatingStatus } from "@/lib/h2o/dispensers";
import { CheckCircle2, XCircle, HelpCircle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

export function useOperatingLabel() {
  const { t } = useTranslation();
  return (s: OperatingStatus) => t(`reports.status.${s}`);
}

export function OperatingStatusBadge({ status }: { status: OperatingStatus }) {
  const { t } = useTranslation();
  const cfg =
    status === "working"
      ? {
          Icon: CheckCircle2,
          cls: "bg-emerald-100 text-emerald-800",
          label: t("reports.status.working"),
        }
      : status === "out_of_service"
        ? {
            Icon: XCircle,
            cls: "bg-red-100 text-red-800",
            label: t("reports.status.out_of_service"),
          }
        : {
            Icon: HelpCircle,
            cls: "bg-muted text-muted-foreground",
            label: t("reports.status.unknown"),
          };
  const { Icon, cls, label } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}
    >
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

export function ReportFreshnessBadge({ tested_at }: { tested_at: string | null }) {
  const { t } = useTranslation();
  if (!tested_at) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <HelpCircle className="h-3 w-3" /> {t("reports.noReport")}
      </span>
    );
  }
  const outdated = Date.now() - new Date(tested_at).getTime() > 30 * 24 * 60 * 60 * 1000;
  return outdated ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
      <Clock className="h-3 w-3" /> {t("reports.outdated")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800">
      <CheckCircle2 className="h-3 w-3" /> {t("reports.recent")}
    </span>
  );
}

type TdsRating = {
  labelKey: string;
  dot: string;
  card: string;
  text: string;
  border: string;
};

const RANGES: { min: number; max: number | null; rating: TdsRating }[] = [
  {
    min: 0,
    max: 20,
    rating: {
      labelKey: "reports.quality.excellent",
      dot: "bg-emerald-500",
      card: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-200",
    },
  },
  {
    min: 21,
    max: 40,
    rating: {
      labelKey: "reports.quality.veryGood",
      dot: "bg-lime-500",
      card: "bg-lime-50",
      text: "text-lime-800",
      border: "border-lime-200",
    },
  },
  {
    min: 41,
    max: 60,
    rating: {
      labelKey: "reports.quality.good",
      dot: "bg-yellow-500",
      card: "bg-yellow-50",
      text: "text-yellow-800",
      border: "border-yellow-200",
    },
  },
  {
    min: 61,
    max: 100,
    rating: {
      labelKey: "reports.quality.inspection",
      dot: "bg-orange-500",
      card: "bg-orange-50",
      text: "text-orange-800",
      border: "border-orange-200",
    },
  },
  {
    min: 101,
    max: null,
    rating: {
      labelKey: "reports.quality.replacement",
      dot: "bg-red-500",
      card: "bg-red-50",
      text: "text-red-800",
      border: "border-red-200",
    },
  },
];

function getTdsRating(tds_ppm: number): TdsRating {
  const match = RANGES.find((r) =>
    r.max === null ? tds_ppm >= r.min : tds_ppm >= r.min && tds_ppm <= r.max,
  );
  return match?.rating ?? RANGES[RANGES.length - 1].rating;
}

export function TdsQualityCard({ tds_ppm }: { tds_ppm: number | null }) {
  const { t } = useTranslation();
  const formatRange = ({ min, max }: { min: number; max: number | null }) =>
    max === null
      ? t("reports.quality.rangeOver", { value: min - 1 })
      : t("reports.quality.range", { min, max });

  if (tds_ppm === null) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-muted" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            TDS
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{t("reports.noTds")}</p>
      </div>
    );
  }

  const rating = getTdsRating(tds_ppm);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      {/* Current reading */}
      <div className={`rounded-xl p-3 ${rating.card} ${rating.border} border`}>
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${rating.dot}`} />
          <span className={`text-[11px] font-medium uppercase tracking-wide ${rating.text}`}>
            TDS
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className={`text-4xl font-bold tracking-tight ${rating.text}`}>{tds_ppm}</span>
          <span className={`text-sm font-medium ${rating.text}`}>ppm</span>
        </div>
        <p className={`mt-0.5 text-sm font-semibold ${rating.text}`}>{t(rating.labelKey)}</p>
      </div>

      {/* Rating scale */}
      <div className="mt-3 space-y-1">
        {RANGES.map((r) => {
          const active = r.rating.labelKey === rating.labelKey;
          return (
            <div
              key={r.rating.labelKey}
              className={`flex items-center justify-between rounded-lg px-2 py-1 text-[11px] leading-tight ${
                active ? `font-semibold ${r.rating.text} ${r.rating.card}` : "text-muted-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${active ? r.rating.dot : "bg-muted"}`} />
                {formatRange(r)}
              </span>
              <span>{t(r.rating.labelKey)}</span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
        {t("reports.tdsDisclaimer")}
      </p>
    </div>
  );
}

export function ScreeningNotice() {
  const { t } = useTranslation();
  return (
    <p className="whitespace-pre-line rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-900">
      {t("reports.screeningNotice")}
    </p>
  );
}
