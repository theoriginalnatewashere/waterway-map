import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/pwa", () => ({ registerPwa: vi.fn() }));

import { routeTree } from "@/routeTree.gen";
import { getPostAuthRedirect, getRedirectForUser } from "@/lib/profileRouting";
import manifest from "../../public/manifest.webmanifest?raw";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
  it("keeps both landings, the map and existing deep links at distinct routes", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    for (const [path, routeId] of [
      ["/", "/"],
      ["/en", "/en"],
      ["/map", "/map"],
      ["/auth", "/auth"],
      ["/profile", "/profile"],
      ["/dispensers", "/dispensers/"],
      ["/dispensers/example", "/dispensers/$id"],
      ["/report", "/_authenticated/report"],
      ["/dispensers/new", "/_authenticated/dispensers/new"],
      ["/welcome-location", "/welcome-location"],
    ])
      expect(router.matchRoutes(path).at(-1)?.routeId).toBe(routeId);
  });
  it("returns post-auth users to the map while preserving first-time location onboarding", async () => {
    localStorage.removeItem("h2o.locationOnboarded:route-test");
    expect(getPostAuthRedirect("route-test")).toBe("/welcome-location");
    localStorage.setItem("h2o.locationOnboarded:route-test", "1");
    expect(getPostAuthRedirect("route-test")).toBe("/map");
    expect(await getRedirectForUser("route-test")).toBe("/map");
    localStorage.removeItem("h2o.locationOnboarded:route-test");
  });
  it("opens the installed PWA at the map without changing its scope", () => {
    const config = JSON.parse(manifest);
    expect(config.start_url).toBe("/map");
    expect(config.scope).toBe("/");
  });
});
