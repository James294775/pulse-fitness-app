"use client";

import { useEffect, useRef } from "react";
import { Map as MaplibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const DEFAULT_CENTER: [number, number] = [-123.12, 49.28];

export function PrivacyZoneMap({
  point,
  onPick,
  className,
}: {
  point: { lat: number; lng: number } | null;
  onPick: (point: { lat: number; lng: number }) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new MaplibreMap({
      container: containerRef.current,
      style: MAP_STYLE,
      center: point ? [point.lng, point.lat] : DEFAULT_CENTER,
      zoom: point ? 14 : 11,
    });
    mapRef.current = map;

    map.on("click", (e) => onPickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng }));

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.remove();
    if (point) {
      markerRef.current = new Marker({ color: "#0066ff" }).setLngLat([point.lng, point.lat]).addTo(map);
    }
  }, [point]);

  return <div ref={containerRef} className={className} />;
}
