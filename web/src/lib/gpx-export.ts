function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      default:
        return "&quot;";
    }
  });
}

/** Builds a GPX 1.1 <rte> (planned route, no timestamps) from a saved Route's waypoints. */
export function buildRouteGpx(name: string, points: { lat: number; lng: number }[]): string {
  const rtepts = points
    .map((p) => `    <rtept lat="${p.lat.toFixed(6)}" lon="${p.lng.toFixed(6)}"></rtept>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Pulse" xmlns="http://www.topografix.com/GPX/1/1">
  <rte>
    <name>${escapeXml(name)}</name>
${rtepts}
  </rte>
</gpx>
`;
}
