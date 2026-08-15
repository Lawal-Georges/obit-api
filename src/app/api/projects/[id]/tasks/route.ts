import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getProjectAccess } from "@/lib/authorization";
import { createTaskSchema, taskFilterSchema } from "@/lib/validation";
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

// US04/US06 - Liste des taches d'un projet, filtrable par status / priority / assigned_user_id
// GET /api/projects/10/tasks?status=IN_PROGRESS&priority=HIGH&assigned_user_id=...
export async function GET(request: NextRequest, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Errors.unauthenticated();

  const { hasAccess } = await getProjectAccess(params.id, currentUser.id);
  if (!hasAccess) return Errors.forbidden();

  const searchParams = request.nextUrl.searchParams;
  const parsedFilters = taskFilterSchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    assigned_user_id: searchParams.get("assigned_user_id") ?? undefined,
  });
  if (!parsedFilters.success) return jsonFromZodError(parsedFilters.error);

  const { status, priority, assigned_user_id } = parsedFilters.data;

  const tasks = await prisma.task.findMany({
    where: {
      projectId: params.id,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assigned_user_id ? { assignedUserId: assigned_user_id } : {}),
    },
    select: taskSelect,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ data: tasks });
}

// US04 - Creation d'une tache, reservee au responsable du projet.
export async function POST(request: NextRequest, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Errors.unauthenticated();

  const { hasAccess, isOwner } = await getProjectAccess(params.id, currentUser.id);
  if (!hasAccess) return Errors.forbidden();
  if (!isOwner) return Errors.forbidden();

  const body = await request.json().catch(() => null);
  if (!body) return Errors.forbidden();

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return jsonFromZodError(parsed.error);

  const { title, description, status, priority, dueDate, assignedUserId } = parsed.data;

  // Un utilisateur assigne doit faire partie du projet (regle metier implicite, cf analysis).
  if (assignedUserId) {
    const { hasAccess: assigneeHasAccess } = await getProjectAccess(params.id, assignedUserId);
    if (!assigneeHasAccess) {
      return Errors.forbidden();
    }
  }

  const task = await prisma.task.create({
    data: {
      projectId: params.id,
      title,
      description: description ?? null,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedUserId: assignedUserId ?? null,
      completedAt: status === "DONE" ? new Date() : null,
    },
    select: taskSelect,
  });

  return NextResponse.json({ data: task }, { status: 201 });
}
