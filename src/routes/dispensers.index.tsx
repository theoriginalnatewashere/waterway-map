import { createFileRoute } from "@tanstack/react-router";
import { DispensersPage } from "@/app/h2o/pages/DispensersPage";

export const Route = createFileRoute("/dispensers/")({
  ssr: false,
  component: DispensersPage,
  head: () => ({
    meta: [
      { title: "Dispensers — H2O Map" },
      { name: "description", content: "Browse community-added reverse osmosis water dispensers with latest pH and TDS readings." },
      { property: "og:title", content: "Dispensers — H2O Map" },
      { property: "og:description", content: "Community-added reverse osmosis water dispensers with pH and TDS readings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});