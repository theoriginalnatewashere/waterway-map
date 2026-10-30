import { createFileRoute, redirect } from "@tanstack/react-router";
import { LocationIntro } from "@/app/h2o/LocationIntro";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/welcome-location")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { userId: data.user.id };
  },
  head: () => ({
    meta: [
      { title: "Enable location — H2O Map" },
      { name: "description", content: "Allow location access to see reverse osmosis water dispensers near you." },
    ],
  }),
  component: WelcomeLocationPage,
});

function WelcomeLocationPage() {
  const { userId } = Route.useRouteContext();
  return <LocationIntro userId={userId} />;
}