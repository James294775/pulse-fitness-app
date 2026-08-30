import type { TrackPoint } from "@/lib/track";

/**
 * Projects a track into a simple local-equirectangular 2D path for feed-card
 * thumbnails — a full MapLibre instance per card would be far too heavy for
 * a scrolling list, and the tile fetch cost isn't worth it for a thumbnail
 * nobody zooms or pans. Returns an SVG path `d` string sized to fit
 * `width`x`height` with the given padding.
 */
export function trackToSvgPath(points: Pick<TrackPoint, "lat" | "lng">[], width: number, height: number, padding = 8): string | null {
  if (points.length < 2) return null;

  const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const latCos = Math.cos((avgLat * Math.PI) / 180);

  const xs = points.map((p) => p.lng * latCos);
  const ys = points.map((p) => -p.lat); // flip so north is up

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const scale = Math.min(innerW / spanX, innerH / spanY);

  const offsetX = padding + (innerW - spanX * scale) / 2;
  const offsetY = padding + (innerH - spanY * scale) / 2;

  const coords = points.map((_, i) => {
    const x = offsetX + (xs[i] - minX) * scale;
    const y = offsetY + (ys[i] - minY) * scale;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M${coords.join(" L")}`;
}
