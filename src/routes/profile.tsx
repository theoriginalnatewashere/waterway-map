import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/app/h2o/pages/ProfilePage";

export const Route = createFileRoute("/profile")({
  ssr: false,
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Your profile — H2O Map" },
      { name: "description", content: "Your H2O Map contributions and account settings." },
    ],
  }),
});
