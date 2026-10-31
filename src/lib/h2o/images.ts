import { supabase } from "@/integrations/supabase/client";
import { MAX_PHOTOS } from "./validation";

export const MAX_IMAGES = MAX_PHOTOS;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];
const BUCKET = "dispenser-images";

export type ValidationResult =
  | { ok: true; file: File }
  | { ok: false; reason: string; file: File };

export function validateImageFile(file: File): ValidationResult {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const typeOk =
    ALLOWED_EXT.includes(ext) && ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());
  if (!typeOk) {
    return { ok: false, file, reason: `${file.name}: only JPG, PNG or WEBP images are allowed.` };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, file, reason: `${file.name}: image is larger than 5 MB.` };
  }
  return { ok: true, file };
}

function randomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function resizeIfLarge(file: File): Promise<File> {
  if (typeof window === "undefined" || !("createImageBitmap" in window)) return file;
  if (file.size <= 800 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85),
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function uploadDispenserImages(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  if (files.length > MAX_IMAGES) throw new Error(`You can attach up to ${MAX_IMAGES} images.`);
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const userId = u.user.id;

  const paths: string[] = [];
  for (const original of files) {
    const v = validateImageFile(original);
    if (!v.ok) throw new Error(v.reason);
    const file = await resizeIfLarge(original);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/${randomId()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

export async function signImageUrls(paths: string[], expiresIn = 60 * 60): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, expiresIn);
  if (error) throw error;
  const byPath = new Map((data ?? []).map((d) => [d.path ?? "", d.signedUrl ?? ""]));
  return paths.map((p) => byPath.get(p) ?? "");
}