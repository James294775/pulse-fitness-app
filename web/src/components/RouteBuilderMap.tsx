"use client";

import { useEffect, useRef } from "react";
import { Map as MaplibreMap, Marker, type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const ROUTE_SOURCE_ID = "route-draft";
const ROUTE_LAYER_ID = "route-draft-line";

// Vancouver — a reasonable default center when the route has no points yet.
const DEFAULT_CENTER: [number, number] = [-123.12, 49.28];

export interface LatLng {
  lat: number;
  lng: number;
}

function toGeoJsonLine(points: LatLng[]): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: points.map((p) => [p.lng, p.lat]) },
  };
}

export function RouteBuilderMap({
  points,
  onAddPoint,
  className,
}: {
  points: LatLng[];
  onAddPoint: (point: LatLng) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const pointsRef = useRef(points);
  pointsRef.current = points;
  const onAddPointRef = useRef(onAddPoint);
  onAddPointRef.current = onAddPoint;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new MaplibreMap({
      container: containerRef.current,
      style: MAP_STYLE,
      center: pointsRef.current[0] ? [pointsRef.current[0].lng, pointsRef.current[0].lat] : DEFAULT_CENTER,
      zoom: 12,
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: toGeoJsonLine(pointsRef.current) });
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#0066ff", "line-width": 4 },
      });
      renderMarkers();
    });

    map.on("click", (e) => {
      onAddPointRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
     
  }, []);

  function renderMarkers() {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = pointsRef.current.map((p, i) => {
      const isEndpoint = i === 0 || i === pointsRef.current.length - 1;
      return new Marker({ color: isEndpoint ? "#0066ff" : "#3d8bff", scale: isEndpoint ? 1 : 0.6 })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
    });
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource(ROUTE_SOURCE_ID);
    if (!source) return;
    (source as GeoJSONSource).setData(toGeoJsonLine(points));
    renderMarkers();
     
  }, [points]);

  return <div ref={containerRef} className={className} />;
}
