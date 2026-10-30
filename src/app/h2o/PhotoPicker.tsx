import { useRef } from "react";
import { Camera, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MAX_IMAGES, validateImageFile } from "@/lib/h2o/images";

export type PhotoDraft = { file: File; previewUrl: string };

export function PhotoPicker({
  photos,
  onChange,
  onError,
  max = MAX_IMAGES,
  label,
}: {
  photos: PhotoDraft[];
  onChange: (next: PhotoDraft[]) => void;
  onError: (m: string) => void;
  max?: number;
  label?: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = max - photos.length;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    if (incoming.length > remaining) onError(t("validation.maxImages", { max }));
    const accepted: PhotoDraft[] = [];
    for (const f of incoming.slice(0, remaining)) {
      const v = validateImageFile(f);
      if (!v.ok) {
        onError(v.reason);
        continue;
      }
      accepted.push({ file: f, previewUrl: URL.createObjectURL(f) });
    }
    if (accepted.length) onChange([...photos, ...accepted]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (i: number) => {
    const t = photos[i];
    if (t) URL.revokeObjectURL(t.previewUrl);
    onChange(photos.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="block text-xs font-semibold">{label ?? t("photos.label")}</span>
        <span className="text-[11px] text-muted-foreground">
          {t("photos.counter", { current: photos.length, max })}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div
            key={p.previewUrl}
            className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary"
          >
            <img src={p.previewUrl} alt={t("photos.attachment", { index: i + 1 })} className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label={t("photos.remove", { index: i + 1 })}
              onClick={() => remove(i)}
              className="absolute top-1.5 right-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-card/60 text-xs text-muted-foreground hover:bg-secondary"
          >
            <Camera className="h-5 w-5" />
            {t("photos.addPhoto")}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}