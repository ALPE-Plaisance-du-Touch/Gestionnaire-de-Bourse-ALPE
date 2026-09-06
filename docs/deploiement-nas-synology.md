---
id: DOC-150-DEVJ
title: Environnement de test dev-j sur NAS Synology
status: draft
version: 0.3.0
updated: 2026-09-01
owner: ALPE Plaisance du Touch
links:
  - rel: deployment
    href: deploiement.md
    title: Déploiement
  - rel: demo
    href: demo-parcours-depot.md
    title: Démo du parcours de dépôt
---

# Environnement de test dev-j sur NAS Synology

Installation de la branche `dev-j` sur un NAS Synology, accessible en HTTPS,
destinée aux démonstrations et aux tests. Les données y sont fictives et les
courriels ne sortent jamais de la machine.

Une fois installé, mettre à jour tient en deux gestes : récupérer les images,
redémarrer.

## Principe

Les images sont **construites par GitHub Actions** à chaque push sur `dev-j`,
puis publiées sur GHCR :

```
ghcr.io/alpe-plaisance-du-touch/bourse-alpe-backend:dev-j
ghcr.io/alpe-plaisance-du-touch/bourse-alpe-frontend:dev-j
```

Le NAS ne compile rien et n'a pas besoin du code source. Il ne lui faut que deux
fichiers : `docker-compose.yml` et `.env`. Cela évite d'installer `git` sur le
NAS, d'y transférer des archives, et surtout de dépendre de sa mémoire
disponible — compiler l'application React demande bien plus qu'un NAS d'entrée
de gamme n'en offre confortablement.

**`docker-compose.prod.yml` n'est pas utilisable ici** : il publie les ports 80
et 443 et gère ses propres certificats via certbot, alors que Traefik occupe
déjà ce rôle sur le NAS. Deux services réclamant les mêmes ports et le même
certificat entreraient en conflit.

## Architecture

```
                Internet
                    │  HTTPS 443  (redirigé vers 9443 sur le NAS)
                    ▼
        ┌───────────────────────┐
        │       Traefik         │  Let's Encrypt, entrypoint websecure
        └───────────┬───────────┘
                    │  réseau Docker « web »
      ┌─────────────┼──────────────────┐
      ▼             ▼                  ▼
  /api/*        tout le reste     mailhog.dev-j…
  backend:8000  frontend:80       mailhog:8025
      │                            (mot de passe)
      ▼
   db:3306   ── réseau « internal », hors de portée de Traefik
```

La règle `Host(...) && PathPrefix(/api)` est plus spécifique que `Host(...)` :
Traefik la classe d'office avant, sans qu'il faille fixer de priorité. L'API
étant déjà montée sur `/api/v1`, **aucun `stripprefix` ne doit être ajouté**.

Aucun port n'est publié sur l'hôte : tout entre par Traefik.

## Nomenclature des services

Les services suivent `<projet>-<service>-<environnement>` :

| Service | Rôle |
|---|---|
| `alpebourse-db-devj` | base MariaDB |
| `alpebourse-backend-devj` | API FastAPI |
| `alpebourse-frontend-devj` | interface React |
| `alpebourse-mailhog-devj` | capture des courriels |

Ce nom n'est pas décoratif : **c'est le nom DNS interne du conteneur**. Le
backend joint la base sur `alpebourse-db-devj:3306` et MailHog sur
`alpebourse-mailhog-devj:1025`. Renommer un service sans reporter le changement
dans `DATABASE_URL` et dans `SMTP_HOST` casse la pile sans message clair.

Compose refuse `${VAR}` dans une clé de service, le schéma étant validé avant
substitution :

```
services additional properties 'alpebourse-db-${ENVSLUG}' not allowed
```

L'environnement est donc écrit en dur, et **chaque étage a son propre fichier
compose**. Pour en ouvrir un nouveau, dupliquer le fichier et remplacer `devj`
partout, `.env` compris.

## Prérequis

| Élément | Vérification |
|---|---|
| DSM 7.x, Container Manager installé | Centre de paquets |
| NAS x86_64 | Les images sont publiées en `linux/amd64` uniquement ; les NAS ARM ne sont pas pris en charge |
| Traefik actif sur le réseau `web` | `sudo docker network ls` doit lister `web` |
| Résolveur ACME nommé `letsencrypt` | sinon, ajuster `TRAEFIK_CERTRESOLVER` dans le `.env` |
| Les deux noms pointant vers le NAS | `dev-j.bourse.alpe-plaisance.org` et `mailhog.dev-j.bourse.alpe-plaisance.org` |
| Redirections depuis la box | 443 vers 9443 et **80 vers 9080**, ports publiés par la pile Traefik |

Le port 80 n'est pas facultatif : le défi ACME de Let's Encrypt passe par lui.

## 1. Publier les images

Les images sont produites par le workflow
[`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml),
déclenché à chaque push sur `dev-j`. Vérifier dans l'onglet **Actions** du dépôt
que la dernière exécution est verte avant d'installer.

Les paquets apparaissent ensuite sur la page *Packages* de l'organisation. S'ils
sont **privés**, le NAS devra s'authentifier (étape 3).

## 2. Déposer les deux fichiers sur le NAS

Dans File Station, créer le dossier `docker/alpebourse-devj` et y placer :

| Fichier sur le NAS | Source dans le dépôt |
|---|---|
| `docker-compose.yml` | `deploy/docker-compose.dev-j.yml` |
| `.env` | `deploy/.env.dev-j.example`, complété |

Le renommage n'est pas cosmétique : Container Manager cherche un fichier nommé
`docker-compose.yml`, et Compose ne charge automatiquement que le fichier
`.env`.

Renseigner ensuite le `.env` avec l'éditeur de texte de File Station. Les
secrets se génèrent sur le poste de développement :

```bash
openssl rand -hex 32     # JWT_SECRET_KEY
openssl rand -base64 32  # SETTINGS_ENCRYPTION_KEY
openssl rand -base64 24  # chaque mot de passe de base
```

### Le mot de passe MailHog, et son piège

MailHog n'a aucune authentification propre et affiche **tous** les courriels,
jetons d'invitation et liens de réinitialisation compris : quiconque connaît
l'adresse pourrait activer un compte à la place d'un autre. L'accès passe donc
par le middleware `basicauth` de Traefik.

Fabriquer l'empreinte sur le poste de développement :

```bash
docker run --rm httpd:alpine htpasswd -nbB alpe 'MOT_DE_PASSE_CHOISI'
```

**Doubler ensuite chaque `$` du résultat avant de le coller dans le `.env`.**
Compose interprète un `$` isolé comme une variable et ampute le hash sans rien
signaler — l'authentification échoue alors sans message exploitable.

```
htpasswd affiche   alpe:$2y$10$abcdef...
le .env contient   alpe:$$2y$$10$$abcdef...
```

## 3. Autoriser le NAS à récupérer les images

À faire **uniquement si les paquets GHCR sont privés**. Depuis un terminal du
NAS :

```bash
echo "<TOKEN>" | sudo docker login ghcr.io -u <utilisateur> --password-stdin
```

Le token est un *Personal Access Token* GitHub avec la seule portée
`read:packages`. L'identifiant est enregistré durablement et sert à toutes les
piles du NAS.

Si les paquets sont publics, il n'y a rien à faire.

## 4. Créer le projet dans Container Manager

**Container Manager** → **Projet** → **Créer** :

| Champ | Valeur |
|---|---|
| Nom du projet | `alpebourse-devj` |
| Chemin | le dossier `docker/alpebourse-devj` |
| Source | *Utiliser le fichier docker-compose.yml existant* |

Container Manager télécharge les images et démarre la pile. C'est rapide : rien
n'est compilé.

### Appliquer le schéma et charger les données

**Conteneur** → `alpebourse-backend-devj` → onglet **Terminal** → **Créer** →
`bash`, puis :

```bash
alembic upgrade head
python scripts/seed.py
```

Le second affiche la liste des comptes créés — l'occasion de vérifier qu'ils
correspondent au guide de démonstration.

## Vérifier l'installation

| Contrôle | Attendu |
|---|---|
| `https://dev-j.bourse.alpe-plaisance.org` | page de connexion, cadenas valide |
| Connexion avec un compte de démonstration | tableau de bord |
| `https://mailhog.dev-j.bourse.alpe-plaisance.org` | demande d'identifiants, puis boîte vide |
| Mot de passe oublié depuis l'application | le courriel apparaît dans MailHog |
| Console du navigateur (F12) | aucune erreur |

Une erreur CORS, ou un lien de courriel qui ne mène nulle part, vient presque
toujours de `CORS_ORIGINS` ou `FRONTEND_URL` mal renseignés.

Un **404 de Traefik** signale au contraire que le conteneur n'a pas été
détecté ; ses journaux le disent :

```bash
sudo docker logs traefik
```

## Mettre à jour

C'est tout l'intérêt du montage. Après un push sur `dev-j`, une fois le workflow
au vert :

**Container Manager** → projet `alpebourse-devj` → **Action** → **Reconstruire**

L'interface récupère les nouvelles images et redémarre les conteneurs. Les
services portent `pull_policy: always`, donc le tag `dev-j` est bien
retéléchargé et non repris du cache local.

En ligne de commande, l'équivalent tient en une ligne :

```bash
docker compose pull && docker compose up -d
```

Si la mise à jour touche la base, ouvrir ensuite le terminal du conteneur
backend et lancer `alembic upgrade head`. Ni le `.env` ni les données ne sont
affectés.

## Remettre à zéro avant une démonstration

Efface toutes les données et recharge le jeu de démonstration, sans toucher aux
images.

Terminal du conteneur `alpebourse-db-devj` :

```bash
mariadb -u root -p
```

Le mot de passe est celui de `DB_ROOT_PASSWORD`. Puis, dans l'invite SQL :

```sql
DROP DATABASE bourse_devj;
CREATE DATABASE bourse_devj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON bourse_devj.* TO 'bourse'@'%';
FLUSH PRIVILEGES;
EXIT;
```

Puis, dans le terminal du conteneur `alpebourse-backend-devj` :

```bash
alembic upgrade head
python scripts/seed.py
```

Deux à trois minutes en tout.

## Revenir à une version antérieure

Chaque image est aussi taguée par son empreinte de commit. Pour repasser à une
version précise, renseigner `IMAGE_TAG` dans le `.env` :

```
IMAGE_TAG=sha-a1b2c3d
```

puis reconstruire le projet. C'est le moyen le plus rapide de sortir d'une
régression sans attendre un correctif.

## Limites connues

- **Les données sont fictives et destructibles.** Aucune donnée réelle de
  déposant ne doit être saisie ici : cet environnement n'a pas le niveau de
  protection d'une production, et il est remis à zéro sans préavis.
- **Aucun courriel ne sort.** Tout est capté par MailHog. C'est voulu, et cela
  interdit de tester une vraie délivrabilité.
- **La limitation de débit est approximative.** Le backend tourne avec quatre
  processus qui comptent chacun de leur côté (issue #52) : la limite réelle vaut
  environ quatre fois la valeur configurée.
- **Les en-têtes de sécurité sont ceux de l'image frontend**
  (`frontend/docker/nginx.conf`), moins stricts que le
  `docker/nginx/security-headers.conf` prévu pour la production : ni CSP, ni
  HSTS. Acceptable pour un environnement de test, à revoir avant la mise en
  production.
- **`docker/nginx/nginx.prod.conf` contient des `${DOMAIN}`** qui ne sont jamais
  substitués, le fichier étant monté directement dans `conf.d/`. nginx refuse de
  démarrer sur une variable inconnue : la configuration de production ne peut
  pas démarrer en l'état. Sans effet ici, à corriger avant la vraie mise en
  production.
