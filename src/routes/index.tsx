import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/app/h2o/landing/LandingPage";
import { landingHead } from "@/app/h2o/landing/content";

export const Route = createFileRoute("/")({
  component: ThaiLanding,
  head: () => landingHead("th"),
});

function ThaiLanding() {
  return <LandingPage language="th" />;
}
