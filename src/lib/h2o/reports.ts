import { supabase } from "@/integrations/supabase/client";
import type { OperatingStatus } from "./dispensers";
import { reportSchema } from "./validation";

export type WaterReport = {
  id: string;
  dispenser_id: string;
  user_id: string;
  ph_level: number;
  tds_ppm: number;
  tested_at: string;
  water_temperature_c: number | null;
  meter_model: string | null;
  dispenser_status: OperatingStatus;
  notes: string | null;
  image_urls: string[];
  tested_directly_from_outlet: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
};

const SELECT =
  "id, dispenser_id, user_id, ph_level, tds_ppm, tested_at, water_temperature_c, meter_model, dispenser_status, notes, image_urls, tested_directly_from_outlet, is_hidden, created_at, updated_at";

export async function listReportsForDispenser(dispenserId: string): Promise<WaterReport[]> {
  const { data, error } = await supabase
    .from("water_quality_reports")
    .select(SELECT)
    .eq("dispenser_id", dispenserId)
    .order("tested_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as WaterReport[];
}

export async function listRecentReports(limit = 100): Promise<WaterReport[]> {
  const { data, error } = await supabase
    .from("water_quality_reports")
    .select(SELECT)
    .order("tested_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as WaterReport[];
}

export async function listMyReports(): Promise<WaterReport[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data, error } = await supabase
    .from("water_quality_reports")
    .select(SELECT)
    .eq("user_id", u.user.id)
    .order("tested_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WaterReport[];
}

export type NewReportInput = {
  dispenser_id: string;
  ph_level: number;
  tds_ppm: number;
  tested_at: string;
  water_temperature_c?: number | null;
  meter_model?: string | null;
  dispenser_status: OperatingStatus;
  notes?: string | null;
  image_urls?: string[];
  tested_directly_from_outlet: boolean;
};

export async function createReport(input: NewReportInput): Promise<WaterReport> {
  reportSchema.parse(input);
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Please sign in to submit a report.");
  if (!input.tested_directly_from_outlet) {
    throw new Error("Please confirm the water was tested directly from the dispenser outlet.");
  }
  if (!(input.ph_level >= 0 && input.ph_level <= 14)) {
    throw new Error("pH must be between 0 and 14.");
  }
  if (!Number.isInteger(input.tds_ppm) || input.tds_ppm < 0 || input.tds_ppm > 5000) {
    throw new Error("TDS must be a whole number between 0 and 5000.");
  }
  const { data, error } = await supabase
    .from("water_quality_reports")
    .insert({
      dispenser_id: input.dispenser_id,
      user_id: u.user.id,
      ph_level: input.ph_level,
      tds_ppm: input.tds_ppm,
      tested_at: input.tested_at,
      water_temperature_c: input.water_temperature_c ?? null,
      meter_model: input.meter_model?.trim() || null,
      dispenser_status: input.dispenser_status,
      notes: input.notes?.trim() || null,
      image_urls: input.image_urls ?? [],
      tested_directly_from_outlet: true,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as WaterReport;
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase.from("water_quality_reports").delete().eq("id", id);
  if (error) throw error;
}

export function isOutdated(tested_at: string, days = 30): boolean {
  const diff = Date.now() - new Date(tested_at).getTime();
  return diff > days * 24 * 60 * 60 * 1000;
}

export async function getLatestReportForDispenser(dispenserId: string): Promise<WaterReport | null> {
  const { data, error } = await supabase
    .from("water_quality_reports")
    .select(SELECT)
    .eq("dispenser_id", dispenserId)
    .order("tested_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as WaterReport) ?? null;
}

export async function countReportsForDispenser(dispenserId: string): Promise<number> {
  const { count, error } = await supabase
    .from("water_quality_reports")
    .select("id", { count: "exact", head: true })
    .eq("dispenser_id", dispenserId);
  if (error) throw error;
  return count ?? 0;
}