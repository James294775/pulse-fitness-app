"use client";

import { useEffect, useRef } from "react";
import { Map as MaplibreMap, Marker, type GeoJSONSource, type LngLatBoundsLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Free, keyless vector tiles — see DECISIONS.md (Phase 1) for why this
// provider over a paid/API-keyed one.
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const ROUTE_SOURCE_ID = "route";
const ROUTE_LAYER_ID = "route-line";

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

function boundsOf(points: LatLng[]): LngLatBoundsLike {
  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

export function ActivityMap({
  points,
  className,
  live = false,
}: {
  points: LatLng[];
  className?: string;
  live?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);
  const endMarkerRef = useRef<Marker | null>(null);

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new MaplibreMap({
      container: containerRef.current,
      style: MAP_STYLE,
      interactive: !live,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource(ROUTE_SOURCE_ID, {
        type: "geojson",
        data: toGeoJsonLine(points),
      });
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#0066ff", "line-width": 4 },
      });
      if (points.length > 0) {
        fitAndMark();
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run once on mount
  }, []);

  function fitAndMark() {
    const map = mapRef.current;
    if (!map || points.length === 0) return;

    startMarkerRef.current?.remove();
    endMarkerRef.current?.remove();

    startMarkerRef.current = new Marker({ color: "#0066ff" })
      .setLngLat([points[0].lng, points[0].lat])
      .addTo(map);

    if (points.length > 1) {
      endMarkerRef.current = new Marker({ color: "#3d8bff" })
        .setLngLat([points[points.length - 1].lng, points[points.length - 1].lat])
        .addTo(map);
    }

    if (points.length === 1) {
      map.jumpTo({ center: [points[0].lng, points[0].lat], zoom: 14 });
    } else {
      map.fitBounds(boundsOf(points), { padding: 32, duration: 0 });
    }
  }

  // Keep the drawn line in sync as points change (live recording).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) return;
    source.setData(toGeoJsonLine(points));
    fitAndMark();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  return <div ref={containerRef} className={className} />;
}
