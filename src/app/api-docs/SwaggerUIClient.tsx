"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { openApiSpec } from "@/lib/openapi-spec";

// swagger-ui-react touche a des APIs navigateur (window, document) des le module
// charge : on le charge donc uniquement cote client, jamais lors du rendu serveur.
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export function SwaggerUIClient() {
  return <SwaggerUI spec={openApiSpec} docExpansion="list" defaultModelsExpandDepth={-1} />;
}
