# Labels — repo `ALPE-Plaisance-du-Touch/Gestionnaire-de-Bourse-ALPE`

Chaque issue **doit** avoir au minimum 1 label de **type**. Les labels de **domaine** et le flag **`user-story`** s'ajoutent selon le contexte.

## Famille type — nature du ticket

| Label | Sens | Couleur |
|---|---|---|
| `bug` | Quelque chose ne fonctionne pas | `#d73a4a` |
| `enhancement` | Nouvelle fonctionnalité ou amélioration | `#a2eeef` |
| `documentation` | Création / mise à jour de doc | `#0075ca` |
| `question` | Information à clarifier / décision à trancher | `#d876e3` |

> `bug` et `enhancement` sont **mutuellement exclusifs**. `documentation` / `question` peuvent se combiner avec un autre type si besoin.

## Flag `user-story`

| Label | Sens | Couleur |
|---|---|---|
| `user-story` | Le ticket est une User Story (vs un bug ponctuel ou une tâche technique) | `#c5def5` |

Se pose **en plus** du type (`enhancement` + `user-story`, ou `bug` + `user-story` si la US décrit un défaut). Une grosse US porte typiquement `enhancement, user-story` + 1-2 domaines. Référentiel des US : `docs/user-stories.md` (US-001 à US-016).

## Famille domaine — périmètre fonctionnel

À utiliser quand l'issue cible un sous-système précis. Domaines suggérés, alignés sur l'architecture du projet (voir [CLAUDE.md](../../../CLAUDE.md)) :

| Label | Périmètre | Fichiers clés |
|---|---|---|
| `auth` | Authentification, JWT, RBAC, invitations, activation de compte | `backend/app/api/v1/endpoints/auth.py`, `backend/app/api/v1/endpoints/invitations.py`, `frontend/src/contexts/AuthContext.tsx` |
| `editions` | Gestion des éditions, configuration, créneaux de dépôt, transitions de statut | `backend/app/api/v1/endpoints/editions.py`, `backend/app/api/v1/endpoints/deposit_slots.py`, `frontend/src/pages/admin/` |
| `deposit` | Déclaration d'articles, listes déposants, revue de dépôt (accept/reject/edit) | `backend/app/api/v1/endpoints/articles.py`, `frontend/src/pages/depositor/`, `frontend/src/components/articles/` |
| `sales` | Scan, encaissement, panier, vente bénévole | `backend/app/api/v1/endpoints/sales.py`, `frontend/src/pages/volunteer/SalesPage.tsx`, `frontend/src/components/sales/` |
| `payouts` | Calcul de commission, reversements, reçus PDF | `backend/app/api/v1/endpoints/payouts.py`, `frontend/src/components/payouts/` |
| `labels` | Génération d'étiquettes PDF, QR codes, impression | `backend/app/api/v1/endpoints/labels.py`, `backend/app/services/pdf.py` |
| `billetweb` | Import CSV / API Billetweb, synchronisation des inscriptions | `backend/app/api/v1/endpoints/billetweb.py`, `frontend/src/api/billetweb.ts` |
| `pwa` | Mode offline, service worker, IndexedDB, synchronisation | `frontend/src/services/`, `frontend/src/hooks/useOfflineSales.ts` |
| `ux` | Expérience utilisateur / interface — pages, composants, CSS, responsive, accessibilité | `frontend/src/pages/`, `frontend/src/components/ui/` |

### Domaines non encore couverts par un label

Le repo n'a pas (encore) de label pour ces sous-systèmes. **Proposer d'en créer un** si l'issue y est centrée plutôt que d'utiliser un domaine approximatif :

| Domaine suggéré | Couvre | Fichiers |
|---|---|---|
| `tickets` | Système de messagerie déposant↔staff | `backend/app/api/v1/endpoints/tickets.py`, `frontend/src/pages/tickets/` |
| `dashboard` | Tableau de bord admin, stats live | `frontend/src/pages/admin/AdminDashboardPage.tsx` |
| `gdpr` | RGPD, export/suppression de données, audit | `backend/app/api/v1/endpoints/audit.py` |
| `ops` | Docker, déploiement, nginx/SSL, backup/restore | `docker-compose.prod.yml`, `scripts/` |
| `config` | Paramètres admin, email support configurable | `backend/app/api/v1/endpoints/config.py`, `frontend/src/hooks/useConfig.ts` |
| `security` | Headers de sécurité, durcissement, audit OWASP | `backend/app/main.py` |

## Labels GitHub par défaut

Présents dans le repo, utilisables ponctuellement : `duplicate`, `invalid`, `wontfix`, `good first issue`, `help wanted`. Ne pas en abuser — préférer les labels type/domaine. Les labels `dependencies` / `javascript` sont gérés par Dependabot — ne pas les poser à la main.

## Création / vérification des labels

Avant de créer une issue, vérifier que tous les labels nécessaires existent :

```bash
gh label list --limit 100
```

Créer ceux qui manquent (proposer d'abord à l'utilisateur) :

```bash
gh label create "sales"   --color "0e8a16" --description "Scan, encaissement, panier, vente bénévole"
gh label create "deposit" --color "5319e7" --description "Déclaration d'articles, listes déposants, revue de dépôt"
```

Convention couleurs :
- type : conserver les couleurs GitHub par défaut (`bug` rouge, `enhancement` cyan…)
- domaine : couleurs vives distinctes (palette libre, éviter de doublonner une couleur de type)
- `user-story` : bleu pâle `#c5def5`
