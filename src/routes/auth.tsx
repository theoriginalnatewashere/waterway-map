import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthSignUp } from "@/app/components/AuthSignUp";
import { supabase } from "@/integrations/supabase/client";
import { getRedirectForUser } from "@/lib/profileRouting";
import { safeAuthNext } from "@/lib/authRedirect";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { next?: string } => ({ next: safeAuthNext(s.next) }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const dest = search.next ?? (await getRedirectForUser(data.user.id));
      throw redirect({ href: dest });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in — H2O Map" },
      { name: "description", content: "Sign in or create an account to contribute water dispenser locations and readings." },
      { property: "og:title", content: "Sign in — H2O Map" },
      { property: "og:description", content: "Sign in or create an account to contribute water dispenser locations and readings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthSignUp,
});
