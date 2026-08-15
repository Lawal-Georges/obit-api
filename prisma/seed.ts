import { PrismaClient, TaskPriority, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@orbit.test" },
    update: {},
    create: { name: "Alice (responsable)", email: "alice@orbit.test", passwordHash: password },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@orbit.test" },
    update: {},
    create: { name: "Bob (membre)", email: "bob@orbit.test", passwordHash: password },
  });

  const carla = await prisma.user.upsert({
    where: { email: "carla@orbit.test" },
    update: {},
    create: { name: "Carla (hors projet)", email: "carla@orbit.test", passwordHash: password },
  });

  const project = await prisma.project.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Refonte site vitrine",
      description: "Projet de demo pour le test technique Orbit",
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: "OWNER" },
          { userId: bob.id, role: "MEMBER" },
        ],
      },
    },
  });

  await prisma.task.createMany({
    data: [
      {
        projectId: project.id,
        title: "Maquette page d'accueil",
        description: "Proposer 2 variantes",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        assignedUserId: bob.id,
        completedAt: new Date(),
      },
      {
        projectId: project.id,
        title: "Integration header",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        assignedUserId: bob.id,
      },
      {
        projectId: project.id,
        title: "Choix de l'hebergeur",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        assignedUserId: alice.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed termine.");
  console.log("Comptes de demo (mot de passe: password123):");
  console.log(`- ${alice.email} (responsable du projet "${project.name}")`);
  console.log(`- ${bob.email} (membre)`);
  console.log(`- ${carla.email} (sans acces au projet, pour tester US07)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
