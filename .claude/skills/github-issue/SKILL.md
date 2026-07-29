---
name: github-issue
description: Rédige une issue GitHub cohérente pour le repo ALPE-Plaisance-du-Touch/Gestionnaire-de-Bourse-ALPE — création d'une nouvelle issue OU enrichissement d'une issue existante via commentaire (sans écraser le body). Interview l'utilisateur sur les détails manquants, applique les conventions de labels du repo (bug/enhancement, user-story, auth/editions/deposit/sales/payouts/labels/billetweb/pwa/ux), cite de vrais fichiers/lignes du repo. Trigger phrases — création « crée une issue pour… », « ouvre un ticket… », « ajoute une issue sur… », « ouvre une issue GitHub pour… ». Refine « rédige l'issue #X », « clean up issue #X », « commente l'issue #X », « enrichis l'issue #X », « transforme cette issue ».
---

# Rédaction d'issue GitHub — repo Gestionnaire de Bourse ALPE

Skill bi-mode :
- **Mode CREATE** : partir d'un brief, générer une issue prête à poster
- **Mode REFINE** : prendre une issue laconique existante, l'enrichir via un commentaire structuré (jamais en écrasant le body)

Repo cible : `ALPE-Plaisance-du-Touch/Gestionnaire-de-Bourse-ALPE` sur `github.com`. CLI : `gh` (authentifiée). Langue : **français**.

## Pre-flight — éviter le travail dupliqué

Si l'utilisateur a déjà donné le numéro et que tu ne l'as pas encore lu :

```bash
gh issue view <number> --comments
```

Saute les étapes déjà couvertes dans un tour précédent.

---

## Mode CREATE — issue à partir d'un brief

### Step 0 — Vérifier qu'une issue similaire n'existe pas déjà (anti-doublon)

**Obligatoire avant toute rédaction.** Chercher une issue existante couvrant le même sujet — un doublon coûte cher.

```bash
# Recherche plein-texte sur titres + bodies, ouvertes ET fermées
gh issue list --repo ALPE-Plaisance-du-Touch/Gestionnaire-de-Bourse-ALPE --state all --search "<2-4 mots-clés du brief>" --limit 20
# Complément par domaine si un label colle
gh issue list --repo ALPE-Plaisance-du-Touch/Gestionnaire-de-Bourse-ALPE --state open --label "<domaine>" --limit 30
```

Lancer **plusieurs** recherches avec des synonymes. Inspecter les candidats sérieux avec `gh issue view <n>`.

- **Doublon probable trouvé** → **ne pas créer**. Le signaler à l'utilisateur et **basculer en Mode REFINE** (enrichir l'issue existante par un commentaire) au lieu d'en ouvrir une nouvelle. Réconcilier les écarts avec l'utilisateur avant de commenter.
- **Doute** → présenter les candidats à l'utilisateur et demander : enrichir l'existante ou créer une nouvelle ?
- **Aucun doublon** → continuer en Step 1.

Ne jamais lancer `gh issue create` sans avoir fait cette recherche.

### Step 1 — Cadrer le contexte

À partir du brief utilisateur :
- Identifier la **nature** → label de type (`bug`, `enhancement`, `documentation`, `question`)
- Déterminer si c'est une **User Story** → ajouter le flag `user-story` (en plus du type)
- Identifier le(s) **domaine(s)** impacté(s) → label(s) domaine (`auth`, `editions`, `deposit`, `sales`, `payouts`, `labels`, `billetweb`, `pwa`, `ux`…)
- Si aucun label domaine ne colle → **proposer d'en créer un** avant de poster

Voir [references/labels.md](references/labels.md) pour la liste complète et descriptions.

### Step 2 — Inspection rapide des fichiers liés

Avant de citer un fichier ou une ligne, **le lire** (`Read`, `Grep`). Pas d'invention. Le repo suit la structure de [CLAUDE.md](../../../CLAUDE.md) :
- Backend : `backend/app/api/v1/endpoints/`, `backend/app/models/`, `backend/app/repositories/`, `backend/app/schemas/`, `backend/app/services/`
- Frontend : `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/api/`, `frontend/src/hooks/`

Si le périmètre est flou, **demander** avant de générer le body.

### Step 3 — Interview (`AskUserQuestion`)

2 à 4 questions seulement. Options mutuellement exclusives. **Toujours un « (Recommandé) » par défaut**. Cibles d'interview selon la nature :

- **bug** : étapes de repro, comportement attendu vs observé, environnement (navigateur / OS / branche), criticité
- **enhancement / user-story** : scope (in/out), critères de « done » observables, impact UX, dépendances
- **documentation** : audience (utilisateur / dev), format (`docs/`, README), localisation
- **question** : la question précise à trancher, indicateurs de réponse

### Step 4 — Générer titre + body

Titre : phrase descriptive en français, claire, sous ~80 chars. Le **domaine passe par les labels, pas par un préfixe `[module]`**. Conventions :
- Bug : décrit le symptôme — `Le scan code-barres échoue sur la page de vente sous Firefox`
- Feature : décrit le résultat — `Bouton « Exporter les paiements en Excel »`
- Préfixe `Domaine — ` toléré quand il clarifie — `Admin — Relancer la synchronisation Billetweb en échec`
- Préfixe `US-XXX : ` toléré pour les user stories rattachées à une US du référentiel (voir `docs/user-stories.md`)

Body selon [templates/create.md](templates/create.md).

- **Bug** : `## Contexte / Repro`, `## Comportement attendu vs observé`, `## Tâches` (checkbox), `## Critères d'acceptation`, `## Liens`
- **User Story** : `## User Story` (En tant que… je veux… afin que…), `## Périmètre`, `## Critères d'acceptation`, `## Liens` — sections conditionnelles `## Architecture`, `## Risques`, `## Hors scope`, `## Estimation`

### Step 5 — Vérifier les labels, puis créer

```bash
gh label list --limit 100
```

Créer ceux qui manquent via `gh label create` AVANT `gh issue create` (voir conventions couleur dans [references/labels.md](references/labels.md)).

Afficher l'issue complète au user. Sur confirmation, poster avec un fichier body (préférer `--body-file` pour le markdown multi-ligne) :

```bash
gh issue create \
  --repo ALPE-Plaisance-du-Touch/Gestionnaire-de-Bourse-ALPE \
  --title "Titre descriptif en français" \
  --label "enhancement" --label "user-story" --label "sales" \
  --body-file - <<'EOF'
... body markdown ...
EOF
```

Retourner l'URL. **Signaler les couplages** (mêmes fichiers / domaines que d'autres issues ouvertes — voir Step 6 Mode REFINE).

---

## Mode REFINE — enrichir une issue existante

### Step 1 — Lire l'issue + ses commentaires

```bash
gh issue view <number> --comments
```

Noter : titre actuel, body (souvent laconique), labels déjà posés, commentaires existants.

### Step 2 — Inspection des fichiers liés

Repérer dans le repo les pages / composants / endpoints touchés. **Vérifier** avant de citer une ligne (`Read`/`Grep`). Si flou → demander.

### Step 3 — Interview (`AskUserQuestion`)

Mêmes règles que Mode CREATE Step 3. **Ne saute jamais l'interview** sous prétexte que la demande semble claire — les body laconiques cachent toujours des choix implicites.

### Step 4 — Poster le rewrite **en commentaire**

**Règle absolue : ne JAMAIS appeler `gh issue edit --body …`** (qui écraserait le body original — la formulation d'origine du déclarant reste la référence). Le commentaire complète, ne remplace pas.

Format du commentaire : voir [templates/comment.md](templates/comment.md).

Post via :

```bash
gh issue comment <number> --repo ALPE-Plaisance-du-Touch/Gestionnaire-de-Bourse-ALPE --body-file - <<'EOF'
... commentaire ...
EOF
```

### Step 5 — MAJ titre + labels en UN seul call

Si le titre n'est pas clair ou des labels manquent, corriger en **un seul** `gh issue edit` (sans `--body`) :

```bash
gh issue edit <number> \
  --repo ALPE-Plaisance-du-Touch/Gestionnaire-de-Bourse-ALPE \
  --title "Titre descriptif corrigé" \
  --add-label "sales" --add-label "user-story"
```

Confirmer avec :

```bash
gh issue view <number> --json title,labels,state
```

### Step 6 — Surface couplings

Si l'issue touche les mêmes fichiers / domaines qu'une autre issue ouverte, le **dire** dans le récap final. Suggérer un bundling éventuel.

Recherche rapide des couplages :

```bash
gh issue list --repo ALPE-Plaisance-du-Touch/Gestionnaire-de-Bourse-ALPE --label "sales" --state open
```

---

## Conventions transverses

- **Langue** : français
- **Pas de secrets** : pas de tokens, mots de passe, clés privées, `DATABASE_URL`, `JWT_SECRET_KEY`, clé API Billetweb. Hostnames publics, noms de tables, et numéros de version OK.
- **Liens** : `[SalesPage.tsx](frontend/src/pages/volunteer/SalesPage.tsx)` ou `[sales.py:42](backend/app/api/v1/endpoints/sales.py#L42)` (relatif au repo) ; `#NN` pour issues liées ; URL pleine pour ressources externes.
- **Labels obligatoires min.** : 1 label de type (`bug` / `enhancement` / `documentation` / `question`).
- **Flag `user-story`** : ajouté en plus du type quand le ticket est une US (vs un bug ponctuel).
- **Validation utilisateur** : toujours afficher l'issue / commentaire complet AVANT exécution.

## What NOT to do

- **Ne pas créer une issue sans avoir cherché un doublon** (`gh issue list --search …`, Step 0) — si une issue couvre déjà le sujet, enrichir en REFINE plutôt que dupliquer
- **Ne pas écraser le body** d'une issue existante (jamais `gh issue edit --body` en mode REFINE)
- **Ne pas sauter l'interview**, même quand le brief paraît évident
- **Ne pas inventer de fichiers / lignes** — vérifier avec `Read`/`Grep` d'abord
- **Ne pas assumer la nature (bug vs feature)** — demander si flou
- **Ne pas chaîner les `gh issue edit`** : un seul call pour titre + labels
- **Ne pas ajouter de milestone / assignee / project** tant que l'utilisateur n'en a pas convenu
- **Ne pas inclure de signature « Generated with Claude Code »** ou équivalent dans le body / commentaire

## Quand cette skill s'applique

Trigger sur l'une des phrases :
- « crée une issue pour … » / « ouvre un ticket … » / « ajoute une issue sur … »
- « rédige l'issue #X » / « clean up #X » / « transforme cette issue »
- « commente l'issue #X » / « enrichis l'issue #X »
- « fais la même chose pour l'issue #X » (suite d'un refine)

**Ne pas trigger** quand l'utilisateur veut juste *lire*, *résumer*, ou *lister* des issues.

## Référence

- Labels du repo : [references/labels.md](references/labels.md)
- Exemples : [references/examples.md](references/examples.md)
- Templates : [templates/create.md](templates/create.md), [templates/comment.md](templates/comment.md)
