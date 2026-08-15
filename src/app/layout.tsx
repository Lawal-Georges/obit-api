import "./globals.css";

export const metadata = {
  title: "Orbit API",
  description: "API de suivi de projets et taches - test technique",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// Applique le theme sauvegarde (ou la preference systeme) avant le premier
// rendu pour eviter un flash de theme incorrect (FOUC) au chargement.
const themeInitScript = `
(function () {
  try {
    var saved = window.localStorage.getItem("orbit-theme");
    var theme = saved === "light" || saved === "dark"
      ? saved
      : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
