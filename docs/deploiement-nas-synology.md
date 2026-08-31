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
certificats via certbot. Sur un Synology, **DSM occupe déjà ces deux ports** :
le conteneur ne peut pas s'y attacher.

DSM sait faire ce travail nativement, et mieux : son reverse proxy termine le
HTTPS et ses certificats Let's Encrypt se renouvellent tout seuls. On lui confie
donc le TLS, et les conteneurs ne parlent qu'en HTTP sur des ports hauts.

D'où un fichier dédié, `docker-compose.dev-j.yml`, plutôt qu'une adaptation du
fichier de production.

## Architecture

```
                Internet
                    │  HTTPS 443
                    ▼
        ┌───────────────────────┐
        │  Reverse proxy DSM    │   certificat Let's Encrypt géré par DSM
        └───────────┬───────────┘
                    │  HTTP, en local uniquement
        ┌───────────┴────────────┐
        ▼                        ▼
   127.0.0.1:8080          127.0.0.1:8081
   application             MailHog (mot de passe)
        │                        │
        ▼                        ▼
   nginx (conteneur) ──────► mailhog:8025
        │
        ├──► SPA React (fichiers statiques)
        └──► /api ──► backend:8000 ──► db:3306
```

Les ports 8080 et 8081 sont publiés sur `127.0.0.1` seulement : ils ne sont pas
joignables depuis le réseau, uniquement par le proxy DSM.

## Prérequis

- DSM 7.x avec **Container Manager** installé
- Accès SSH au NAS activé (Panneau de configuration → Terminal & SNMP)
- Les deux noms pointant vers l'adresse publique du NAS :
  - `dev-j.bourse.alpe-plaisance.org`
  - `mailhog.dev-j.bourse.alpe-plaisance.org`
- Ports 80 et 443 redirigés depuis la box vers le NAS
  (le 80 est nécessaire à la validation Let's Encrypt)

## 1. Récupérer le code

En SSH sur le NAS :

```bash
mkdir -p /volume1/docker/bourse-alpe
cd /volume1/docker/bourse-alpe
git clone https://github.com/ALPE-Plaisance-du-Touch/Gestionnaire-de-Bourse-ALPE.git .
git checkout dev-j
```

Adapte `/volume1` si ton volume porte un autre nom.

## 2. Configurer l'environnement

Créer `.env.dev-j` à la racine du projet :

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

Générer les secrets :

```bash
openssl rand -hex 32     # JWT_SECRET_KEY
openssl rand -base64 32  # SETTINGS_ENCRYPTION_KEY
openssl rand -base64 24  # chaque mot de passe de base
```

Puis restreindre l'accès au fichier :

```bash
chmod 600 .env.dev-j
```

**`RATE_LIMIT_REQUESTS` mérite une explication.** Derrière le proxy DSM, les
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
mot de passe au niveau de nginx :

```bash
docker run --rm httpd:alpine htpasswd -nbB alpe 'MOT_DE_PASSE_CHOISI' \
  > docker/nginx/mailhog.htpasswd
chmod 600 docker/nginx/mailhog.htpasswd
```

Ce fichier ne doit jamais être commité — vérifie qu'il est ignoré par git.

## 4. Démarrer

```bash
cd /volume1/docker/bourse-alpe
sudo docker compose -f docker-compose.dev-j.yml --env-file .env.dev-j up -d --build
```

La première construction prend plusieurs minutes. Le conteneur
`bourse-devj-frontend-build` se termine normalement après avoir déposé le SPA
compilé : ce n'est pas une erreur.

Puis appliquer le schéma et charger les données de démonstration :

```bash
sudo docker compose -f docker-compose.dev-j.yml exec backend alembic upgrade head
sudo docker compose -f docker-compose.dev-j.yml exec backend python scripts/seed.py
```

Vérifier que l'application répond localement avant d'aller plus loin :

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/
curl -s http://127.0.0.1:8080/api/v1/../../health
```

## 5. Certificat Let's Encrypt

Panneau de configuration → **Sécurité** → **Certificat** → Ajouter →
*Obtenir un certificat de Let's Encrypt*.

- Nom de domaine : `dev-j.bourse.alpe-plaisance.org`
- Autre nom du sujet : `mailhog.dev-j.bourse.alpe-plaisance.org`

Un seul certificat couvre les deux noms. DSM le renouvelle automatiquement.

## 6. Reverse proxy DSM

Panneau de configuration → **Portail de connexion** → **Avancé** →
**Proxy inversé** → Créer, deux fois :

| | Source | Destination |
|---|---|---|
| Application | HTTPS · `dev-j.bourse.alpe-plaisance.org` · 443 | HTTP · `localhost` · 8080 |
| MailHog | HTTPS · `mailhog.dev-j.bourse.alpe-plaisance.org` · 443 | HTTP · `localhost` · 8081 |

Sur l'entrée **MailHog**, onglet *En-tête personnalisé* → Créer → **WebSocket**.
Sans cela l'interface ne se rafraîchit pas à l'arrivée d'un courriel.

Puis, dans l'onglet **Certificat** de chaque entrée, sélectionner le certificat
créé à l'étape précédente.

## 7. Pare-feu

Si le pare-feu DSM est actif, autoriser 80 et 443 depuis Internet. Les ports
8080 et 8081 n'ont **pas** à être ouverts : ils n'écoutent que sur `127.0.0.1`.

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

```bash
cd /volume1/docker/bourse-alpe
git pull origin dev-j
sudo docker compose -f docker-compose.dev-j.yml --env-file .env.dev-j up -d --build
sudo docker compose -f docker-compose.dev-j.yml exec backend alembic upgrade head
```

## Remettre à zéro avant une démonstration

Efface toutes les données et recharge le jeu de démonstration :

```bash
cd /volume1/docker/bourse-alpe
sudo docker compose -f docker-compose.dev-j.yml --env-file .env.dev-j down
sudo docker volume rm bourse-alpe_db_data
sudo docker compose -f docker-compose.dev-j.yml --env-file .env.dev-j up -d
sudo docker compose -f docker-compose.dev-j.yml exec backend alembic upgrade head
sudo docker compose -f docker-compose.dev-j.yml exec backend python scripts/seed.py
```

Le nom exact du volume dépend du dossier du projet ; `docker volume ls` le donne.

## Sauvegarde

Les scripts de `scripts/` fonctionnent sur cet environnement. Pour une simple
copie ponctuelle de la base :

```bash
sudo docker compose -f docker-compose.dev-j.yml exec db \
  mariadb-dump -u root -p"$DB_ROOT_PASSWORD" bourse_devj > sauvegarde-devj.sql
```

Sur un environnement de test, une sauvegarde n'a d'intérêt que si tu y as saisi
un jeu de données que tu ne veux pas ressaisir. Sinon, `seed.py` suffit.

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
