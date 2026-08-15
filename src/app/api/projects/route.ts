import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createProjectSchema } from "@/lib/validation";
import { Errors, jsonFromZodError } from "@/lib/http";

const projectListSelect = {
  id: true,
  name: true,
  description: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, name: true, email: true } },
  _count: { select: { tasks: true, members: true } },
} as const;

// US03 - Consultation des projets auxquels l'utilisateur a acces (owner ou membre)
export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Errors.unauthenticated();

  const projects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: currentUser.id }, { members: { some: { userId: currentUser.id } } }],
    },
    select: projectListSelect,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: projects });
}

// US02 - Creation de projet. Le createur devient automatiquement responsable (owner).
export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Errors.unauthenticated();

  const body = await request.json().catch(() => null);
  if (!body) return Errors.forbidden();

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) return jsonFromZodError(parsed.error);

  const { name, description, memberIds } = parsed.data;

  // On ignore silencieusement les IDs invalides (utilisateurs inexistants) plutot
  // que d'echouer toute la creation : hypothese documentee dans analysis/README.md.
  const uniqueMemberIds = Array.from(new Set(memberIds)).filter((id) => id !== currentUser.id);
  const existingUsers = uniqueMemberIds.length
    ? await prisma.user.findMany({ where: { id: { in: uniqueMemberIds } }, select: { id: true } })
    : [];
  const validMemberIds = existingUsers.map((u) => u.id);

  const project = await prisma.project.create({
    data: {
      name,
      description: description ?? null,
      ownerId: currentUser.id,
      members: {
        create: [
          { userId: currentUser.id, role: "OWNER" },
          ...validMemberIds.map((userId) => ({ userId, role: "MEMBER" as const })),
        ],
      },
    },
    select: projectListSelect,
  });

  return NextResponse.json({ data: project }, { status: 201 });
}
