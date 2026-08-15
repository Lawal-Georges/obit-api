import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getProjectAccess } from "@/lib/authorization";
import { updateProjectSchema } from "@/lib/validation";
import { Errors, jsonFromZodError } from "@/lib/http";

type Params = { params: { id: string } };

const projectDetailSelect = {
  id: true,
  name: true,
  description: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, name: true, email: true } },
  members: { select: { role: true, user: { select: { id: true, name: true, email: true } } } },
  _count: { select: { tasks: true } },
} as const;

// US03/US07 - Consultation d'un projet, reservee aux membres/responsable
export async function GET(_request: NextRequest, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Errors.unauthenticated();

  const { hasAccess } = await getProjectAccess(params.id, currentUser.id);
  if (!hasAccess) return Errors.forbidden();

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: projectDetailSelect,
  });

  if (!project) return Errors.notFound("Projet");

  return NextResponse.json({ data: project });
}

// Mise a jour du projet - reservee au responsable (owner)
export async function PATCH(request: NextRequest, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Errors.unauthenticated();

  const { hasAccess, isOwner } = await getProjectAccess(params.id, currentUser.id);
  if (!hasAccess) return Errors.forbidden();
  if (!isOwner) return Errors.forbidden();

  const body = await request.json().catch(() => null);
  if (!body) return Errors.forbidden();

  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) return jsonFromZodError(parsed.error);

  const project = await prisma.project.update({
    where: { id: params.id },
    data: parsed.data,
    select: projectDetailSelect,
  });

  return NextResponse.json({ data: project });
}

// Suppression du projet - reservee au responsable (owner).
// Hypothese (documentee) : la suppression est en cascade sur les taches et les membres.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Errors.unauthenticated();

  const { hasAccess, isOwner } = await getProjectAccess(params.id, currentUser.id);
  if (!hasAccess) return Errors.forbidden();
  if (!isOwner) return Errors.forbidden();

  await prisma.project.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "Projet supprime" });
}
