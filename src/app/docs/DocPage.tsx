import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import Link from "next/link";
import { ThemeToggle } from "../ThemeToggle";

export function readProjectFile(relativePath: string): string {
  const fullPath = path.join(process.cwd(), relativePath);
  return fs.readFileSync(fullPath, "utf-8");
}

export function DocPage({
  markdown,
  eyebrow,
  backHref = "/",
}: {
  markdown: string;
  eyebrow: string;
  backHref?: string;
}) {
  const html = marked.parse(markdown, { async: false }) as string;

  return (
    <main
      style={{
        maxWidth: "760px",
        margin: "0 auto",
        padding: "56px 24px 96px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Link
          href={backHref}
          style={{
            display: "inline-block",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--text-dim)",
            textDecoration: "none",
            marginBottom: "28px",
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
          marginBottom: "20px",
        }}
      >
        {eyebrow}
      </div>
      <article
        className="doc-content"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          color: "var(--text)",
          fontSize: "15px",
          lineHeight: 1.7,
        }}
      />
    </main>
  );
}
