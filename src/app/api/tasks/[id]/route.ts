import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canAccessTask, getProjectAccess } from "@/lib/authorization";
import { updateTaskSchema } from "@/lib/validation";
import { Errors, jsonFromZodError } from "@/lib/http";

type Params = { params: { id: string } };

const taskSelect = {
  id: true,
  projectId: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  assignedUser: { select: { id: true, name: true, email: true } },
} as const;

export async function GET(_request: NextRequest, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Errors.unauthenticated();

  const { task, hasAccess } = await canAccessTask(params.id, currentUser.id);
  if (!task) return Errors.notFound("Tache");
  if (!hasAccess) return Errors.forbidden();

  const full = await prisma.task.findUnique({ where: { id: params.id }, select: taskSelect });
  return NextResponse.json({ data: full });
}

// US05 - Mise a jour complete d'une tache : reservee au responsable du projet.
// (Le changement de statut par la personne assignee passe par PATCH /api/tasks/{id}/status)
export async function PATCH(request: NextRequest, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Errors.unauthenticated();

  const { task, hasAccess, isOwner } = await canAccessTask(params.id, currentUser.id);
  if (!task) return Errors.notFound("Tache");
  if (!hasAccess || !isOwner) return Errors.forbidden();

  const body = await request.json().catch(() => null);
  if (!body) return Errors.forbidden();

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) return jsonFromZodError(parsed.error);

  const { assignedUserId, dueDate, status, ...rest } = parsed.data;

  if (assignedUserId) {
    const { hasAccess: assigneeHasAccess } = await getProjectAccess(task.projectId, assignedUserId);
    if (!assigneeHasAccess) return Errors.forbidden();
  }

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(assignedUserId !== undefined ? { assignedUserId } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(status !== undefined
        ? { status, completedAt: status === "DONE" ? new Date() : null }
        : {}),
    },
    select: taskSelect,
  });

  return NextResponse.json({ data: updated });
}

// Suppression - reservee au responsable du projet.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Errors.unauthenticated();

  const { task, hasAccess, isOwner } = await canAccessTask(params.id, currentUser.id);
  if (!task) return Errors.notFound("Tache");
  if (!hasAccess || !isOwner) return Errors.forbidden();

  await prisma.task.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "Tache supprimee" });
}
