import { createFileRoute } from "@tanstack/react-router";
import { MapPage } from "@/app/h2o/pages/MapPage";

export const Route = createFileRoute("/")({
  ssr: false,
  component: MapPage,
  head: () => ({
    meta: [
      { title: "H2O Map — Find reverse osmosis water dispensers near you" },
      {
        name: "description",
        content:
          "Browse a community map of reverse osmosis water dispensers with real pH and TDS readings from neighbours.",
      },
      { property: "og:title", content: "H2O Map — Find reverse osmosis water dispensers near you" },
      {
        property: "og:description",
        content:
          "Browse a community map of reverse osmosis water dispensers with real pH and TDS readings from neighbours.",
      },
    ],
  }),
});
