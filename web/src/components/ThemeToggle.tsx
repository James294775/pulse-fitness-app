"use client";

import { useState } from "react";

function currentTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(currentTheme);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    document.cookie = `pulse_theme=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <button
      onClick={toggle}
      className="rounded border border-border-strong px-2 py-1 text-[10px] font-bold tracking-[0.1em] text-secondary"
    >
      {theme === "dark" ? "LIGHT" : "DARK"}
    </button>
  );
}
