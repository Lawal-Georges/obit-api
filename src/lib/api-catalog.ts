export type QueryParam = {
  name: string;
  enumValues?: string[];
  placeholder?: string;
};

export type ApiRoute = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  role: string;
  access: string;
  // Utilises par l'explorateur interactif (/api-docs) pour construire le formulaire :
  queryParams?: QueryParam[];
  sampleBody?: Record<string, unknown>;
};

export type ApiGroup = {
  name: string;
  intro: string;
  routes: ApiRoute[];
};

export const apiGroups: ApiGroup[] = [
  {
    name: "Authentification",
    intro:
      "Ouvre, verifie et ferme la session. La session est un JWT signe stocke dans un cookie httpOnly — jamais expose au JavaScript cote client.",
    routes: [
      {
        method: "POST",
        path: "/api/login",
        role: "Verifie l'email et le mot de passe, puis pose le cookie de session.",
        access: "Public",
        sampleBody: { email: "alice@orbit.test", password: "password123" },
      },
      {
        method: "POST",
        path: "/api/logout",
        role: "Invalide le cookie de session courant.",
        access: "Authentifie",
      },
      {
        method: "GET",
        path: "/api/me",
        role: "Renvoie l'identite de l'utilisateur actuellement connecte.",
        access: "Authentifie",
      },
    ],
  },
  {
    name: "Projets",
    intro:
      "Un projet a un responsable (owner) et des membres. Seul le responsable modifie ou supprime ; membres et responsable peuvent tous deux consulter (US03/US07).",
    routes: [
      {
        method: "GET",
        path: "/api/projects",
        role: "Liste les projets dont je suis responsable ou membre.",
        access: "Authentifie",
      },
      {
        method: "POST",
        path: "/api/projects",
        role: "Cree un projet ; le createur en devient automatiquement le responsable.",
        access: "Authentifie",
        sampleBody: { name: "Projet test", description: "Cree depuis l'explorateur" },
      },
      {
        method: "GET",
        path: "/api/projects/:id",
        role: "Detail d'un projet (membres, nombre de taches).",
        access: "Responsable ou membre du projet",
      },
      {
        method: "PATCH",
        path: "/api/projects/:id",
        role: "Modifie le nom ou la description du projet.",
        access: "Responsable uniquement",
        sampleBody: { description: "Description mise a jour" },
      },
      {
        method: "DELETE",
        path: "/api/projects/:id",
        role: "Supprime le projet ainsi que ses taches et memberships.",
        access: "Responsable uniquement",
      },
    ],
  },
  {
    name: "Taches",
    intro:
      "Une tache appartient a un projet et peut etre assignee a un membre de ce projet. Le responsable gere le contenu complet ; la personne assignee ne fait evoluer que le statut (US04/US05).",
    routes: [
      {
        method: "GET",
        path: "/api/projects/:id/tasks",
        role: "Liste les taches d'un projet, filtrable par status, priority, assigned_user_id.",
        access: "Responsable ou membre du projet",
        queryParams: [
          { name: "status", enumValues: ["", "TODO", "IN_PROGRESS", "DONE"] },
          { name: "priority", enumValues: ["", "LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          { name: "assigned_user_id", placeholder: "uuid (optionnel)" },
        ],
      },
      {
        method: "POST",
        path: "/api/projects/:id/tasks",
        role: "Cree une tache dans le projet (titre, priorite, assignation...).",
        access: "Responsable du projet",
        sampleBody: { title: "Nouvelle tache", priority: "HIGH" },
      },
      {
        method: "GET",
        path: "/api/tasks/:id",
        role: "Detail d'une tache.",
        access: "Responsable ou membre du projet parent",
      },
      {
        method: "PATCH",
        path: "/api/tasks/:id",
        role: "Modifie le contenu complet d'une tache (titre, priorite, assignation...).",
        access: "Responsable du projet",
        sampleBody: { priority: "CRITICAL" },
      },
      {
        method: "PATCH",
        path: "/api/tasks/:id/status",
        role: "Fait evoluer uniquement le statut (TODO / IN_PROGRESS / DONE).",
        access: "Responsable du projet ou utilisateur assigne",
        sampleBody: { status: "DONE" },
      },
      {
        method: "DELETE",
        path: "/api/tasks/:id",
        role: "Supprime la tache.",
        access: "Responsable du projet",
      },
    ],
  },
  {
    name: "Statistiques",
    intro:
      "Vue synthetique de l'activite pour un responsable, limitee a ses propres projets (US08).",
    routes: [
      {
        method: "GET",
        path: "/api/stats/top-completers",
        role: "Top 5 des utilisateurs par nombre de taches terminees sur les 30 derniers jours.",
        access: "Responsable (scope: ses projets)",
      },
    ],
  },
];

export const totalRouteCount = apiGroups.reduce((sum, g) => sum + g.routes.length, 0);
