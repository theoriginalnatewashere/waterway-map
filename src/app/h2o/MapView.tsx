import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Dispenser } from "@/lib/h2o/dispensers";
import "leaflet/dist/leaflet.css";

type Marker = {
  id: string;
  lat: number;
  lng: number;
  status: "recent" | "outdated" | "none" | "out_of_service";
  title: string;
};

export function markerFromDispenser(
  d: Dispenser,
  latest: { tested_at: string } | null,
): Marker {
  let status: Marker["status"];
  if (d.operating_status === "out_of_service") status = "out_of_service";
  else if (!latest) status = "none";
  else if (Date.now() - new Date(latest.tested_at).getTime() > 30 * 24 * 60 * 60 * 1000)
    status = "outdated";
  else status = "recent";
  return { id: d.id, lat: d.latitude, lng: d.longitude, status, title: d.name };
}

function statusColor(s: Marker["status"]): string {
  switch (s) {
    case "recent":
      return "#0ea5e9";
    case "outdated":
      return "#f59e0b";
    case "out_of_service":
      return "#ef4444";
    default:
      return "#94a3b8";
  }
}

function statusInitial(s: Marker["status"]): string {
  return s === "recent" ? "✓" : s === "outdated" ? "!" : s === "out_of_service" ? "✕" : "?";
}

export function MapView({
  markers,
  onSelect,
  onPickLocation,
  pickedLocation,
  currentLocation,
  initialCenter,
  height = "60vh",
}: {
  markers: Marker[];
  onSelect?: (id: string) => void;
  onPickLocation?: (lat: number, lng: number) => void;
  pickedLocation?: { lat: number; lng: number } | null;
  currentLocation?: { lat: number; lng: number } | null;
  initialCenter?: { lat: number; lng: number };
  height?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const pickedRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const userLocationRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = await import("leaflet");
      if (disposed || !containerRef.current) return;
      LRef.current = L;
      const center =
        initialCenter ??
        (markers.length > 0
          ? { lat: markers[0].lat, lng: markers[0].lng }
          : { lat: 1.3521, lng: 103.8198 });
      const map = L.map(containerRef.current, { zoomControl: true }).setView(
        [center.lat, center.lng],
        markers.length > 0 ? 13 : 11,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);

      if (onPickLocation) {
        map.on("click", (e: any) => {
          onPickLocation(e.latlng.lat, e.latlng.lng);
        });
      }
    })();
    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = LRef.current;
    if (!mapReady || !L || !mapRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();
    for (const m of markers) {
      const color = statusColor(m.status);
      const initial = statusInitial(m.status);
      const icon = L.divIcon({
        className: "",
        html: `<div title="${m.title.replace(/"/g, "&quot;")}" style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:${color};color:#fff;font-weight:700;font-size:14px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);">${initial}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(layerRef.current);
      if (onSelect) marker.on("click", () => onSelect(m.id));
    }
  }, [markers, onSelect, mapReady]);

  useEffect(() => {
    const L = LRef.current;
    if (!L || !mapRef.current) return;
    if (pickedRef.current) {
      pickedRef.current.remove();
      pickedRef.current = null;
    }
    if (pickedLocation) {
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;border-radius:50%;background:#0ea5e9;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      pickedRef.current = L.marker([pickedLocation.lat, pickedLocation.lng], {
        icon,
        draggable: !!onPickLocation,
      }).addTo(mapRef.current);
      if (onPickLocation) {
        pickedRef.current.on("dragend", (e: any) => {
          const ll = e.target.getLatLng();
          onPickLocation(ll.lat, ll.lng);
        });
      }
      mapRef.current.setView(
        [pickedLocation.lat, pickedLocation.lng],
        Math.max(mapRef.current.getZoom(), 15),
      );
    }
  }, [pickedLocation, onPickLocation]);

  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;
    if (userLocationRef.current) {
      userLocationRef.current.remove();
      userLocationRef.current = null;
    }
    if (currentLocation) {
      const icon = L.divIcon({
        className: "",
        html: `<div title="Your location" style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#0ea5e9;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"><div style="width:8px;height:8px;border-radius:50%;background:#fff;"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      userLocationRef.current = L.marker([currentLocation.lat, currentLocation.lng], {
        icon,
        zIndexOffset: 1000,
      }).addTo(map);
      map.setView(
        [currentLocation.lat, currentLocation.lng],
        Math.max(map.getZoom(), 15),
      );
    }
  }, [currentLocation, mapReady]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%" }}
      className="rounded-xl overflow-hidden"
    />
  );
}

export function MapLegend() {
  const { t } = useTranslation();
  const items: { s: Marker["status"]; label: string }[] = [
    { s: "recent", label: t("map.legend.recent") },
    { s: "outdated", label: t("map.legend.outdated") },
    { s: "none", label: t("map.legend.none") },
    { s: "out_of_service", label: t("map.legend.outOfService") },
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
      {items.map((i) => (
        <li key={i.s} className="flex items-center gap-1.5">
          <span
            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: statusColor(i.s) }}
          >
            {statusInitial(i.s)}
          </span>
          {i.label}
        </li>
      ))}
    </ul>
  );
}