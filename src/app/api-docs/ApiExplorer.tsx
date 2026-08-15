"use client";

import { useState } from "react";
import { apiGroups, type ApiRoute } from "@/lib/api-catalog";

const methodColor: Record<ApiRoute["method"], string> = {
  GET: "var(--get)",
  POST: "var(--post)",
  PATCH: "var(--patch)",
  DELETE: "var(--delete)",
};

const DEMO_PROJECT_ID = "00000000-0000-0000-0000-000000000001";

function extractPathParams(path: string): string[] {
  return (path.match(/:([a-zA-Z_]+)/g) ?? []).map((p) => p.slice(1));
}

function defaultParamValue(path: string, param: string): string {
  // Le seul id stable connu a l'avance est celui du projet de demo (fixe dans le seed) ;
  // le reste (taches...) est genere aleatoirement, donc laisse vide pour que l'utilisateur
  // le colle depuis une reponse precedente (ex: GET /api/projects).
  if (param === "id" && path.startsWith("/api/projects")) return DEMO_PROJECT_ID;
  return "";
}

type ExecResult = {
  status: number;
  ok: boolean;
  durationMs: number;
  body: string;
};

function RouteCard({ route }: { route: ApiRoute }) {
  const [open, setOpen] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const params = extractPathParams(route.path);
    const initial: Record<string, string> = {};
    for (const p of params) initial[p] = defaultParamValue(route.path, p);
    return initial;
  });
  const [queryValues, setQueryValues] = useState<Record<string, string>>({});
  const [bodyText, setBodyText] = useState(
    route.sampleBody ? JSON.stringify(route.sampleBody, null, 2) : ""
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecResult | null>(null);

  const pathParams = extractPathParams(route.path);
  const hasBody = route.method === "POST" || route.method === "PATCH";

  function buildUrl(): string {
    let url = route.path;
    for (const p of pathParams) {
      url = url.replace(`:${p}`, encodeURIComponent(paramValues[p] || `:${p}`));
    }
    const query = (route.queryParams ?? [])
      .map((qp) => [qp.name, queryValues[qp.name]])
      .filter(([, v]) => v)
      .map(([k, v]) => `${encodeURIComponent(k as string)}=${encodeURIComponent(v as string)}`)
      .join("&");
    return query ? `${url}?${query}` : url;
  }

  async function execute() {
    setLoading(true);
    setResult(null);
    const started = performance.now();
    try {
      const res = await fetch(buildUrl(), {
        method: route.method,
        credentials: "include",
        headers: hasBody && bodyText.trim() ? { "Content-Type": "application/json" } : undefined,
        body: hasBody && bodyText.trim() ? bodyText : undefined,
      });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // reponse non-JSON : on affiche le texte brut tel quel
      }
      setResult({ status: res.status, ok: res.ok, durationMs: Math.round(performance.now() - started), body: pretty });
    } catch (err) {
      setResult({
        status: 0,
        ok: false,
        durationMs: Math.round(performance.now() - started),
        body: `Erreur reseau : ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="explorer-card">
      <button type="button" className="explorer-card-header" onClick={() => setOpen((v) => !v)}>
        <span className="explorer-method" style={{ color: methodColor[route.method] }}>
          <span className="explorer-dot" style={{ background: methodColor[route.method] }} />
          {route.method}
        </span>
        <code className="explorer-path">{route.path}</code>
        <span className="explorer-role">{route.role}</span>
        <span className={`explorer-chevron${open ? " open" : ""}`}>&#9662;</span>
      </button>

      {open && (
        <div className="explorer-body">
          {pathParams.length > 0 && (
            <div className="explorer-field-group">
              {pathParams.map((p) => (
                <label key={p} className="explorer-field">
                  <span>{`:${p}`}</span>
                  <input
                    type="text"
                    value={paramValues[p] ?? ""}
                    onChange={(e) => setParamValues((v) => ({ ...v, [p]: e.target.value }))}
                    placeholder="uuid"
                  />
                </label>
              ))}
            </div>
          )}

          {route.queryParams && route.queryParams.length > 0 && (
            <div className="explorer-field-group">
              {route.queryParams.map((qp) =>
                qp.enumValues ? (
                  <label key={qp.name} className="explorer-field">
                    <span>{qp.name}</span>
                    <select
                      value={queryValues[qp.name] ?? ""}
                      onChange={(e) => setQueryValues((v) => ({ ...v, [qp.name]: e.target.value }))}
                    >
                      {qp.enumValues.map((val) => (
                        <option key={val} value={val}>
                          {val || "(aucun)"}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label key={qp.name} className="explorer-field">
                    <span>{qp.name}</span>
                    <input
                      type="text"
                      value={queryValues[qp.name] ?? ""}
                      onChange={(e) => setQueryValues((v) => ({ ...v, [qp.name]: e.target.value }))}
                      placeholder={qp.placeholder}
                    />
                  </label>
                )
              )}
            </div>
          )}

          {hasBody && (
            <label className="explorer-field explorer-field-body">
              <span>Corps de la requete (JSON)</span>
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={Math.max(3, bodyText.split("\n").length)}
                spellCheck={false}
              />
            </label>
          )}

          <button type="button" className="explorer-execute" onClick={execute} disabled={loading}>
            {loading ? "Envoi..." : "Executer"}
          </button>

          {result && (
            <div className="explorer-result">
              <div className="explorer-result-status">
                <span
                  className="explorer-status-badge"
                  style={{ color: result.ok ? "var(--get)" : "var(--delete)" }}
                >
                  {result.status || "ERR"}
                </span>
                <span className="explorer-duration">{result.durationMs} ms</span>
              </div>
              <pre>{result.body}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ApiExplorer() {
  return (
    <div>
      {apiGroups.map((group) => (
        <section key={group.name} style={{ marginBottom: "32px" }}>
          <h2 className="explorer-group-title">{group.name}</h2>
          <p className="explorer-group-intro">{group.intro}</p>
          <div className="explorer-stack">
            {group.routes.map((route) => (
              <RouteCard key={route.method + route.path} route={route} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
