import { z } from "zod";

// Mirror the migrated database limits before any upload or write.
export const MAX_PHOTOS = 6;
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const status = z.enum(["working", "out_of_service", "unknown"]);
const images = z.array(z.string()).max(MAX_PHOTOS).optional();

export const dispenserSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: optionalText(300),
  location_description: optionalText(500),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  operating_status: status.optional(),
  image_urls: images,
});

export const reportSchema = z.object({
  dispenser_id: z.string().uuid(),
  ph_level: z.number().finite().min(0).max(14),
  tds_ppm: z.number().int().min(0).max(5000),
  tested_at: z.string().refine((value) => Number.isFinite(Date.parse(value)), "Invalid test date"),
  water_temperature_c: z.number().finite().min(-10).max(100).nullable().optional(),
  meter_model: optionalText(120),
  dispenser_status: status,
  notes: optionalText(2000),
  image_urls: images,
  tested_directly_from_outlet: z.literal(true),
});
