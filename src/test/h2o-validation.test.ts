import { describe, expect, it } from "vitest";
import { dispenserSchema, reportSchema, MAX_PHOTOS } from "@/lib/h2o/validation";
import { safeAuthNext, authCallbackUrl } from "@/lib/authRedirect";

const dispenser = { name: "Water station", latitude: 13.7563, longitude: 100.5018 };
const report = {
  dispenser_id: "00000000-0000-4000-8000-000000000001",
  ph_level: 7,
  tds_ppm: 100,
  tested_at: "2026-10-31T06:57:00Z",
  dispenser_status: "working",
  tested_directly_from_outlet: true,
};

describe("Migrated database limits", () => {
  it("allows six photos and rejects seven", () => {
    expect(MAX_PHOTOS).toBe(6);
    for (const [schema, data] of [
      [dispenserSchema, dispenser],
      [reportSchema, report],
    ] as const) {
      expect(schema.safeParse({ ...data, image_urls: Array(6).fill("photo") }).success).toBe(true);
      expect(schema.safeParse({ ...data, image_urls: Array(7).fill("photo") }).success).toBe(false);
    }
  });
  it("accepts only integer TDS from zero through 5000", () => {
    for (const tds_ppm of [0, 5000])
      expect(reportSchema.safeParse({ ...report, tds_ppm }).success).toBe(true);
    for (const tds_ppm of [-1, 5001, 1.5])
      expect(reportSchema.safeParse({ ...report, tds_ppm }).success).toBe(false);
  });
  it("accepts pH zero through fourteen", () => {
    for (const ph_level of [0, 14])
      expect(reportSchema.safeParse({ ...report, ph_level }).success).toBe(true);
    for (const ph_level of [-0.1, 14.1])
      expect(reportSchema.safeParse({ ...report, ph_level }).success).toBe(false);
  });
  it("accepts optional temperature from minus ten through one hundred", () => {
    for (const water_temperature_c of [null, -10, 100])
      expect(reportSchema.safeParse({ ...report, water_temperature_c }).success).toBe(true);
    for (const water_temperature_c of [-10.1, 100.1, NaN])
      expect(reportSchema.safeParse({ ...report, water_temperature_c }).success).toBe(false);
  });
  it("requires direct outlet confirmation", () => {
    expect(reportSchema.safeParse({ ...report, tested_directly_from_outlet: false }).success).toBe(
      false,
    );
  });
  it("limits dispenser name to 120, address to 300 and description to 500", () => {
    for (const [field, max] of [
      ["name", 120],
      ["address", 300],
      ["location_description", 500],
    ] as const) {
      expect(dispenserSchema.safeParse({ ...dispenser, [field]: "a".repeat(max) }).success).toBe(
        true,
      );
      expect(
        dispenserSchema.safeParse({ ...dispenser, [field]: "a".repeat(max + 1) }).success,
      ).toBe(false);
    }
    expect(dispenserSchema.safeParse({ ...dispenser, name: "   " }).success).toBe(false);
  });
  it("limits meter model to 120 and notes to 2000", () => {
    for (const [field, max] of [
      ["meter_model", 120],
      ["notes", 2000],
    ] as const) {
      expect(reportSchema.safeParse({ ...report, [field]: "a".repeat(max) }).success).toBe(true);
      expect(reportSchema.safeParse({ ...report, [field]: "a".repeat(max + 1) }).success).toBe(
        false,
      );
    }
  });
  it("rejects out-of-range GPS coordinates", () => {
    expect(dispenserSchema.safeParse({ ...dispenser, latitude: 91 }).success).toBe(false);
    expect(dispenserSchema.safeParse({ ...dispenser, longitude: -181 }).success).toBe(false);
  });
});
describe("Auth destinations", () => {
  it("rejects external and browser-normalized external destinations", () => {
    for (const path of ["https://example.com", "//example.com", "/\\example.com"])
      expect(safeAuthNext(path)).toBeUndefined();
    expect(safeAuthNext("/report?dispenserId=abc")).toBe("/report?dispenserId=abc");
  });
  it("returns email and Google callbacks to the public auth page", () => {
    expect(authCallbackUrl("https://example.com", "/profile")).toBe(
      "https://example.com/auth?next=%2Fprofile",
    );
  });
});
