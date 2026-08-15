import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, verifyPassword, SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { jsonError, jsonFromZodError } from "@/lib/http";

// US01 - Connexion
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Corps de requete JSON invalide", 400);

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonFromZodError(parsed.error);

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Meme message que l'utilisateur existe ou non : on evite de reveler
  // si un email est enregistre (enumeration d'utilisateurs).
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return jsonError("Identifiants invalides", 401);
  }

  const token = await createSessionToken({ sub: user.id, email: user.email });

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  return response;
}
