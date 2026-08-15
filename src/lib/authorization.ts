import { prisma } from "@/lib/db";

export type ProjectAccess = {
  hasAccess: boolean;
  isOwner: boolean;
};

/**
 * Regles d'autorisation (voir analysis/README.md section 3.3/3.4) :
 * - Un utilisateur a acces a un projet s'il en est le responsable (owner) ou un membre.
 * - Seul le responsable peut : modifier/supprimer le projet, creer/modifier/supprimer des taches,
 *   reassigner une tache.
 * - Un membre assigne a une tache peut uniquement changer le statut de CETTE tache.
 * - Toute autre combinaison => 403 (US07).
 */
export async function getProjectAccess(projectId: string, userId: string): Promise<ProjectAccess> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      members: { where: { userId }, select: { userId: true } },
    },
  });

  if (!project) return { hasAccess: false, isOwner: false };

  const isOwner = project.ownerId === userId;
  const isMember = project.members.length > 0;

  return { hasAccess: isOwner || isMember, isOwner };
}

export async function canAccessTask(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true, assignedUserId: true },
  });

  if (!task) return { task: null, hasAccess: false, isOwner: false, isAssignee: false };

  const { hasAccess, isOwner } = await getProjectAccess(task.projectId, userId);
  const isAssignee = task.assignedUserId === userId;

  return { task, hasAccess, isOwner, isAssignee };
}
