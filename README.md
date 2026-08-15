# Orbit — API de suivi de projets et taches (Next.js)

# DeV EYUM GEORGES

Adaptation en Next.js (App Router, TypeScript) + Prisma + PostgreSQL du test technique
"Developpeur Laravel — Junior/Mid". Couvre le dossier d'analyse (Phase A, voir
`analysis/README.md`) et l'implementation API complete (Phase B).

## Stack

- **Next.js 14** (App Router, Route Handlers) — sert uniquement une API REST, pas d'UI.
- **Prisma** + **PostgreSQL** — modelisation et acces aux donnees.
- **jose** — JWT de session signes, stockes dans un cookie `httpOnly`.
- **bcryptjs** — hachage des mots de passe.
- **Zod** — validation des entrees (equivalent des Form Requests Laravel).
- **TypeScript strict**.

## Installation

```bash
npm install
cp .env.example .env      # renseigner DATABASE_URL et JWT_SECRET
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed        # cree 3 utilisateurs de demo + 1 projet + taches
npm run dev
```

L'API est servie sur `http://localhost:3000/api`.

Comptes de demonstration (mot de passe `password123`) :

- `alice@orbit.test` — responsable du projet "Refonte site vitrine"
- `bob@orbit.test` — membre du projet, assigne a des taches
- `carla@orbit.test` — sans acces au projet (pour verifier US07 / 403)

## Routes disponibles

| Methode            | Route                       | Acces                                                                                           |
| ------------------ | --------------------------- | ----------------------------------------------------------------------------------------------- |
| POST               | `/api/login`                | public                                                                                          |
| POST               | `/api/logout`               | authentifie                                                                                     |
| GET                | `/api/me`                   | authentifie                                                                                     |
| GET, POST          | `/api/projects`             | authentifie (POST -> createur devient responsable)                                              |
| GET, PATCH, DELETE | `/api/projects/:id`         | membres/responsable (PATCH/DELETE: responsable)                                                 |
| GET, POST          | `/api/projects/:id/tasks`   | membres/responsable (POST: responsable) — filtres `?status=&priority=&assigned_user_id=`        |
| GET, PATCH, DELETE | `/api/tasks/:id`            | membres/responsable (PATCH/DELETE: responsable)                                                 |
| PATCH              | `/api/tasks/:id/status`     | responsable **ou** utilisateur assigne                                                          |
| GET                | `/api/stats/top-completers` | responsable — top 5 utilisateurs par taches terminees (30 derniers jours), limite a ses projets |

Exemple d'appel :

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@orbit.test","password":"password123"}'

curl -b cookies.txt "http://localhost:3000/api/projects"
```

## Choix techniques et architecture

Voir `analysis/README.md` section 3.4 pour la table d'equivalence complete avec les couches
Laravel demandees dans le sujet (Policies -> `src/lib/authorization.ts`, Form Requests ->
`src/lib/validation.ts`, Sanctum -> session JWT en cookie `httpOnly`, API Resources ->
`select` Prisma explicites).

Points notables :

- **Autorisation systematique cote serveur** : chaque route recharge l'acces au projet/tache
  depuis la base (jamais fait confiance a une donnee du client), conformement a US07.
- **Aucune information sensible exposee** : `passwordHash` n'est jamais selectionne dans les
  reponses API (`select` explicite partout, pas de `SELECT *`/`findMany()` sans projection).
- **Prevention des problemes N+1** : les listes (`GET /api/projects`, `GET
/api/projects/:id/tasks`) utilisent des `select`/`include` Prisma qui generent une requete
  SQL par relation chargee (pas une requete par ligne). Voir section "Question
  donnees/performance" ci-dessous pour le detail.
- **Cookies httpOnly + sameSite=lax** pour la session plutot qu'un token expose au
  JavaScript cote client, afin de limiter les risques XSS/CSRF classiques.

## Question donnees / performance (section 6 du sujet)

**5 utilisateurs ayant termine le plus de taches sur les 30 derniers jours** — implemente
dans `src/app/api/stats/top-completers/route.ts` via `prisma.task.groupBy`. Equivalent SQL :

```sql
SELECT
  u.id   AS user_id,
  u.name AS user_name,
  COUNT(t.id) AS completed_tasks
FROM tasks t
JOIN users u ON u.id = t."assignedUserId"
WHERE t.status = 'DONE'
  AND t."completedAt" >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name
ORDER BY completed_tasks DESC
LIMIT 5;
```

**Projets avec leur nombre de taches sans N+1** : ne jamais faire une requete
`SELECT COUNT(*) FROM tasks WHERE projectId = ?` par projet dans une boucle. Utiliser soit
une jointure agregee unique (`GROUP BY project.id`), soit — ce que fait ce projet —
`prisma.project.findMany({ select: { _count: { select: { tasks: true } } } })`, qui genere
une seule requete SQL avec sous-selection agregee au lieu de N requetes supplementaires.

## Debugging (Phase C — a titre de reference)

Le code fourni dans le sujet :

```php
public function update(Request $request, $id)
{
    $task = Task::find($id);
    $task->update($request->all());
    return response()->json($task);
}
```

Problemes identifies (transposables a l'equivalent Next.js) :

1. **Ressource inexistante non geree** : `Task::find($id)` retourne `null` si l'id est
   invalide ; `$task->update(...)` plante alors avec une erreur 500 au lieu d'un 404 propre.
   -> Dans ce projet, chaque route verifie `if (!task) return Errors.notFound(...)` avant
   toute operation.
2. **Mass assignment non controle** : `$request->all()` permet de modifier n'importe quel
   champ, y compris des champs sensibles (`projectId`, `completedAt`, voire des champs
   internes futurs), sans liste blanche.
   -> Ce projet valide un schema Zod strict (`updateTaskSchema`) qui n'accepte que les
   champs autorises.
3. **Aucune autorisation** : n'importe quel utilisateur authentifie peut modifier n'importe
   quelle tache de n'importe quel projet.
   -> `canAccessTask` + verification `isOwner` avant toute ecriture.
4. **Aucune validation de type/valeur** : `status`/`priority` pourraient recevoir une chaine
   arbitraire au lieu d'une valeur de l'enumeration.
   -> Zod (`z.enum([...])`) rejette toute valeur hors enumeration avec un 422 explicite.
5. **Code HTTP toujours 200** : une erreur de validation, un acces refuse ou une ressource
   absente devraient renvoyer respectivement 422, 403, 404 — jamais un 200 par defaut.
6. **Coherence metier absente** : passer une tache a `DONE` ne met a jour aucune trace de
   date de completion, ce qui rend la question US08 (stats) impossible a resoudre finement.
   -> Ce projet renseigne `completedAt` automatiquement au changement de statut.

## Hypotheses (recapitulatif — detail dans `analysis/README.md`)

- Un seul responsable par projet, pas de role administrateur global (H1, H2).
- Gestion des membres uniquement a la creation du projet dans cette version ; pas
  d'endpoint dedie d'ajout/retrait de membres apres coup (H3).
- Retirer un utilisateur d'un projet reinitialise l'assignation de ses taches plutot que de
  les supprimer (H4).
- Suppression definitive (hard delete) de projets/taches (H5).
- `dueDate` optionnelle, sans notification (H6).
- Les statistiques (US08) sont limitees aux projets dont l'utilisateur courant est
  responsable (H7).
- Seul le responsable assigne/reassigne une tache ; la personne assignee ne change que le
  statut (H8).

## Limitations connues (perimetre convenu : Phase A + Phase B)

- Pas d'interface web (API uniquement) — hors perimetre demande pour cette livraison.
- Pas de gestion d'ajout/retrait de membres apres la creation du projet (voir hypothese H3).
- Pas de tests automatises, pas de Docker Compose, pas de rate limiting — correspond au
  bonus (section 7 du sujet), volontairement laisse hors de ce perimetre A+B ; peut etre
  ajoute sur demande.
- Pas de pagination sur les listes (`/api/projects`, `/api/projects/:id/tasks`) — a ajouter
  si le volume de donnees le justifie en production.
- `npx prisma generate` necessite un acces reseau complet (telecharge le moteur Prisma) ;
  a executer dans un environnement avec acces internet standard.
#   o b i t - a p i  
 