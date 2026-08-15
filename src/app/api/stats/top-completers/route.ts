import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Errors } from "@/lib/http";

// US08 + question "donnees/performance" du sujet :
// Top 5 des utilisateurs ayant termine le plus de taches durant les 30 derniers jours.
//
// Hypothese documentee (analysis/README.md) : un responsable ne voit les stats que sur les
// projets dont IL est le responsable (pas de vision globale multi-equipes dans cette version).
//
// GET /api/stats/top-completers
export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Errors.unauthenticated();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ownedProjectIds = (
    await prisma.project.findMany({ where: { ownerId: currentUser.id }, select: { id: true } })
  ).map((p) => p.id);

  if (ownedProjectIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const grouped = await prisma.task.groupBy({
    by: ["assignedUserId"],
    where: {
      projectId: { in: ownedProjectIds },
      status: "DONE",
      completedAt: { gte: thirtyDaysAgo },
      assignedUserId: { not: null },
    },
    _count: { _all: true },
    orderBy: { _count: { assignedUserId: "desc" } },
    take: 5,
  });

  const userIds = grouped.map((g) => g.assignedUserId).filter((id): id is string => !!id);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userNameById = new Map(users.map((u) => [u.id, u.name]));

  const data = grouped.map((g) => ({
    user_id: g.assignedUserId,
    user_name: g.assignedUserId ? userNameById.get(g.assignedUserId) ?? null : null,
    completed_tasks: g._count._all,
  }));

  return NextResponse.json({ data });
}
