---
id: DOC-150-DEVJ
title: Environnement de test dev-j sur NAS Synology
status: draft
version: 0.1.0
updated: 2026-08-29
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

## Pourquoi pas `docker-compose.prod.yml`

Le fichier de production publie les ports 80 et 443 et gère lui-même les
certificats via certbot. Or **Traefik occupe déjà ce rôle** sur le NAS : il
termine le HTTPS, obtient les certificats Let's Encrypt et route vers les
conteneurs selon leurs labels.

Deux services qui demandent les mêmes ports et le même certificat entreraient en
conflit. On confie donc tout le front à Traefik, et la pile dev-j ne parle
qu'en HTTP.

D'où un fichier dédié, `docker-compose.dev-j.yml`, plutôt qu'une adaptation du
fichier de production.

## Architecture

```
                Internet
                    │  HTTPS 443  (redirigé vers 9443 sur le NAS)
                    ▼
        ┌───────────────────────┐
        │       Traefik         │   certificats Let's Encrypt, entrypoint websecure
        └───────────┬───────────┘
                    │  réseau Docker « web », en HTTP
                    ▼
        ┌───────────────────────┐
        │   nginx (conteneur)   │
        │   :8080  application  │
        │   :8081  MailHog      │
        └───────────┬───────────┘
                    │
        ┌───────────┼────────────────┐
        ▼           ▼                ▼
   SPA React   backend:8000     mailhog:8025
                    │
                    ▼
                 db:3306
```

Traefik joint nginx par le réseau `web` ; aucun port n'a besoin d'être publié
pour que le routage fonctionne. Les ports 8080 et 8081 le sont tout de même,
mais sur `127.0.0.1` uniquement, pour pouvoir diagnostiquer depuis le NAS sans
passer par Traefik.

## Prérequis

- DSM 7.x avec **Container Manager** installé
- **File Station** pour transférer les fichiers (aucun accès SSH nécessaire, et
  `git` n'a pas besoin d'être installé sur le NAS)
- **Traefik en fonctionnement**, avec son réseau `web` et le certresolver
  `letsencrypt` déjà utilisés par d'autres services
- Les deux noms pointant vers l'adresse publique du NAS :
  - `dev-j.bourse.alpe-plaisance.org`
  - `mailhog.dev-j.bourse.alpe-plaisance.org`
- Depuis la box, le port 443 redirigé vers le **9443** du NAS et le port 80 vers
  le **9080** — ce sont les ports que publie la pile Traefik. Le 80 n'est pas
  facultatif : le défi ACME de Let's Encrypt passe par lui.

Vérifier que le réseau existe avant de démarrer :

```bash
sudo docker network ls | grep web
```

## 1. Préparer et transférer le projet

`git` n'étant pas installé sur le NAS, l'archive se fabrique sur le poste de
développement puis se dépose par File Station.

**Sur le poste**, depuis le dépôt :

```bash
git archive --format=zip --output=bourse-dev-j.zip dev-j
```

`git archive` n'emporte que les fichiers suivis : ni `.git`, ni `node_modules`,
ni aucun secret. C'est exactement ce qu'il faut envoyer.

**Sur le NAS**, dans File Station :

1. Créer le dossier `docker/bourse-alpe`
2. Y déposer `bourse-dev-j.zip`
3. Clic droit → **Extraire** → *Extraire ici*
4. Supprimer l'archive

**Puis, important**, remplacer le fichier Compose. Le dépôt en contient deux et
celui qui porte le nom attendu par Container Manager est celui de
développement — le laisser en place démarrerait la mauvaise pile :

1. Supprimer `docker-compose.yml`
2. Renommer `docker-compose.dev-j.yml` en `docker-compose.yml`

## 2. Configurer l'environnement

Le fichier doit s'appeler **`.env`**, dans le dossier du projet : Container
Manager ne sait pas passer `--env-file`, et Compose charge ce nom-là tout seul.

Le créer avec File Station (clic droit dans le dossier → *Créer* → *Fichier*),
puis l'ouvrir dans l'éditeur de texte intégré et y coller :

```bash
# --- Environnement ---
# "staging" désactive la documentation d'API et active la limitation de débit,
# comme en production, sans imposer le contrôle strict du secret JWT au
# démarrage. Ne jamais mettre "development" sur une machine exposée.
APP_ENV=staging
DEBUG=false

# --- Base de données ---
DB_NAME=bourse_devj
DB_USER=bourse
DB_PASSWORD=CHANGE_ME
DB_ROOT_PASSWORD=CHANGE_ME

# --- Sécurité ---
JWT_SECRET_KEY=CHANGE_ME
SETTINGS_ENCRYPTION_KEY=CHANGE_ME

# --- Domaines ---
CORS_ORIGINS=https://dev-j.bourse.alpe-plaisance.org
FRONTEND_URL=https://dev-j.bourse.alpe-plaisance.org

# --- Courriel ---
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_USE_TLS=false
SMTP_FROM_EMAIL=noreply@dev-j.bourse.alpe-plaisance.org
SMTP_FROM_NAME=Bourse ALPE (test)
SUPPORT_EMAIL=noreply@dev-j.bourse.alpe-plaisance.org

# --- Limitation de débit ---
RATE_LIMIT_REQUESTS=600
RATE_LIMIT_WINDOW_SECONDS=60
```

Générer les secrets **sur le poste de développement** :

```bash
openssl rand -hex 32     # JWT_SECRET_KEY
openssl rand -base64 32  # SETTINGS_ENCRYPTION_KEY
openssl rand -base64 24  # chaque mot de passe de base
```

Ce fichier contient tous les secrets de l'environnement : le dossier
`docker/bourse-alpe` ne doit être partagé avec personne, et surtout pas exposé
par un service de fichiers.

**`RATE_LIMIT_REQUESTS` mérite une explication.** Derrière Traefik, les
participants d'une démonstration sortent souvent par une seule adresse publique
et partagent donc le même compteur. La valeur de production, 100 requêtes par
minute, est vite atteinte à plusieurs ; 600 laisse de la marge sans désactiver
la protection.

**`FRONTEND_URL` est utilisé dans les courriels** (activation de compte,
réinitialisation). Une erreur ici produit des liens qui ne mènent nulle part.

## 3. Protéger l'accès à MailHog

MailHog n'a aucune authentification et affiche **tous** les courriels, jetons
d'invitation et liens de réinitialisation compris. Quiconque connaît l'adresse
pourrait activer un compte à la place d'un autre. L'accès est donc protégé par
mot de passe au niveau de nginx.

Créer, toujours avec File Station, le fichier `docker/nginx/mailhog.htpasswd`
dans le dossier du projet. Il contient **une seule ligne**, de la forme
`identifiant:empreinte`.

L'empreinte se fabrique sur le poste de développement, jamais à la main :

```bash
docker run --rm httpd:alpine htpasswd -nbB alpe 'MOT_DE_PASSE_CHOISI'
```

`-n` affiche le résultat sans écrire de fichier : il ne reste qu'à copier la
ligne produite. Ce fichier ne doit jamais être commité ; il figure déjà dans
`.gitignore`.

## 4. Créer le projet dans Container Manager

**Container Manager** → **Projet** → **Créer** :

| Champ | Valeur |
|---|---|
| Nom du projet | `bourse-devj` |
| Chemin | le dossier `docker/bourse-alpe` préparé plus haut |
| Source | *Utiliser le fichier docker-compose.yml existant* |

Container Manager affiche le contenu du fichier pour relecture, puis propose de
lancer la construction. Accepter.

**La première construction prend de longues minutes** : elle compile le backend
Python et l'application React. Les journaux défilent dans l'interface.

Deux comportements normaux, qui ressemblent à des erreurs :

- le conteneur `bourse-devj-frontend-build` **s'arrête tout seul** une fois
  l'application compilée et déposée dans un volume partagé. Ne pas le relancer ;
- `bourse-devj-backend` peut redémarrer une ou deux fois en attendant que la
  base soit prête.

### Appliquer le schéma et charger les données

Container Manager donne un terminal sans passer par SSH :

**Conteneur** → `bourse-devj-backend` → onglet **Terminal** → **Créer** → `bash`

Puis, dans ce terminal :

```bash
alembic upgrade head
python scripts/seed.py
```

Le second affiche la liste des comptes créés. C'est le moment de vérifier que
les identifiants correspondent à ceux du guide de démonstration.

### Vérifier avant d'aller plus loin

Toujours dans le terminal du conteneur backend. L'image ne contient pas `curl`,
mais Python y est par construction :

```bash
python -c "import urllib.request; print(urllib.request.urlopen('http://nginx:8080/').status)"
```

Une réponse `200` signifie que l'application est servie correctement. Si ce
n'est pas le cas, inutile de chercher du côté de Traefik : le problème est
interne à la pile.

## 5. Routage et certificats : rien à faire

Traefik découvre la pile tout seul, par les labels portés par le service nginx
dans `docker-compose.dev-j.yml`. Il n'y a **aucune configuration à saisir**, ni
dans DSM, ni dans les fichiers de Traefik.

Les labels déclarent deux routeurs vers un même conteneur, chacun sur son port :

| Routeur | Nom demandé | Port interne |
|---|---|---|
| `devj-app` | `dev-j.bourse.alpe-plaisance.org` | 8080 |
| `devj-mailhog` | `mailhog.dev-j.bourse.alpe-plaisance.org` | 8081 |

Trois détails conditionnent le bon fonctionnement, et sont déjà dans le fichier :

- `traefik.enable=true` — la pile Traefik tourne avec `exposedByDefault=false`,
  donc un conteneur sans ce label est purement ignoré.
- `traefik.docker.network=web` — nginx appartient à deux réseaux ; sans cette
  précision Traefik peut retenir la mauvaise adresse et le routage échoue de
  façon intermittente.
- `...loadbalancer.server.port` — obligatoire sur chaque service, le conteneur
  écoutant sur deux ports.

Les certificats sont demandés à Let's Encrypt au premier appel de chaque nom,
puis renouvelés automatiquement. Le premier chargement peut donc prendre
quelques secondes de plus.

Si un nom renvoie une erreur 404 de Traefik, c'est presque toujours que le
conteneur n'a pas été détecté :

```bash
sudo docker logs traefik 2>&1 | tail -30
```

## 6. Pare-feu

Si le pare-feu DSM est actif, autoriser **9080** et **9443** — les ports que
publie Traefik. Les ports 8080 et 8081 de la pile dev-j n'ont pas à être
ouverts : ils n'écoutent que sur `127.0.0.1` et ne servent qu'au diagnostic
local, Traefik passant par le réseau Docker.

## Vérifier l'installation

| Contrôle | Attendu |
|---|---|
| `https://dev-j.bourse.alpe-plaisance.org` | page de connexion, cadenas valide |
| Connexion avec un compte de démonstration | tableau de bord |
| `https://mailhog.dev-j.bourse.alpe-plaisance.org` | demande d'identifiants, puis boîte vide |
| Mot de passe oublié depuis l'application | le courriel apparaît dans MailHog |
| Console du navigateur (F12) | aucune erreur |

Le dernier point compte : une erreur CORS ou un lien cassé dans un courriel
vient presque toujours de `CORS_ORIGINS` ou `FRONTEND_URL` mal renseignés.

## Mettre à jour

1. **Sur le poste** : `git archive --format=zip --output=bourse-dev-j.zip dev-j`
2. **File Station** : déposer l'archive dans `docker/bourse-alpe`, extraire en
   écrasant, supprimer l'archive
3. Remplacer à nouveau `docker-compose.yml` par `docker-compose.dev-j.yml`
   — l'extraction a remis le fichier de développement en place
4. **Container Manager** → projet `bourse-devj` → **Action** → **Construire**
5. Si la mise à jour touche la base, ouvrir le terminal du conteneur backend et
   lancer `alembic upgrade head`

`.env` et `docker/nginx/mailhog.htpasswd` ne figurent pas dans l'archive : ils
survivent à la mise à jour.

## Remettre à zéro avant une démonstration

Efface toutes les données et recharge le jeu de démonstration, sans supprimer le
projet ni reconstruire les images.

**Conteneur** → `bourse-devj-db` → **Terminal** → **Créer** → `bash`, puis :

```bash
mariadb -u root -p
```

Le mot de passe est celui de `DB_ROOT_PASSWORD`. Une fois dans l'invite SQL :

```sql
DROP DATABASE bourse_devj;
CREATE DATABASE bourse_devj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON bourse_devj.* TO 'bourse'@'%';
FLUSH PRIVILEGES;
EXIT;
```

Puis dans le terminal du conteneur `bourse-devj-backend` :

```bash
alembic upgrade head
python scripts/seed.py
```

Compter deux à trois minutes en tout. La base repart identique à sa sortie
d'usine, et les images n'ont pas bougé.

## Sauvegarde

Sur un environnement de test, une sauvegarde n'a d'intérêt que si un jeu de
données y a été saisi à la main et qu'on ne veut pas le ressaisir. Dans le cas
contraire, la remise à zéro ci-dessus suffit.

Le cas échéant, depuis le terminal du conteneur `bourse-devj-db` :

```bash
mariadb-dump -u root -p bourse_devj > /tmp/sauvegarde-devj.sql
```

Le fichier reste dans le conteneur. Pour le récupérer, écrire plutôt dans un
dossier monté depuis le NAS, ou copier son contenu depuis le terminal.

## Limites connues

- **Les données sont fictives et destructibles.** Aucune donnée réelle de
  déposant ne doit être saisie ici : cet environnement n'a pas le niveau de
  protection d'une production, et il est remis à zéro sans préavis.
- **Aucun courriel ne sort.** Tout est capté par MailHog. C'est voulu, et cela
  interdit de tester une vraie délivrabilité.
- **La limitation de débit est approximative.** Le backend tourne avec quatre
  processus qui comptent chacun de leur côté (issue #52) : la limite réelle vaut
  environ quatre fois la valeur configurée.
- **`docker-compose.prod.yml` n'est pas utilisable tel quel**, et pas seulement
  à cause des ports : `docker/nginx/nginx.prod.conf` contient des `${DOMAIN}`
  qui ne sont jamais substitués, le fichier étant monté directement dans
  `conf.d/`. nginx refuse de démarrer sur une variable inconnue. À corriger
  avant la vraie mise en production.
