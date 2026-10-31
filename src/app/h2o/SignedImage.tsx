import { useEffect, useState } from "react";
import { signImageUrls } from "@/lib/h2o/images";

export function SignedImage({
  path,
  className,
  alt,
  onClick,
}: {
  path: string;
  className?: string;
  alt: string;
  onClick?: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    signImageUrls([path])
      .then((urls) => {
        if (live) setUrl(urls[0] ?? null);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [path]);
  if (!url) return <div className={`${className ?? ""} animate-pulse bg-secondary`} />;
  return <img src={url} alt={alt} onClick={onClick} className={className} loading="lazy" />;
}

export function Lightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  if (!url) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <img src={url} alt="" className="max-h-full max-w-full rounded-lg" />
    </div>
  );
}
