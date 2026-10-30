import { supabase } from "@/integrations/supabase/client";

export type OperatingStatus = "working" | "out_of_service" | "unknown";

export type Dispenser = {
  id: string;
  name: string;
  address: string | null;
  location_description: string | null;
  latitude: number;
  longitude: number;
  operating_status: OperatingStatus;
  image_urls: string[];
  created_by: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
};

const SELECT =
  "id, name, address, location_description, latitude, longitude, operating_status, image_urls, created_by, is_hidden, created_at, updated_at";

export async function listDispensers(): Promise<Dispenser[]> {
  const { data, error } = await supabase
    .from("dispensers")
    .select(SELECT)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Dispenser[];
}

export async function getDispenser(id: string): Promise<Dispenser | null> {
  const { data, error } = await supabase.from("dispensers").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Dispenser) ?? null;
}

export type NewDispenserInput = {
  name: string;
  address?: string;
  location_description?: string;
  latitude: number;
  longitude: number;
  operating_status?: OperatingStatus;
  image_urls?: string[];
};

export async function createDispenser(input: NewDispenserInput): Promise<Dispenser> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Please sign in to add a dispenser.");
  const { data, error } = await supabase
    .from("dispensers")
    .insert({
      name: input.name.trim(),
      address: input.address?.trim() || null,
      location_description: input.location_description?.trim() || null,
      latitude: input.latitude,
      longitude: input.longitude,
      operating_status: input.operating_status ?? "unknown",
      image_urls: input.image_urls ?? [],
      created_by: u.user.id,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as Dispenser;
}

export async function updateDispenser(
  id: string,
  patch: Partial<NewDispenserInput>,
): Promise<Dispenser> {
  const { data, error } = await supabase
    .from("dispensers")
    .update({
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.address !== undefined ? { address: patch.address?.trim() || null } : {}),
      ...(patch.location_description !== undefined
        ? { location_description: patch.location_description?.trim() || null }
        : {}),
      ...(patch.latitude !== undefined ? { latitude: patch.latitude } : {}),
      ...(patch.longitude !== undefined ? { longitude: patch.longitude } : {}),
      ...(patch.operating_status !== undefined ? { operating_status: patch.operating_status } : {}),
      ...(patch.image_urls !== undefined ? { image_urls: patch.image_urls } : {}),
    })
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as Dispenser;
}

// Haversine distance in metres
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}