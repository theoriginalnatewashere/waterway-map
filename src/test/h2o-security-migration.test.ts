import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Static migration regressions; these do not exercise hosted RLS with real sessions.
const sql = readFileSync(
  new URL(
    "../../supabase/migrations/20261031084647_e9d6596a-d8fb-424a-82b2-54fb6cab0a09.sql",
    import.meta.url,
  ),
  "utf8",
);
describe("security migration invariants (static)", () => {
  it("uses a caller-scoped invoker role check and denies anonymous execution", () => {
    expect(sql).toMatch(/RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER/);
    expect(sql).toMatch(/_user_id = auth\.uid\(\)/);
    expect(sql).toMatch(
      /REVOKE EXECUTE ON FUNCTION public\.has_role\(uuid, public\.app_role\) FROM PUBLIC, anon/,
    );
  });
  it("rejects changed outlet confirmation before the administrator exemption", () => {
    const guard = sql.indexOf(
      "IF NEW.tested_directly_from_outlet IS DISTINCT FROM OLD.tested_directly_from_outlet",
    );
    const exemption = sql.indexOf("IF public.has_role(auth.uid(),'admin') THEN RETURN NEW");
    expect(guard).toBeGreaterThan(-1);
    expect(exemption).toBeGreaterThan(guard);
  });
  it("requires a visible parent and report for public report reads", () => {
    expect(sql).toMatch(
      /"reports public read visible"[^;]+TO anon USING \(NOT is_hidden AND EXISTS[^;]+d\.id = dispenser_id AND NOT d\.is_hidden/,
    );
  });
  it("retains owner and administrator reads of moderated reports", () => {
    expect(sql).toMatch(
      /"reports authenticated read"[^;]+auth\.uid\(\) = user_id OR public\.has_role\(auth\.uid\(\),'admin'\)/,
    );
  });
  it("limits photo reads to the uploader or RLS-visible referencing records", () => {
    expect(sql).toMatch(
      /"dispenser-images read"[^;]+auth\.uid\(\)::text = owner_id[^;]+ANY\(d\.image_urls\)[^;]+ANY\(r\.image_urls\)/,
    );
  });
  it("checks both uploader identity and folder on photo changes", () => {
    for (const policy of ["insert own folder", "update own", "delete own or admin"]) {
      const rule = sql.split(`ALTER POLICY "dispenser-images ${policy}"`)[1]?.split(";")[0];
      expect(rule).toContain("auth.uid()::text = owner_id");
      expect(rule).toContain("auth.uid()::text = (storage.foldername(name))[1]");
    }
  });
  it("prevents attaching another uploader's photos to either record type", () => {
    expect(sql).toContain("o.owner_id = auth.uid()::text");
    for (const table of ["public.dispensers", "public.water_quality_reports"]) {
      expect(sql).toMatch(
        new RegExp(
          `BEFORE INSERT OR UPDATE OF image_urls ON ${table.replaceAll(".", "\\.")} FOR EACH ROW EXECUTE FUNCTION public\\.protect_image_attachments`,
        ),
      );
    }
  });
});
