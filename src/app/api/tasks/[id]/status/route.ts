import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canAccessTask } from "@/lib/authorization";
import { updateTaskStatusSchema } from "@/lib/validation";
import { Errors, jsonFromZodError } from "@/lib/http";

type Params = { params: { id: string } };

const taskSelect = {
  id: true,
  projectId: true,
  title: true,
  status: true,
  priority: true,
  completedAt: true,
  updatedAt: true,
  assignedUser: { select: { id: true, name: true, email: true } },
} as const;

// US05 - En tant qu'utilisateur assigne a une tache, je peux faire evoluer son statut.
// Le responsable du projet peut egalement le faire.
export async function PATCH(request: NextRequest, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Errors.unauthenticated();

  const { task, hasAccess, isOwner, isAssignee } = await canAccessTask(params.id, currentUser.id);
  if (!task) return Errors.notFound("Tache");
  if (!hasAccess) return Errors.forbidden();
  if (!isOwner && !isAssignee) return Errors.forbidden();

  const body = await request.json().catch(() => null);
  if (!body) return Errors.forbidden();

  const parsed = updateTaskStatusSchema.safeParse(body);
  if (!parsed.success) return jsonFromZodError(parsed.error);

  const { status } = parsed.data;

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
    select: taskSelect,
  });

  return NextResponse.json({ data: updated });
}
