import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE_NAME = "orbit_session";

const JWT_SECRET = process.env.JWT_SECRET;
const EXPIRES_IN_SECONDS = Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 604800); // 7 jours

function getSecretKey() {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET n'est pas defini. Copiez .env.example vers .env et renseignez-le.");
  }
  return new TextEncoder().encode(JWT_SECRET);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type SessionPayload = { sub: string; email: string };

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + EXPIRES_IN_SECONDS)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_MAX_AGE = EXPIRES_IN_SECONDS;

/**
 * Recupere l'utilisateur courant a partir du cookie de session.
 * Retourne null si non authentifie ou si le token est invalide/expire.
 * A utiliser dans les Route Handlers (App Router) : `cookies()` y est disponible.
 */
export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return user;
}
