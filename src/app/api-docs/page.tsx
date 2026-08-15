import Link from "next/link";
import { ThemeToggle } from "../ThemeToggle";
import { ApiExplorer } from "./ApiExplorer";

export default function ApiDocsPage() {
  return (
    <main className="page-container" style={{ maxWidth: "880px" }}>
      <div className="doc-header" style={{ marginBottom: "24px" }}>
        <Link
          href="/"
          style={{
            display: "inline-block",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--text-dim)",
            textDecoration: "none",
          }}
        >
          &larr; retour aux endpoints
        </Link>
        <ThemeToggle />
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          letterSpacing: "0.14em",
          color: "var(--accent)",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}
      >
        Orbit · API interactive
      </div>
      <h1 className="page-title" style={{ maxWidth: "none" }}>
        Essayer l&apos;API depuis le navigateur
      </h1>
      <p style={{ color: "var(--text-dim)", fontSize: "15px", lineHeight: 1.6, maxWidth: "640px", margin: "0 0 28px" }}>
        Deplie une route, remplis les champs si besoin, clique &laquo;&nbsp;Executer&nbsp;&raquo;.
        Connecte-toi d&apos;abord via <code>POST /api/login</code> (comptes de demo dans le{" "}
        <Link href="/docs" style={{ color: "var(--accent)" }}>README</Link>) : ton navigateur garde
        ensuite le cookie de session pour les requetes suivantes.
      </p>

      <ApiExplorer />
    </main>
  );
}
