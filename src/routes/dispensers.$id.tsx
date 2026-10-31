import { createFileRoute } from "@tanstack/react-router";
import { DispenserDetailPage } from "@/app/h2o/pages/DispenserDetailPage";

function Component() {
  const { id } = Route.useParams();
  return <DispenserDetailPage id={id} />;
}

export const Route = createFileRoute("/dispensers/$id")({
  ssr: false,
  component: Component,
  head: () => ({
    meta: [
      { title: "Dispenser — H2O Map" },
      { name: "description", content: "See recent pH and TDS reports for this reverse osmosis water dispenser." },
      { property: "og:title", content: "Dispenser — H2O Map" },
      { property: "og:description", content: "Community reports of pH and TDS for a reverse osmosis water dispenser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});