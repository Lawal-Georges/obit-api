// Specification OpenAPI 3.0 de l'API Orbit, utilisee par la page /api-docs (Swagger UI).
// Ecrite a la main pour rester exactement synchronisee avec le code reel des routes
// (src/app/api/**/route.ts) et les schemas Zod (src/lib/validation.ts).

const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
});

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Orbit API",
    version: "1.0.0",
    description:
      "API de suivi de projets et taches. Connectez-vous via POST /login puis testez les autres routes directement ici : le cookie de session est automatiquement reutilise par votre navigateur.",
  },
  servers: [{ url: "/api", description: "Origine courante (local ou production)" }],
  tags: [
    { name: "Authentification" },
    { name: "Projets" },
    { name: "Taches" },
    { name: "Statistiques" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "orbit_session",
        description: "Cookie httpOnly pose par POST /login. Pas de saisie manuelle possible ici : connectez-vous via l'operation de login ci-dessous.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Authentification requise" },
          details: { type: "object", nullable: true },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Alice (responsable)" },
          email: { type: "string", format: "email", example: "alice@orbit.test" },
        },
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          ownerId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          owner: { $ref: "#/components/schemas/User" },
        },
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          projectId: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          dueDate: { type: "string", format: "date-time", nullable: true },
          completedAt: { type: "string", format: "date-time", nullable: true },
          assignedUser: { $ref: "#/components/schemas/User" },
        },
      },
    },
  },
  paths: {
    "/login": {
      post: {
        tags: ["Authentification"],
        summary: "Connexion (US01)",
        description: "Verifie l'email et le mot de passe, pose le cookie de session httpOnly. Comptes de demo : alice@orbit.test / password123 (responsable), bob@orbit.test / password123 (membre), carla@orbit.test / password123 (sans acces au projet demo).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "alice@orbit.test" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Connecte",
            content: { "application/json": { schema: { type: "object", properties: { user: { $ref: "#/components/schemas/User" } } } } },
          },
          "401": errorResponse("Identifiants invalides"),
          "422": errorResponse("Donnees invalides"),
        },
      },
    },
    "/logout": {
      post: {
        tags: ["Authentification"],
        summary: "Deconnexion",
        security: [{ cookieAuth: [] }],
        responses: { "200": { description: "Deconnecte" } },
      },
    },
    "/me": {
      get: {
        tags: ["Authentification"],
        summary: "Utilisateur courant",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { user: { $ref: "#/components/schemas/User" } } } } } },
          "401": errorResponse("Authentification requise"),
        },
      },
    },
    "/projects": {
      get: {
        tags: ["Projets"],
        summary: "Lister mes projets (US03)",
        description: "Retourne les projets dont je suis responsable ou membre.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Project" } } } } } } },
          "401": errorResponse("Authentification requise"),
        },
      },
      post: {
        tags: ["Projets"],
        summary: "Creer un projet (US02)",
        description: "Le createur devient automatiquement responsable (owner).",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Refonte site vitrine" },
                  description: { type: "string", nullable: true },
                  memberIds: { type: "array", items: { type: "string", format: "uuid" } },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Cree", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Project" } } } } } },
          "401": errorResponse("Authentification requise"),
          "422": errorResponse("Donnees invalides"),
        },
      },
    },
    "/projects/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, example: "00000000-0000-0000-0000-000000000001" }],
      get: {
        tags: ["Projets"],
        summary: "Detail d'un projet",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Project" } } } } } },
          "401": errorResponse("Authentification requise"),
          "403": errorResponse("Acces refuse (US07) — ni responsable ni membre"),
          "404": errorResponse("Projet introuvable"),
        },
      },
      patch: {
        tags: ["Projets"],
        summary: "Modifier un projet",
        description: "Reserve au responsable (owner) du projet.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Modifie", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Project" } } } } } },
          "403": errorResponse("Reserve au responsable"),
          "422": errorResponse("Donnees invalides"),
        },
      },
      delete: {
        tags: ["Projets"],
        summary: "Supprimer un projet",
        description: "Reserve au responsable. Supprime en cascade les taches et memberships.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Supprime" },
          "403": errorResponse("Reserve au responsable"),
          "404": errorResponse("Projet introuvable"),
        },
      },
    },
    "/projects/{id}/tasks": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, example: "00000000-0000-0000-0000-000000000001" }],
      get: {
        tags: ["Taches"],
        summary: "Lister les taches d'un projet (US06)",
        description: "Filtrable par status, priority et assigned_user_id.",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] } },
          { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] } },
          { name: "assigned_user_id", in: "query", schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Task" } } } } } } },
          "403": errorResponse("Acces refuse au projet"),
        },
      },
      post: {
        tags: ["Taches"],
        summary: "Creer une tache (US04)",
        description: "Reserve au responsable du projet.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string", example: "Nouvelle tache" },
                  description: { type: "string", nullable: true },
                  status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"], default: "TODO" },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM" },
                  dueDate: { type: "string", format: "date-time", nullable: true },
                  assignedUserId: { type: "string", format: "uuid", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Creee", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Task" } } } } } },
          "403": errorResponse("Reserve au responsable, ou assigne hors du projet"),
          "422": errorResponse("Donnees invalides"),
        },
      },
    },
    "/tasks/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      get: {
        tags: ["Taches"],
        summary: "Detail d'une tache",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Task" } } } } } },
          "403": errorResponse("Acces refuse"),
          "404": errorResponse("Tache introuvable"),
        },
      },
      patch: {
        tags: ["Taches"],
        summary: "Modifier une tache (contenu complet)",
        description: "Reserve au responsable du projet. Pour changer uniquement le statut, voir PATCH /tasks/{id}/status.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string", nullable: true },
                  status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
                  dueDate: { type: "string", format: "date-time", nullable: true },
                  assignedUserId: { type: "string", format: "uuid", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Modifiee", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Task" } } } } } },
          "403": errorResponse("Reserve au responsable"),
        },
      },
      delete: {
        tags: ["Taches"],
        summary: "Supprimer une tache",
        description: "Reserve au responsable du projet.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Supprimee" },
          "403": errorResponse("Reserve au responsable"),
          "404": errorResponse("Tache introuvable"),
        },
      },
    },
    "/tasks/{id}/status": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      patch: {
        tags: ["Taches"],
        summary: "Changer le statut d'une tache (US05)",
        description: "Reserve au responsable du projet OU a l'utilisateur assigne a cette tache.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: { status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Statut modifie", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Task" } } } } } },
          "403": errorResponse("Ni responsable ni assigne a cette tache"),
        },
      },
    },
    "/stats/top-completers": {
      get: {
        tags: ["Statistiques"],
        summary: "Top 5 utilisateurs par taches terminees (US08)",
        description: "Sur les 30 derniers jours, limite aux projets dont je suis responsable.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          user_id: { type: "string", format: "uuid" },
                          user_name: { type: "string" },
                          completed_tasks: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": errorResponse("Authentification requise"),
        },
      },
    },
  },
};
