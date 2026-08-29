---
id: DOC-140-DEMO
title: Démo du parcours de dépôt
status: draft
version: 0.1.0
updated: 2026-08-29
owner: ALPE Plaisance du Touch
links:
  - rel: operations
    href: operations.md
    title: Opérations & Runbooks
  - rel: user-stories
    href: user-stories.md
    title: User stories
---

# Démo du parcours de dépôt

Scénario de démonstration couvrant quatre étapes : inscription des participants,
saisie des listes par un déposant, validation au dépôt par un bénévole, puis
impression des étiquettes.

Durée indicative : 20 à 30 minutes selon les questions.

## Avant de commencer

### Environnement

```bash
make dev          # backend, frontend, base, MailHog
make migrate      # applique les migrations
make seed         # comptes, éditions et créneaux de démonstration
```

Application : <http://localhost:5173> — MailHog : <http://localhost:8025>

MailHog capture tous les courriels sortants. Il sert à montrer l'invitation reçue
par un déposant sans envoyer quoi que ce soit à l'extérieur.

### Comptes

`make seed` crée un compte par rôle. Mots de passe dans
[backend/scripts/seed.py](../backend/scripts/seed.py) :

| Rôle | Identifiant | Mot de passe |
|---|---|---|
| Administrateur | `admin@alpe-bourse.fr` | `Admin123!` |
| Gestionnaire | `manager@alpe-bourse.fr` | `Manager123!` |
| Bénévole | `volunteer@alpe-bourse.fr` | `Volunteer123!` |
| Déposant | `deposant@example.com` | `Deposant123!` |

Ces identifiants ne valent que pour l'environnement de développement local.

La démo fait intervenir quatre rôles successivement. Ouvre **une fenêtre de
navigation privée par rôle** : les sessions se remplacent l'une l'autre dans un
même profil, et se reconnecter à chaque étape casse le rythme.

### Mode formation : le point à ne pas manquer

Les statuts d'une édition avancent normalement selon les dates configurées. Une
démo doit traverser plusieurs phases en quelques minutes, ce qui n'est possible
que sur une **édition en formation** : elle seule autorise le forçage de statut
(`POST /editions/{id}/force-status`).

Sur la page de l'édition, onglet **Actions**, section « Mode formation » →
**Activer**. Un bandeau signale ensuite l'édition partout dans l'application, et
les changements d'étape deviennent manuels.

Active le mode formation **avant** de commencer, sinon l'étape 3 sera bloquée.

## Étape 1 — Inscrire les participants

**Rôle : gestionnaire — Statut requis : Brouillon ou Inscriptions ouvertes**

Page de l'édition → onglet **Déposants** → section « Inscriptions Billetweb ».

Deux boutons y apparaissent, et un seul est disponible sans configuration
préalable :

- **Ajouter un déposant** — saisie manuelle, toujours disponible. C'est le
  chemin à utiliser pour la démo.
- **Synchroniser via API** — n'apparaît que si un événement Billetweb est
  associé à l'édition, ce qui suppose des identifiants API renseignés dans
  *Administration → Paramètres → Billetweb*.

> **Il n'existe plus d'import par fichier CSV.** L'import CSV de la v0.4 a été
> remplacé par l'intégration API en v0.19 : le service de lecture de CSV subsiste
> dans le code, mais aucune route HTTP ne l'expose et l'interface ne propose
> aucun téléversement. Les fichiers de `tests/data/billetweb/` sont des fixtures
> de tests, pas un chemin utilisable en démonstration.

Pour montrer l'arrivée d'un déposant par courriel, passe plutôt par
*Administration → Invitations*, qui accepte un CSV
(`email,prenom,nom,type_liste`, exemple dans
[tests/data/valid/bulk_invitations.csv](../tests/data/valid/bulk_invitations.csv)).
L'invitation est visible dans MailHog, et le lien d'activation fonctionne.

**À montrer :** le déposant ajouté apparaît immédiatement dans la liste, avec son
type de liste (Standard, 1000 ou 2000) et son créneau de dépôt.

## Étape 2 — Saisir une liste d'articles

**Rôle : déposant — Statut requis : Inscriptions ouvertes**

Connexion avec `deposant@example.com`, puis **Mes listes** → créer une liste →
ajouter des articles.

Le compte seedé possède déjà une liste avec 6 articles : pratique pour montrer
l'état d'arrivée sans ressaisir, mais crée-en une nouvelle si tu veux dérouler le
formulaire de bout en bout.

**Attention à la date limite de déclaration.** Passée cette date, la saisie est
refusée. L'édition seedée la fixe au **21 février 2026** : vérifie-la dans
l'onglet Configuration et repousse-la avant la démo si nécessaire.

**À montrer :** le contrôle des quantités par catégorie, le prix indicatif, et le
passage de la liste en « validée » par le déposant lui-même.

## Étape 3 — Valider au dépôt

**Rôle : bénévole — Statut requis : Dépôt**

Force d'abord l'édition en statut **Dépôt** (onglet Actions).

Menu **Revue des listes au dépôt**. Le bénévole ouvre une liste et traite chaque
article : accepter, refuser ou corriger. Puis il clôt la revue.

**À montrer :** un refus motivé et une correction de prix, pour illustrer que la
déclaration du déposant n'est pas prise telle quelle. Le suivi d'avancement des
déclarations donne la vue d'ensemble.

## Étape 4 — Imprimer les étiquettes

**Rôle : gestionnaire — Statut requis : Dépôt**

Menu **Étiquettes** → *Gestion des étiquettes* → choisir le mode de génération,
puis générer le PDF.

**À montrer :** le code-barres et le QR code d'un article, et le fait que les
planches sont produites en PDF séparés par liste — ce qui permet de remettre à
chaque déposant ses propres étiquettes.

## Réinitialiser entre deux démos

```bash
make down
docker volume rm gestionnaire-de-bourse-alpe_db-data
make dev && make migrate && make seed
```

La base repart vierge. Compte deux à trois minutes.

## Pièges connus

- **Le mode formation conditionne tout.** Sans lui, pas de forçage de statut,
  donc pas de passage à l'étape 3.
- **La date limite de déclaration** bloque silencieusement l'étape 2 si elle est
  dépassée.
- **Vite peut servir du code périmé** après une modification faite depuis l'hôte
  (voir [.claude/rules/testing.md](../.claude/rules/testing.md)). Sans
  conséquence si tu ne modifies rien pendant la démo ; sinon
  `docker compose restart frontend`.
- **Les sessions se chassent l'une l'autre** dans un même profil de navigateur.
