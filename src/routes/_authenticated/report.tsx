import { createFileRoute } from "@tanstack/react-router";
import { ReportPage } from "@/app/h2o/pages/ReportPage";

function safeId(v: unknown): string | undefined {
  return typeof v === "string" && /^[0-9a-fA-F-]{10,}$/.test(v) ? v : undefined;
}

export const Route = createFileRoute("/_authenticated/report")({
  validateSearch: (s: Record<string, unknown>) => ({ dispenserId: safeId(s.dispenserId) }),
  component: ReportPage,
  head: () => ({
    meta: [
      { title: "Report water quality — H2O Map" },
      {
        name: "description",
        content: "Submit a pH and TDS reading for a reverse osmosis water dispenser.",
      },
      { property: "og:title", content: "Report water quality — H2O Map" },
      {
        property: "og:description",
        content: "Submit a pH and TDS reading for a reverse osmosis water dispenser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
