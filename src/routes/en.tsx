import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/app/h2o/landing/LandingPage";
import { landingHead } from "@/app/h2o/landing/content";

export const Route = createFileRoute("/en")({
  component: EnglishLanding,
  head: () => landingHead("en"),
});

function EnglishLanding() {
  return <LandingPage language="en" />;
}
