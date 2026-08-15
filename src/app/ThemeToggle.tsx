"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  // null tant qu'on n'a pas lu le theme reel cote client, pour eviter un
  // mismatch d'hydratation (le script inline dans <head> a deja pose data-theme).
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("orbit-theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Passer en theme sombre" : "Passer en theme clair"}
      title={theme === "light" ? "Theme sombre" : "Theme clair"}
      className="icon-btn theme-toggle-btn"
      style={{ position: "fixed", top: "20px", right: "20px", zIndex: 50 }}
    >
      {/* Les deux icones restent dans le DOM en permanence : c'est le CSS
          (classe .theme-icon dans globals.css, pilotee par [data-theme] sur <html>)
          qui anime la rotation + le fondu entre elles, sans attendre React.
          Le halo lumineux continu vient de .theme-toggle-btn (animation CSS infinie). */}
      <span className="theme-icon">
        <svg
          className="icon-moon"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
        <svg
          className="icon-sun"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </span>
    </button>
  );
}