import { createFileRoute } from "@tanstack/react-router";
import { AddDispenserPage } from "@/app/h2o/pages/AddDispenserPage";

export const Route = createFileRoute("/_authenticated/dispensers/new")({
  component: AddDispenserPage,
  head: () => ({
    meta: [
      { title: "Add dispenser — H2O Map" },
      { name: "description", content: "Add a reverse osmosis water dispenser to the H2O Map." },
      { property: "og:title", content: "Add dispenser — H2O Map" },
      { property: "og:description", content: "Add a reverse osmosis water dispenser to the H2O Map." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
