import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, details: details ?? null }, { status });
}

export function jsonFromZodError(error: ZodError) {
  return jsonError("Donnees invalides", 422, error.flatten().fieldErrors);
}

export const Errors = {
  unauthenticated: () => jsonError("Authentification requise", 401),
  forbidden: () => jsonError("Acces refuse a cette ressource", 403),
  notFound: (resource = "Ressource") => jsonError(`${resource} introuvable`, 404),
};
