"use client";

import { useEffect, useRef } from "react";

export type LatLng = { lat: number; lng: number };

interface MapPickerProps {
  value: LatLng | null;
  onChange: (coords: LatLng) => void;
}

// Ecuador bounds
const ECUADOR_CENTER: [number, number] = [-1.8312, -78.1834];
const ECUADOR_ZOOM = 7;

export function MapPicker({ value, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    // Import leaflet dynamically — solo en el cliente
    import("leaflet").then((L) => {
      // El guard de arriba corre antes de que esta promesa resuelva: si el
      // componente se desmontó (cambio de paso) o ya se inicializó mientras
      // tanto, no reintentes `L.map()` sobre un container que Leaflet ya
      // marcó como inicializado — revienta con "Map container is already
      // initialized".
      if (cancelled || !containerRef.current || mapRef.current) return;

      // Fix para los íconos por defecto en webpack/Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!).setView(ECUADOR_CENTER, ECUADOR_ZOOM);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Si ya hay coordenadas guardadas, coloca el marcador
      if (value) {
        const m = L.marker([value.lat, value.lng]).addTo(map);
        markerRef.current = m;
        map.setView([value.lat, value.lng], 15);
      }

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }
        onChange({ lat, lng });
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando el valor cambia externamente, mueve el marcador
  useEffect(() => {
    if (!mapRef.current || !value) return;
    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      if (markerRef.current) {
        markerRef.current.setLatLng([value.lat, value.lng]);
      } else {
        markerRef.current = L.marker([value.lat, value.lng]).addTo(mapRef.current!);
      }
    });
  }, [value]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={containerRef}
        className="w-full h-64 rounded-xl border border-gray-200 overflow-hidden z-0"
      />
    </>
  );
}
