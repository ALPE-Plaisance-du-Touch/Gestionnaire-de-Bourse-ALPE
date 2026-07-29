# Template — création d'issue GitHub (Mode CREATE)

Deux structures selon la nature : **bug** (concis, orienté repro) et **user story / enhancement** (orienté valeur + périmètre). Choisir selon le label de type.

---

## A. Body pour un bug (`bug`)

```markdown
## Contexte / Repro

<Quand et comment le problème survient. Étapes de reproduction numérotées si possible.
Environnement : navigateur / OS / branche / édition concernée. Citer le fichier
ou la ligne suspectée si identifié.>

Étapes :
1. <action>
2. <action>
3. <ce qui casse>

## Comportement attendu vs observé

- **Attendu** : <ce qui devrait se passer>
- **Observé** : <ce qui se passe réellement, message d'erreur, capture>

## Tâches

- [ ] Diagnostiquer le problème
- [ ] Corriger <fichier / composant>
- [ ] Vérifier la non-régression sur <cas adjacent>

## Critères d'acceptation

- [ ] <Comportement observable corrigé, du POV utilisateur>
- [ ] <Pas de régression sur Z>

## Liens

- Backend : [<endpoint>](backend/app/api/v1/endpoints/...) / [<service>](backend/app/services/...)
- Frontend : [<page>](frontend/src/pages/...) / [<composant>](frontend/src/components/...)
- Doc : [<section>](docs/...) si pertinent
- Issues liées : #NN
```

---

## B. Body pour une user story / enhancement (`enhancement` + `user-story`)

```markdown
## User Story

> **En tant que** <rôle : déposant / bénévole / gestionnaire / administrateur>,
> **je veux** <capacité concrète>
> **afin que** <bénéfice / valeur>.

Cas d'usage :
- <situation 1 où la feature sert>
- <situation 2>

## Périmètre

### Inclus (V1)
- <bullet actionnable issu de l'interview>
- <choix par défaut recommandé et validé par l'utilisateur>

### Hors scope V1
- <ce qui ressemble mais relève d'une autre issue>

## Critères d'acceptation

- [ ] <Comportement observable 1, du POV utilisateur>
- [ ] <Comportement observable 2>
- [ ] <Pas de régression sur Z>

## Liens

- Backend : [<endpoint>](backend/app/api/v1/endpoints/...) / [<service>](backend/app/services/...)
- Frontend : [<page>](frontend/src/pages/...) / [<composant>](frontend/src/components/...)
- Spec : [<section>](docs/user-stories.md) ou [<doc>](docs/...)
- Issues liées : #NN
```

---

## Sections conditionnelles (US complexes uniquement)

N'ajouter que si l'utilisateur a fourni la matière — ne pas remplir de vide.

### Architecture / Implémentation suggérée

```markdown
## Architecture

<Migration Alembic, nouveaux modèles SQLAlchemy, schémas Pydantic, endpoints API,
modules frontend (api/, components/, pages/)… Sert d'amorce pour l'implémenteur,
sans figer le design.>
```

### Risques et points ouverts

```markdown
## Risques et points ouverts

| Risque | Mitigation |
|---|---|
| <risque> | <parade> |

Points à arbitrer avant dev :
1. <question> — **Reco : <réponse>.**
```

### Estimation

```markdown
## Estimation

| Lot | Charge |
|---|---|
| Backend | ~X j |
| Frontend | ~X j |
| **Total** | **~X j** |
```

---

## Règles de rédaction

- Pas de signature « Generated with Claude Code » ou équivalent
- Pas de credentials, tokens, mots de passe, `DATABASE_URL`, `JWT_SECRET_KEY`, clé API Billetweb
- Citer les fichiers en relatif au repo : `backend/app/api/v1/endpoints/sales.py`, `frontend/src/pages/volunteer/SalesPage.tsx`
- Préférer les liens markdown explicites aux URLs nues
- Checklist d'acceptation : 2 à 6 items, observables et vérifiables
- `## Contexte` ou la US : concis — déporter les détails techniques dans `## Architecture`
- Si l'issue touche une US du référentiel (`docs/user-stories.md`), citer son identifiant `US-XXX`
