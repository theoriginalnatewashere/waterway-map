import { supabase } from "@/integrations/supabase/client";

import { LOCATION_ONBOARDED_PREFIX } from "@/app/h2o/LocationIntro";

// H2O Map has no address/onboarding flow — send everyone to the map.
export async function getRedirectForUser(_userId: string): Promise<"/map"> {
  return "/map";
}

// After sign-in / sign-up, send users through the location onboarding once.
export function getPostAuthRedirect(userId: string): "/map" | "/welcome-location" {
  try {
    if (typeof localStorage === "undefined") return "/map";
    return localStorage.getItem(LOCATION_ONBOARDED_PREFIX + userId) === "1"
      ? "/map"
      : "/welcome-location";
  } catch {
    return "/map";
  }
}

export async function requireSignedIn(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("unauthenticated");
  }
  return data.user.id;
}
