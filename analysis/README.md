# Dossier d'analyse — Orbit (adaptation stack Next.js)

> Ce dossier correspond a la Phase A du test technique (25 points). L'implementation
> (Phase B) utilise Next.js (App Router, TypeScript) + Prisma + PostgreSQL au lieu de
> Laravel/PHP, mais couvre les memes user stories, regles metier et exigences de securite.

## 3.1 Comprehension du besoin

### Reformulation

Orbit veut un outil interne minimal ou chaque equipe cree des **projets**, y decoupe le
travail en **taches** (priorisees et assignees a une personne), suit leur avancement via un
**statut**, et peut filtrer/consulter rapidement ce qui se passe. L'acces est strictement
limite aux personnes rattachees a un projet, et un responsable doit pouvoir mesurer
l'activite de son equipe (nombre de taches terminees par personne).

### Acteurs du systeme

| Acteur | Description |
|---|---|
| **Utilisateur authentifie** | Toute personne connectee. Peut creer des projets, consulter ceux auxquels elle a acces, faire evoluer le statut des taches qui lui sont assignees. |
| **Responsable de projet (owner)** | Utilisateur qui a cree le projet. Peut creer/modifier/supprimer des taches, gerer les membres, modifier/supprimer le projet, consulter les statistiques d'avancement de son equipe. |
| **Membre de projet** | Utilisateur ajoute a un projet sans en etre responsable. Voit le projet et ses taches, peut faire evoluer le statut des taches qui lui sont assignees. |
| **Utilisateur sans acces** | Toute personne ni responsable ni membre d'un projet donne : aucun acces (US07). |

*Hypothese H1 (role global) : il n'existe pas de role "administrateur" global dans cette
version. Chaque utilisateur est simplement responsable ou membre projet par projet. Un role
`ADMIN` transverse pourrait etre ajoute plus tard si Orbit en exprime le besoin.*

### Regles metier implicites

1. Un projet a exactement un responsable (owner), identifiable, qui ne peut pas etre retire
   du projet sans transfert prealable de responsabilite.
2. Une tache appartient a un seul projet et ne peut etre assignee qu'a un utilisateur
   ayant acces a ce projet (responsable ou membre) — impossible d'assigner une tache a une
   personne exterieure au projet.
3. Seul le responsable cree/modifie/supprime une tache dans son integralite ; la personne
   assignee ne peut faire evoluer que le **statut** de sa propre tache.
4. Les statuts et priorites sont des enumerations fermees (`TODO`/`IN_PROGRESS`/`DONE` et
   `LOW`/`MEDIUM`/`HIGH`/`CRITICAL`), pas de texte libre.
5. Toute lecture ou ecriture sur un projet ou une tache est controlee cote serveur en
   fonction de l'appartenance au projet (US07) — jamais uniquement cote client.

### Questions posees au client (et hypotheses retenues en leur absence)

1. **Un projet peut-il avoir plusieurs responsables, ou un seul ?**
   Hypothese H2 : un seul responsable par projet (transfert de responsabilite possible via
   une action dediee, non implementee dans cette version).
2. **Qui peut ajouter/retirer des membres d'un projet — uniquement le responsable ?**
   Hypothese H3 : oui, uniquement le responsable. Modelise mais l'endpoint dedie de gestion
   des membres (ajout/retrait apres creation) est hors perimetre de cette livraison ; seule
   la creation initiale avec une liste de membres est implementee.
3. **Que devient une tache assignee a un utilisateur retire du projet ?**
   Hypothese H4 : l'assignation est reinitialisee (`assignedUserId = null`) plutot que la
   tache supprimee, pour ne pas perdre de travail. Traduit en base par `onDelete: SetNull`.
4. **Un projet ou une tache peuvent-ils etre supprimes, ou seulement archives ?**
   Hypothese H5 : suppression definitive (hard delete) pour rester dans le perimetre du
   test ; un archivage (soft delete) serait recommande en production.
5. **Les echeances (`due_date`) sont-elles obligatoires et donnent-elles lieu a des
   notifications ?**
   Hypothese H6 : `due_date` est optionnelle, sans notification dans cette version.
6. **Le comptage "taches terminees par utilisateur" (US08) est-il global (toute
   l'entreprise) ou limite aux projets du responsable qui consulte la statistique ?**
   Hypothese H7 : limite aux projets dont l'utilisateur courant est responsable — un
   responsable ne doit voir que l'activite de son propre perimetre.
7. **Un utilisateur peut-il s'auto-assigner une tache, ou seul le responsable assigne ?**
   Hypothese H8 : seul le responsable assigne/reassigne une tache (via la mise a jour
   complete) ; la personne assignee ne change que le statut.

## 3.2 User stories retenues et criteres d'acceptation

### US02 — Creation de projet

```
Etant donne qu'un utilisateur est connecte
Quand il soumet un nom de projet valide (>= 2 caracteres)
Alors un projet est cree avec cet utilisateur comme responsable
Et l'utilisateur apparait comme membre (role OWNER) de ce projet
Et le projet est retourne avec un code 201.

Etant donne qu'un utilisateur est connecte
Quand il soumet un nom de projet vide ou trop court
Alors la creation echoue avec un code 422 et un detail de validation par champ.
```

### US04 — Gestion des taches

```
Etant donne qu'un utilisateur est le responsable du projet A
Et que l'utilisateur cible de l'assignation fait partie du projet A
Quand il cree une tache valide (titre, statut, priorite) dans le projet A
Alors la tache est creee dans le projet A avec le statut/priorite fournis (ou par defaut)
Et elle apparait dans GET /api/projects/A/tasks.

Etant donne qu'un utilisateur est membre (non responsable) du projet A
Quand il tente de creer une tache dans le projet A
Alors la requete est rejetee avec un code 403.

Etant donne qu'un responsable tente d'assigner une tache a un utilisateur
Et que cet utilisateur n'a pas acces au projet
Alors la creation/modification est rejetee avec un code 403.
```

### US05 — Mise a jour du statut d'une tache

```
Etant donne qu'un utilisateur est assigne a une tache T du projet A
Quand il envoie PATCH /api/tasks/T/status avec un statut valide (TODO|IN_PROGRESS|DONE)
Alors le statut de T est mis a jour
Et si le nouveau statut est DONE, la date de completion est enregistree.

Etant donne qu'un utilisateur n'est ni responsable du projet A ni assigne a la tache T
Quand il tente de modifier le statut de T
Alors la requete est rejetee avec un code 403.
```

### US07 — Securite

```
Etant donne qu'un utilisateur n'a pas acces au projet A (ni responsable, ni membre)
Quand il appelle GET /api/projects/A ou GET /api/projects/A/tasks
Alors la reponse est 403 (ou 404 si le projet n'existe pas), sans fuite de donnees.

Etant donne qu'un utilisateur est authentifie
Quand il consulte GET /api/tasks/T pour une tache T d'un projet auquel il n'a pas acces
Alors la reponse est 403, meme si l'identifiant T est connu/devine.
```

### US06 — Filtrage (critere complementaire)

```
Etant donne qu'un utilisateur a acces au projet A qui contient des taches de differents
statuts et priorites
Quand il appelle GET /api/projects/A/tasks?status=IN_PROGRESS&priority=HIGH
Alors seules les taches IN_PROGRESS et HIGH du projet A sont retournees.
```

## 3.3 Modelisation

### Entites et relations

- **User** (`id`, `name`, `email` unique, `passwordHash`, `createdAt`)
- **Project** (`id`, `name`, `description?`, `ownerId -> User`, `createdAt`, `updatedAt`)
- **ProjectMember** (`id`, `projectId -> Project`, `userId -> User`, `role: OWNER|MEMBER`) —
  table pivot qui porte la regle d'acces. Le responsable est aussi represente comme membre
  avec `role = OWNER`, ce qui simplifie une seule requete d'acces (`hasAccess = owner OU
  membre`) au lieu de deux verifications distinctes partout dans le code.
- **Task** (`id`, `projectId -> Project`, `title`, `description?`, `status`, `priority`,
  `dueDate?`, `assignedUserId? -> User`, `completedAt?`, `createdAt`, `updatedAt`)

### Schema (ERD simplifie)

```
User (1) ──< ProjectMember >── (1) Project
User (1) ──owns──> (0..N) Project     [Project.ownerId]
User (0..1) ──assigned to──> (0..N) Task
Project (1) ──< (0..N) Task
```

```
+-----------+        +------------------+        +-----------+
|   User    |        |  ProjectMember   |        |  Project  |
+-----------+        +------------------+        +-----------+
| id (PK)   |<---+   | id (PK)          |   +--->| id (PK)   |
| name      |    +---| userId (FK)      |   |    | name      |
| email     |        | projectId (FK)   |---+    | description|
| password  |        | role             |        | ownerId (FK) --> User.id
+-----------+        +------------------+        +-----------+
      ^                                                  |
      | assignedUserId (FK, nullable)                    | 1
      |                                                  v N
      |                                          +-----------------+
      +------------------------------------------|      Task       |
                                                   +-----------------+
                                                   | id (PK)          |
                                                   | projectId (FK)   |
                                                   | title            |
                                                   | status           |
                                                   | priority         |
                                                   | dueDate          |
                                                   | assignedUserId(FK)|
                                                   | completedAt      |
                                                   +-----------------+
```

Voir `prisma/schema.prisma` pour la definition executable (types, index, contraintes).

### Justification des relations

- **Project <-> User via ProjectMember (many-to-many)** plutot qu'une simple liste
  `project.memberIds` : permet d'ajouter un `role` par membre (extensible a d'autres roles
  plus tard) et de faire une seule jointure pour verifier l'acces.
- **Task.assignedUserId nullable avec `onDelete: SetNull`** : refléte l'hypothese H4 — une
  tache ne disparait pas si son assigne quitte le systeme/projet.
- **Index composites** sur `Task(status, priority, assignedUserId)` et
  `Task(assignedUserId, status, completedAt)` : supportent respectivement le filtrage US06
  et la requete de performance US08 (section 6 du sujet).

### Regles d'autorisation a appliquer cote serveur

| Action | Qui |
|---|---|
| Voir un projet / ses taches | responsable **ou** membre du projet |
| Creer/modifier/supprimer le projet | responsable uniquement |
| Creer/modifier (complet)/supprimer une tache | responsable du projet uniquement |
| Modifier uniquement le **statut** d'une tache | responsable du projet **ou** utilisateur assigne a cette tache |
| Assigner une tache a un utilisateur X | uniquement si X a acces au projet |
| Voir les statistiques "taches terminees par utilisateur" | responsable, limite a ses propres projets (hypothese H7) |

## 3.4 Decoupage technique (equivalence avec les couches Laravel demandees)

| Concept Laravel du sujet | Equivalent Next.js utilise |
|---|---|
| Migrations / Modeles Eloquent | `prisma/schema.prisma` + `@prisma/client` genere |
| Form Requests (validation) | Schemas Zod dans `src/lib/validation.ts`, valides au debut de chaque route |
| Policies / Gates | `src/lib/authorization.ts` (`getProjectAccess`, `canAccessTask`) appele explicitement dans chaque Route Handler |
| Sanctum (auth API) | Session JWT signee (lib `jose`) stockee dans un cookie `httpOnly`, verifiee via `src/lib/auth.ts` |
| Controllers | Route Handlers App Router (`src/app/api/**/route.ts`), un fichier par ressource/verbe |
| API Resources | Objets `select` Prisma explicites (jamais `passwordHash` ni champs internes exposes) |
| Services (le cas echeant) | Logique restee simple ; regroupee dans `src/lib/*` (pas de couche Service dediee, le perimetre ne le justifie pas encore) |

Organisation generale :

```
src/
  app/
    api/
      login/route.ts            POST   /api/login
      logout/route.ts           POST   /api/logout
      me/route.ts                GET   /api/me
      projects/route.ts          GET,POST   /api/projects
      projects/[id]/route.ts     GET,PATCH,DELETE  /api/projects/:id
      projects/[id]/tasks/route.ts  GET,POST /api/projects/:id/tasks
      tasks/[id]/route.ts        GET,PATCH,DELETE  /api/tasks/:id
      tasks/[id]/status/route.ts PATCH  /api/tasks/:id/status
      stats/top-completers/route.ts GET /api/stats/top-completers
  lib/
    db.ts             singleton PrismaClient
    auth.ts            hash/verify mot de passe, JWT de session, getCurrentUser()
    authorization.ts   regles d'acces projet/tache (equivalent Policies)
    validation.ts       schemas Zod (equivalent Form Requests)
    http.ts             reponses d'erreur JSON homogenes
prisma/
  schema.prisma
  seed.ts
```
