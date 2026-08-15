import Link from "next/link";
import { apiGroups, totalRouteCount, type ApiRoute } from "@/lib/api-catalog";
import { OrbitRings } from "./OrbitRings";
import { ThemeToggle } from "./ThemeToggle";
import { CopyButton } from "./CopyButton";

const methodColor: Record<ApiRoute["method"], string> = {
  GET: "var(--get)",
  POST: "var(--post)",
  PATCH: "var(--patch)",
  DELETE: "var(--delete)",
};

function MethodBadge({ method }: { method: ApiRoute["method"] }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: methodColor[method],
        minWidth: "58px",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: methodColor[method],
          flexShrink: 0,
        }}
      />
      {method}
    </span>
  );
}

export default function Home() {
  return (
    <main className="page-container">
      <div style={{ position: "relative" }}>
        <div className="orbit-rings-wrap">
          <OrbitRings />
        </div>
        <ThemeToggle />
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            letterSpacing: "0.14em",
            color: "var(--accent)",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Orbit · API interne
        </div>
        <h1 className="page-title">Suivi de projets &amp; taches</h1>
        <p
          style={{
            color: "var(--text-dim)",
            fontSize: "16px",
            lineHeight: 1.6,
            maxWidth: "540px",
            margin: "0 0 28px",
          }}
        >
          Cette application n&apos;expose pas d&apos;interface graphique : c&apos;est une API
          REST que chaque equipe consomme pour organiser ses projets, repartir les taches et
          suivre leur avancement.
        </p>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--text-faint)",
            paddingBottom: "40px",
            borderBottom: "1px solid var(--border-soft)",
            marginBottom: "40px",
          }}
        >
          {totalRouteCount} endpoints · session par cookie httpOnly · PostgreSQL via Prisma
        </div>
      </div>

      {apiGroups.map((group) => (
        <section key={group.name} style={{ marginBottom: "36px" }}>
          <h2
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text)",
              margin: "0 0 6px",
            }}
          >
            {group.name}
          </h2>
          <p
            style={{
              color: "var(--text-dim)",
              fontSize: "14px",
              lineHeight: 1.6,
              margin: "0 0 16px",
              maxWidth: "620px",
            }}
          >
            {group.intro}
          </p>

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "10px",
              background: "var(--bg-panel)",
              overflow: "hidden",
            }}
          >
            {group.routes.map((route, i) => (
              <div
                key={route.method + route.path}
                className="route-row"
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--border-soft)",
                }}
              >
                <MethodBadge method={route.method} />
                <code
                  style={{
                    fontSize: "13.5px",
                    color: "var(--text)",
                    flexShrink: 0,
                  }}
                >
                  {route.path}
                </code>
                <CopyButton value={route.path} label={`Copier ${route.method} ${route.path}`} />
                <span
                  style={{
                    fontSize: "13.5px",
                    color: "var(--text-dim)",
                    flex: "1 1 220px",
                  }}
                >
                  {route.role}
                </span>
                <span className="route-access">{route.access}</span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="footer-links">
        <Link
          href="/docs"
          style={{
            display: "block",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            background: "var(--bg-panel-raised)",
            padding: "20px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--accent)",
              letterSpacing: "0.08em",
              marginBottom: "6px",
            }}
          >
            README
          </div>
          <div style={{ color: "var(--text)", fontSize: "14px", marginBottom: "4px" }}>
            Installation &amp; architecture
          </div>
          <div style={{ color: "var(--text-dim)", fontSize: "13px" }}>
            Setup, choix techniques, hypotheses, limitations.
          </div>
        </Link>

        <Link
          href="/docs/analysis"
          style={{
            display: "block",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            background: "var(--bg-panel-raised)",
            padding: "20px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--accent)",
              letterSpacing: "0.08em",
              marginBottom: "6px",
            }}
          >
            ANALYSIS
          </div>
          <div style={{ color: "var(--text)", fontSize: "14px", marginBottom: "4px" }}>
            Dossier d&apos;analyse fonctionnelle
          </div>
          <div style={{ color: "var(--text-dim)", fontSize: "13px" }}>
            User stories, modele de donnees, regles d&apos;autorisation.
          </div>
        </Link>
      </section>
    </main>
  );
}
