// Recharts sets stroke/fill as SVG attributes, which don't resolve CSS
// var(...) reliably — so brand accent colors are duplicated here as literal
// hex (same value in both themes, per the brand palette). Grid/axis lines
// use stroke="currentColor" instead, inheriting a Tailwind text-* color
// utility from a wrapper element, so *those* do stay theme-aware.
export const CHART_ACCENT = "#0066FF";
export const CHART_ACCENT_BRIGHT = "#3D8BFF";
export const CHART_ACCENT_WASH = "rgba(0, 102, 255, 0.1)";
