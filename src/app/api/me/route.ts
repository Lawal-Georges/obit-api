import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Errors } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Errors.unauthenticated();
  return NextResponse.json({ user });
}
