---
id: DOC-130-DEPLOIEMENT
title: Guide de Déploiement
status: validated
version: 1.0.0
updated: 2025-12-28
owner: ALPE Plaisance du Touch
links:
  - rel: architecture
    href: architecture.md
    title: Architecture technique
  - rel: operations
    href: operations.md
    title: Opérations & Runbooks
  - rel: bonnes-pratiques
    href: bonnes-pratiques.md
    title: Bonnes pratiques de développement
---

# 1. Vue d'ensemble

Ce document décrit les deux modes de déploiement de l'application **Gestionnaire de Bourse ALPE** :

| Mode | Usage | Cible |
|------|-------|-------|
| **Manuel (Mutualisé)** | Production actuelle | Hébergement web mutualisé ALPE |
| **Docker** | Développement & Production future | Poste développeur / VPS / Cloud |

---

# 2. Architecture de déploiement

## 2.1 Vue comparative

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MODE MANUEL (HÉBERGEMENT MUTUALISÉ)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Serveur Mutualisé (OVH/o2switch)             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │   Apache     │  │   PHP-FPM    │  │   MariaDB            │  │   │
│  │  │   (proxy)    │  │   (WSGI)     │  │   (mutualisée)       │  │   │
│  │  │              │  │              │  │                      │  │   │
│  │  │  /static →   │  │  FastAPI     │  │  bourse_alpe_db      │  │   │
│  │  │  React build │  │  Python 3.11 │  │                      │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Coût : ~50-100€/an | Maintenance : Faible | Scalabilité : Limitée     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         MODE DOCKER                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Docker Host (Local / VPS)                     │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │   Nginx      │  │   Backend    │  │   MariaDB            │  │   │
│  │  │   (reverse   │  │   (FastAPI)  │  │   (conteneur)        │  │   │
│  │  │    proxy)    │  │              │  │                      │  │   │
│  │  │   :80/:443   │  │   :8000      │  │   :3306              │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  │         │                  │                    │               │   │
│  │         └──────────────────┴────────────────────┘               │   │
│  │                     docker-network                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Coût : Variable | Maintenance : Moyenne | Scalabilité : Bonne         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Choix du mode de déploiement

| Critère | Manuel (Mutualisé) | Docker |
|---------|-------------------|--------|
| **Coût** | ~50-100€/an | ~0€ (dev) / ~10-30€/mois (prod) |
| **Complexité setup** | Faible | Moyenne |
| **Reproductibilité** | Faible | Excellente |
| **Environnement dev** | Difficile | Idéal |
| **Mise à l'échelle** | Non | Oui |
| **Isolation** | Non | Oui |
| **Équipe requise** | Bénévole basique | Bénévole technique |

**Recommandations** :
- **Production actuelle** : Mode manuel (hébergement existant ALPE)
- **Développement** : Mode Docker (reproductible, isolé)
- **Production future** : Mode Docker si l'association migre vers un VPS/Cloud

---

# 3. Mode Manuel (Hébergement Mutualisé)

## 3.1 Prérequis hébergeur

| Composant | Version requise | Notes |
|-----------|-----------------|-------|
| **PHP** | 8.1+ | Pour le proxy WSGI |
| **Python** | 3.11+ | Via Passenger ou CGI |
| **MariaDB/MySQL** | 10.6+ / 8.0+ | Base mutualisée |
| **SSL** | Let's Encrypt | Fourni par hébergeur |
| **Espace disque** | 2 Go minimum | Application + logs + PDFs |
| **Accès SSH** | Requis | Pour déploiement |
| **Accès FTP** | Optionnel | Alternative à SSH |

### Hébergeurs compatibles testés

| Hébergeur | Compatible | Notes |
|-----------|------------|-------|
| **o2switch** | ✅ Oui | Python via Passenger, recommandé |
| **OVH Perso/Pro** | ✅ Oui | Python via CGI/Passenger |
| **PlanetHoster** | ✅ Oui | Python support |
| **Infomaniak** | ⚠️ Partiel | Vérifier support Python |
| **LWS** | ❌ Non | Pas de Python |

## 3.2 Structure des fichiers sur le serveur

```
/home/alpe/
├── public_html/                    # Document root Apache
│   ├── index.html                  # Point d'entrée React (SPA)
│   ├── assets/                     # JS/CSS buildés (Vite)
│   │   ├── index-[hash].js
│   │   ├── index-[hash].css
│   │   └── ...
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service Worker
│   ├── .htaccess                   # Routing Apache
│   └── api/                        # Proxy vers backend
│       └── .htaccess               # Redirection vers FastAPI
│
├── backend/                        # Application Python
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # Point d'entrée FastAPI
│   │   └── ...
│   ├── venv/                       # Environnement virtuel
│   ├── requirements.txt
│   ├── passenger_wsgi.py           # Point d'entrée Passenger
│   └── .env                        # Configuration (non versionné)
│
├── storage/                        # Fichiers générés
│   ├── etiquettes/                # PDFs étiquettes
│   ├── bordereaux/                # PDFs reversements
│   ├── exports/                   # Exports CSV
│   └── logs/                      # Logs applicatifs
│
└── tmp/                           # Fichiers temporaires
```

## 3.3 Configuration Apache (.htaccess)

### Document root (public_html/.htaccess)

```apache
# Activation du mod_rewrite
RewriteEngine On
RewriteBase /

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proxy API vers backend Python
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:8000/api/$1 [P,L]

# SPA routing - toutes les routes vers index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Headers de sécurité
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';"
</IfModule>

# Cache statique
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>
```

## 3.4 Configuration Passenger (backend/passenger_wsgi.py)

```python
"""
Point d'entrée WSGI pour Passenger (hébergement mutualisé).

Ce fichier est requis pour les hébergeurs utilisant Passenger
comme interface Python (o2switch, OVH, etc.).
"""
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables from .env
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Import the FastAPI application
from app.main import app

# Passenger expects an 'application' callable
application = app
```

## 3.5 Configuration de l'environnement (.env)

```bash
# =============================================================================
# CONFIGURATION PRODUCTION - HÉBERGEMENT MUTUALISÉ
# =============================================================================
# ATTENTION : Ce fichier contient des secrets, ne jamais le commiter !
# Copier .env.example vers .env et remplir les valeurs

# -----------------------------------------------------------------------------
# Base de données
# -----------------------------------------------------------------------------
DATABASE_URL=mysql+pymysql://alpe_user:SECRET_PASSWORD@localhost/alpe_bourse
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10

# -----------------------------------------------------------------------------
# Sécurité
# -----------------------------------------------------------------------------
# Générer avec : python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=your-256-bit-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Clé pour signature des ventes offline
OFFLINE_HMAC_SECRET=another-secret-key-for-offline-sales

# -----------------------------------------------------------------------------
# Email (SMTP)
# -----------------------------------------------------------------------------
SMTP_HOST=smtp.alpe-plaisance.org
SMTP_PORT=587
SMTP_USER=noreply@alpe-plaisance.org
SMTP_PASSWORD=smtp-password-here
SMTP_FROM_NAME=Bourse ALPE
SMTP_FROM_EMAIL=noreply@alpe-plaisance.org

# -----------------------------------------------------------------------------
# Application
# -----------------------------------------------------------------------------
APP_ENV=production
APP_DEBUG=false
APP_URL=https://bourse.alpe-plaisance.org
CORS_ORIGINS=https://bourse.alpe-plaisance.org

# -----------------------------------------------------------------------------
# Stockage
# -----------------------------------------------------------------------------
STORAGE_PATH=/home/alpe/storage
ETIQUETTES_PATH=/home/alpe/storage/etiquettes
BORDEREAUX_PATH=/home/alpe/storage/bordereaux
LOGS_PATH=/home/alpe/storage/logs

# -----------------------------------------------------------------------------
# Limites
# -----------------------------------------------------------------------------
MAX_UPLOAD_SIZE_MB=10
RATE_LIMIT_PER_MINUTE=100
```

## 3.6 Procédure de déploiement manuel

### Premier déploiement

```bash
#!/bin/bash
# deploy-initial.sh - Premier déploiement sur hébergement mutualisé

# Variables
REMOTE_HOST="alpe@ssh.hebergeur.com"
REMOTE_PATH="/home/alpe"

echo "=== Déploiement initial Bourse ALPE ==="

# 1. Connexion et création de la structure
ssh $REMOTE_HOST << 'EOF'
    # Créer les répertoires
    mkdir -p ~/backend
    mkdir -p ~/storage/{etiquettes,bordereaux,exports,logs}
    mkdir -p ~/tmp

    # Créer l'environnement Python
    cd ~/backend
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
EOF

# 2. Upload du backend
echo "Upload du backend..."
rsync -avz --exclude 'venv' --exclude '__pycache__' --exclude '.env' \
    ./backend/ $REMOTE_HOST:$REMOTE_PATH/backend/

# 3. Installation des dépendances
ssh $REMOTE_HOST << 'EOF'
    cd ~/backend
    source venv/bin/activate
    pip install -r requirements.txt
EOF

# 4. Build et upload du frontend
echo "Build du frontend..."
cd frontend
npm ci
npm run build

echo "Upload du frontend..."
rsync -avz ./dist/ $REMOTE_HOST:$REMOTE_PATH/public_html/

# 5. Configuration
echo "IMPORTANT: Configurer le fichier .env sur le serveur"
echo "ssh $REMOTE_HOST 'nano ~/backend/.env'"

# 6. Migrations base de données
ssh $REMOTE_HOST << 'EOF'
    cd ~/backend
    source venv/bin/activate
    alembic upgrade head
EOF

echo "=== Déploiement initial terminé ==="
echo "Vérifier : https://bourse.alpe-plaisance.org"
```

### Mise à jour

```bash
#!/bin/bash
# deploy-update.sh - Mise à jour de l'application

REMOTE_HOST="alpe@ssh.hebergeur.com"
REMOTE_PATH="/home/alpe"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== Mise à jour Bourse ALPE ==="

# 1. Backup avant mise à jour
echo "Création du backup..."
ssh $REMOTE_HOST << EOF
    # Backup de la base de données
    mysqldump -u alpe_user -p bourse_alpe > ~/backup/db_$TIMESTAMP.sql

    # Backup des fichiers
    tar -czf ~/backup/backend_$TIMESTAMP.tar.gz ~/backend/app
EOF

# 2. Build du frontend
echo "Build du frontend..."
cd frontend
npm ci
npm run build

# 3. Upload des fichiers
echo "Upload des fichiers..."

# Backend (sans écraser .env et venv)
rsync -avz --exclude 'venv' --exclude '__pycache__' --exclude '.env' \
    ./backend/ $REMOTE_HOST:$REMOTE_PATH/backend/

# Frontend
rsync -avz --delete ./dist/ $REMOTE_HOST:$REMOTE_PATH/public_html/

# 4. Mise à jour des dépendances si nécessaire
ssh $REMOTE_HOST << 'EOF'
    cd ~/backend
    source venv/bin/activate
    pip install -r requirements.txt --upgrade
EOF

# 5. Migrations
ssh $REMOTE_HOST << 'EOF'
    cd ~/backend
    source venv/bin/activate
    alembic upgrade head
EOF

# 6. Redémarrage de l'application (si Passenger)
ssh $REMOTE_HOST << 'EOF'
    touch ~/backend/tmp/restart.txt
EOF

echo "=== Mise à jour terminée ==="
echo "Vérifier : https://bourse.alpe-plaisance.org"
```

## 3.7 Configuration de la base de données

### Création de la base (phpMyAdmin ou CLI)

```sql
-- Création de la base de données
CREATE DATABASE IF NOT EXISTS alpe_bourse
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Création de l'utilisateur (remplacer par un mot de passe sécurisé)
CREATE USER IF NOT EXISTS 'alpe_user'@'localhost'
    IDENTIFIED BY 'STRONG_PASSWORD_HERE';

-- Attribution des privilèges
GRANT ALL PRIVILEGES ON alpe_bourse.* TO 'alpe_user'@'localhost';
FLUSH PRIVILEGES;
```

### Migration initiale

```bash
# Sur le serveur
cd ~/backend
source venv/bin/activate

# Générer une migration (si nouveau schéma)
alembic revision --autogenerate -m "Initial schema"

# Appliquer les migrations
alembic upgrade head

# Vérifier le statut
alembic current
```

## 3.8 Sauvegarde automatique

### Script de backup (à planifier via cron)

```bash
#!/bin/bash
# backup.sh - Sauvegarde quotidienne

BACKUP_DIR="/home/alpe/backup"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d)

# Créer le répertoire de backup
mkdir -p $BACKUP_DIR

# Backup base de données
mysqldump -u alpe_user -p'PASSWORD' alpe_bourse | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup fichiers générés
tar -czf $BACKUP_DIR/storage_$DATE.tar.gz /home/alpe/storage

# Nettoyage des anciens backups
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup terminé : $DATE"
```

### Configuration cron

```cron
# Backup quotidien à 3h du matin
0 3 * * * /home/alpe/scripts/backup.sh >> /home/alpe/logs/backup.log 2>&1

# Nettoyage des fichiers temporaires
0 5 * * * find /home/alpe/tmp -type f -mtime +1 -delete
```

---

# 4. Mode Docker

## 4.1 Prérequis

| Composant | Version requise | Installation |
|-----------|-----------------|--------------|
| **Docker** | 24.0+ | [docs.docker.com](https://docs.docker.com/get-docker/) |
| **Docker Compose** | 2.20+ | Inclus avec Docker Desktop |
| **Git** | 2.40+ | Pour cloner le projet |
| **Make** | 4.0+ | Optionnel, pour les commandes simplifiées |

### Installation Docker (Windows)

1. Télécharger [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Installer en activant WSL2
3. Redémarrer Windows
4. Vérifier : `docker --version` et `docker compose version`

### Installation Docker (Linux/Mac)

```bash
# Linux (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Mac
brew install --cask docker
```

## 4.2 Structure du projet Docker

```
project/
├── docker/
│   ├── backend/
│   │   └── Dockerfile
│   ├── frontend/
│   │   └── Dockerfile
│   └── nginx/
│       ├── Dockerfile
│       └── nginx.conf
│
├── docker-compose.yml              # Configuration développement
├── docker-compose.prod.yml         # Configuration production
├── .env.docker                     # Variables d'environnement Docker
│
├── backend/                        # Code source backend
├── frontend/                       # Code source frontend
└── Makefile                        # Commandes simplifiées
```

## 4.3 Dockerfiles

### Backend (docker/backend/Dockerfile)

```dockerfile
# =============================================================================
# Dockerfile Backend - FastAPI Python
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base
# -----------------------------------------------------------------------------
FROM python:3.11-slim as base

# Variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libmariadb-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 2: Dependencies
# -----------------------------------------------------------------------------
FROM base as dependencies

# Copier et installer les dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# -----------------------------------------------------------------------------
# Stage 3: Development
# -----------------------------------------------------------------------------
FROM dependencies as development

# Installer les dépendances de développement
COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 8000

# Commande de développement avec hot-reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# -----------------------------------------------------------------------------
# Stage 4: Production
# -----------------------------------------------------------------------------
FROM dependencies as production

# Créer un utilisateur non-root
RUN adduser --disabled-password --gecos "" appuser

# Copier le code source
COPY --chown=appuser:appuser . .

# Changer d'utilisateur
USER appuser

# Exposer le port
EXPOSE 8000

# Commande de production avec Gunicorn
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]
```

### Frontend (docker/frontend/Dockerfile)

```dockerfile
# =============================================================================
# Dockerfile Frontend - React + Vite
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine as dependencies

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Development
# -----------------------------------------------------------------------------
FROM dependencies as development

# Copier le code source
COPY . .

# Exposer le port Vite
EXPOSE 5173

# Commande de développement avec hot-reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# -----------------------------------------------------------------------------
# Stage 3: Build
# -----------------------------------------------------------------------------
FROM dependencies as build

# Copier le code source
COPY . .

# Build de production
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 4: Production
# -----------------------------------------------------------------------------
FROM nginx:alpine as production

# Copier la configuration Nginx
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
COPY --from=build /app/dist /usr/share/nginx/html

# Exposer le port
EXPOSE 80

# Commande
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx (docker/nginx/Dockerfile)

```dockerfile
# =============================================================================
# Dockerfile Nginx - Reverse Proxy
# =============================================================================
FROM nginx:alpine

# Copier la configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Créer les répertoires de logs
RUN mkdir -p /var/log/nginx

# Exposer les ports
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

### Configuration Nginx (docker/nginx/nginx.conf)

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Optimisations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/xml application/xml+rss text/javascript;

    # Upstream backend
    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name localhost;

        # Sécurité
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # API Backend
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
        }

        # OpenAPI docs
        location /docs {
            proxy_pass http://backend/docs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /openapi.json {
            proxy_pass http://backend/openapi.json;
            proxy_set_header Host $host;
        }

        # Frontend static files
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;

            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # Service Worker (no cache)
        location /sw.js {
            root /usr/share/nginx/html;
            add_header Cache-Control "no-store, no-cache, must-revalidate";
        }

        # Health check
        location /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
```

## 4.4 Docker Compose

### Développement (docker-compose.yml)

```yaml
# =============================================================================
# Docker Compose - Environnement de développement
# =============================================================================
version: '3.8'

services:
  # ---------------------------------------------------------------------------
  # Base de données MariaDB
  # ---------------------------------------------------------------------------
  db:
    image: mariadb:10.11
    container_name: alpe-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: ${DB_NAME:-alpe_bourse}
      MYSQL_USER: ${DB_USER:-alpe}
      MYSQL_PASSWORD: ${DB_PASSWORD:-alpepassword}
    volumes:
      - db_data:/var/lib/mysql
      - ./docker/db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - alpe-network

  # ---------------------------------------------------------------------------
  # Backend FastAPI
  # ---------------------------------------------------------------------------
  backend:
    build:
      context: ./backend
      dockerfile: ../docker/backend/Dockerfile
      target: development
    container_name: alpe-backend
    restart: unless-stopped
    environment:
      - DATABASE_URL=mysql+pymysql://${DB_USER:-alpe}:${DB_PASSWORD:-alpepassword}@db:3306/${DB_NAME:-alpe_bourse}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY:-dev-secret-key-change-in-production}
      - APP_ENV=development
      - APP_DEBUG=true
    volumes:
      - ./backend:/app
      - backend_storage:/app/storage
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - alpe-network

  # ---------------------------------------------------------------------------
  # Frontend React (Vite dev server)
  # ---------------------------------------------------------------------------
  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/frontend/Dockerfile
      target: development
    container_name: alpe-frontend
    restart: unless-stopped
    environment:
      - VITE_API_URL=http://localhost:8000/api
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    depends_on:
      - backend
    networks:
      - alpe-network

  # ---------------------------------------------------------------------------
  # phpMyAdmin (optionnel, pour debug)
  # ---------------------------------------------------------------------------
  phpmyadmin:
    image: phpmyadmin:latest
    container_name: alpe-phpmyadmin
    restart: unless-stopped
    environment:
      PMA_HOST: db
      PMA_USER: ${DB_USER:-alpe}
      PMA_PASSWORD: ${DB_PASSWORD:-alpepassword}
    ports:
      - "8080:80"
    depends_on:
      - db
    networks:
      - alpe-network
    profiles:
      - debug

  # ---------------------------------------------------------------------------
  # MailHog (capture des emails en dev)
  # ---------------------------------------------------------------------------
  mailhog:
    image: mailhog/mailhog:latest
    container_name: alpe-mailhog
    restart: unless-stopped
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - alpe-network
    profiles:
      - debug

volumes:
  db_data:
  backend_storage:

networks:
  alpe-network:
    driver: bridge
```

### Production (docker-compose.prod.yml)

```yaml
# =============================================================================
# Docker Compose - Environnement de production
# =============================================================================
version: '3.8'

services:
  # ---------------------------------------------------------------------------
  # Base de données MariaDB
  # ---------------------------------------------------------------------------
  db:
    image: mariadb:10.11
    container_name: alpe-db-prod
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
      - ./backups:/backups
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - alpe-network
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  # ---------------------------------------------------------------------------
  # Backend FastAPI
  # ---------------------------------------------------------------------------
  backend:
    build:
      context: ./backend
      dockerfile: ../docker/backend/Dockerfile
      target: production
    container_name: alpe-backend-prod
    restart: always
    environment:
      - DATABASE_URL=mysql+pymysql://${DB_USER}:${DB_PASSWORD}@db:3306/${DB_NAME}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - JWT_ALGORITHM=HS256
      - APP_ENV=production
      - APP_DEBUG=false
      - CORS_ORIGINS=${CORS_ORIGINS}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
    volumes:
      - backend_storage:/app/storage
      - backend_logs:/app/logs
    depends_on:
      db:
        condition: service_healthy
    networks:
      - alpe-network
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  # ---------------------------------------------------------------------------
  # Nginx Reverse Proxy
  # ---------------------------------------------------------------------------
  nginx:
    build:
      context: .
      dockerfile: docker/nginx/Dockerfile
    container_name: alpe-nginx-prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - backend
    networks:
      - alpe-network
    deploy:
      resources:
        limits:
          memory: 128M

  # ---------------------------------------------------------------------------
  # Certbot (renouvellement SSL)
  # ---------------------------------------------------------------------------
  certbot:
    image: certbot/certbot:latest
    container_name: alpe-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - alpe-network

volumes:
  db_data:
  backend_storage:
  backend_logs:
  nginx_logs:

networks:
  alpe-network:
    driver: bridge
```

## 4.5 Variables d'environnement Docker (.env.docker)

```bash
# =============================================================================
# CONFIGURATION DOCKER
# =============================================================================

# -----------------------------------------------------------------------------
# Base de données
# -----------------------------------------------------------------------------
DB_ROOT_PASSWORD=change_me_root_password
DB_NAME=alpe_bourse
DB_USER=alpe
DB_PASSWORD=change_me_db_password

# -----------------------------------------------------------------------------
# Application
# -----------------------------------------------------------------------------
JWT_SECRET_KEY=change_me_256_bit_secret_key
APP_URL=https://bourse.alpe-plaisance.org
CORS_ORIGINS=https://bourse.alpe-plaisance.org

# -----------------------------------------------------------------------------
# Email
# -----------------------------------------------------------------------------
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=change_me_smtp_password
```

## 4.6 Makefile (commandes simplifiées)

```makefile
# =============================================================================
# Makefile - Commandes Docker simplifiées
# =============================================================================

.PHONY: help dev prod build up down logs shell db-shell migrate test clean

# Variables
DOCKER_COMPOSE = docker compose
DOCKER_COMPOSE_PROD = docker compose -f docker-compose.prod.yml

# Aide par défaut
help:
	@echo "Commandes disponibles :"
	@echo ""
	@echo "  Développement :"
	@echo "    make dev          - Démarrer l'environnement de développement"
	@echo "    make dev-debug    - Démarrer avec phpMyAdmin et MailHog"
	@echo "    make down         - Arrêter les conteneurs"
	@echo "    make logs         - Voir les logs"
	@echo "    make shell        - Ouvrir un shell dans le backend"
	@echo "    make db-shell     - Ouvrir un shell MySQL"
	@echo ""
	@echo "  Production :"
	@echo "    make prod         - Démarrer l'environnement de production"
	@echo "    make prod-build   - Builder les images de production"
	@echo ""
	@echo "  Base de données :"
	@echo "    make migrate      - Appliquer les migrations"
	@echo "    make migrate-new  - Créer une nouvelle migration"
	@echo ""
	@echo "  Tests :"
	@echo "    make test         - Lancer les tests"
	@echo "    make test-cov     - Tests avec couverture"
	@echo ""
	@echo "  Maintenance :"
	@echo "    make clean        - Nettoyer les conteneurs et volumes"
	@echo "    make prune        - Nettoyer tout Docker (attention !)"

# =============================================================================
# Développement
# =============================================================================

dev:
	@echo "Démarrage de l'environnement de développement..."
	$(DOCKER_COMPOSE) up -d
	@echo ""
	@echo "Services disponibles :"
	@echo "  - Frontend : http://localhost:5173"
	@echo "  - Backend  : http://localhost:8000"
	@echo "  - API Docs : http://localhost:8000/docs"

dev-debug:
	@echo "Démarrage avec outils de debug..."
	$(DOCKER_COMPOSE) --profile debug up -d
	@echo ""
	@echo "Services supplémentaires :"
	@echo "  - phpMyAdmin : http://localhost:8080"
	@echo "  - MailHog    : http://localhost:8025"

down:
	$(DOCKER_COMPOSE) down

logs:
	$(DOCKER_COMPOSE) logs -f

logs-backend:
	$(DOCKER_COMPOSE) logs -f backend

logs-frontend:
	$(DOCKER_COMPOSE) logs -f frontend

shell:
	$(DOCKER_COMPOSE) exec backend /bin/bash

db-shell:
	$(DOCKER_COMPOSE) exec db mysql -u alpe -p alpe_bourse

# =============================================================================
# Production
# =============================================================================

prod-build:
	@echo "Build des images de production..."
	$(DOCKER_COMPOSE_PROD) build

prod:
	@echo "Démarrage de l'environnement de production..."
	$(DOCKER_COMPOSE_PROD) up -d

prod-down:
	$(DOCKER_COMPOSE_PROD) down

prod-logs:
	$(DOCKER_COMPOSE_PROD) logs -f

# =============================================================================
# Base de données
# =============================================================================

migrate:
	$(DOCKER_COMPOSE) exec backend alembic upgrade head

migrate-new:
	@read -p "Nom de la migration : " name; \
	$(DOCKER_COMPOSE) exec backend alembic revision --autogenerate -m "$$name"

migrate-status:
	$(DOCKER_COMPOSE) exec backend alembic current

# =============================================================================
# Tests
# =============================================================================

test:
	$(DOCKER_COMPOSE) exec backend pytest

test-cov:
	$(DOCKER_COMPOSE) exec backend pytest --cov=app --cov-report=html

test-frontend:
	$(DOCKER_COMPOSE) exec frontend npm test

# =============================================================================
# Maintenance
# =============================================================================

clean:
	$(DOCKER_COMPOSE) down -v --remove-orphans
	$(DOCKER_COMPOSE_PROD) down -v --remove-orphans

prune:
	@echo "ATTENTION : Cette commande va supprimer TOUTES les données Docker !"
	@read -p "Continuer ? (y/N) " confirm; \
	if [ "$$confirm" = "y" ]; then \
		docker system prune -a --volumes; \
	fi

# =============================================================================
# Installation initiale
# =============================================================================

setup:
	@echo "Configuration initiale..."
	@if [ ! -f .env ]; then \
		cp .env.docker.example .env; \
		echo "Fichier .env créé. Veuillez le configurer."; \
	fi
	@echo "Installation terminée. Lancez 'make dev' pour démarrer."
```

## 4.7 Utilisation quotidienne

### Développeur : premier lancement

```bash
# 1. Cloner le projet
git clone https://github.com/alpe/gestionnaire-bourse.git
cd gestionnaire-bourse

# 2. Copier la configuration
cp .env.docker.example .env

# 3. Démarrer l'environnement
make dev

# 4. Appliquer les migrations
make migrate

# 5. Accéder à l'application
# Frontend : http://localhost:5173
# API Docs : http://localhost:8000/docs
```

### Développeur : workflow quotidien

```bash
# Démarrer
make dev

# Voir les logs en temps réel
make logs

# Appliquer une nouvelle migration
make migrate

# Lancer les tests
make test

# Arrêter
make down
```

### Développeur : avec outils de debug

```bash
# Démarrer avec phpMyAdmin et MailHog
make dev-debug

# phpMyAdmin : http://localhost:8080
# MailHog (emails) : http://localhost:8025
```

---

# 5. Configuration SSL/HTTPS

## 5.1 Mode Manuel (Let's Encrypt via hébergeur)

La plupart des hébergeurs mutualisés fournissent Let's Encrypt automatiquement :
- **o2switch** : Activation via cPanel > SSL/TLS
- **OVH** : Activation via Manager > Certificats SSL

## 5.2 Mode Docker (Certbot)

### Première génération du certificat

```bash
# Arrêter Nginx temporairement
docker compose -f docker-compose.prod.yml stop nginx

# Générer le certificat
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@alpe-plaisance.org \
    --agree-tos \
    --no-eff-email \
    -d bourse.alpe-plaisance.org

# Redémarrer Nginx
docker compose -f docker-compose.prod.yml up -d nginx
```

### Configuration Nginx avec SSL (docker/nginx/nginx.prod.conf)

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Redirection HTTP vers HTTPS
    server {
        listen 80;
        server_name bourse.alpe-plaisance.org;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS
    server {
        listen 443 ssl http2;
        server_name bourse.alpe-plaisance.org;

        # Certificats SSL
        ssl_certificate /etc/letsencrypt/live/bourse.alpe-plaisance.org/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/bourse.alpe-plaisance.org/privkey.pem;

        # Configuration SSL moderne
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # HSTS
        add_header Strict-Transport-Security "max-age=63072000" always;

        # ... reste de la configuration (voir section 4.3)
    }
}
```

---

# 6. Monitoring et logs

## 6.1 Logs Docker

```bash
# Tous les logs
docker compose logs -f

# Logs d'un service spécifique
docker compose logs -f backend

# Dernières 100 lignes
docker compose logs --tail=100 backend

# Depuis une date
docker compose logs --since="2025-03-15T10:00:00" backend
```

## 6.2 Health checks

### Endpoint de santé (backend)

```python
# app/api/health.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    """Basic health check."""
    return {"status": "ok"}

@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Readiness check including database."""
    try:
        await db.execute("SELECT 1")
        return {"status": "ready", "database": "ok"}
    except Exception as e:
        return {"status": "not_ready", "database": str(e)}
```

---

# 7. Checklist de déploiement

## 7.1 Premier déploiement

```
□ PRÉPARATION
  □ Choisir le mode de déploiement (manuel ou Docker)
  □ Réserver le nom de domaine
  □ Configurer les DNS
  □ Préparer les secrets (mots de passe, clés JWT)

□ MODE MANUEL
  □ Vérifier les prérequis hébergeur (Python, MySQL)
  □ Créer la base de données
  □ Uploader le backend
  □ Configurer l'environnement virtuel Python
  □ Uploader le frontend buildé
  □ Configurer le .htaccess
  □ Activer le SSL

□ MODE DOCKER
  □ Installer Docker sur le serveur
  □ Copier le projet
  □ Configurer le fichier .env
  □ Builder les images
  □ Démarrer les conteneurs
  □ Configurer le SSL avec Certbot

□ POST-DÉPLOIEMENT
  □ Appliquer les migrations
  □ Créer le compte administrateur
  □ Tester les fonctionnalités critiques
  □ Configurer les backups automatiques
  □ Configurer le monitoring
```

## 7.2 Mise à jour

```
□ AVANT
  □ Sauvegarder la base de données
  □ Sauvegarder les fichiers modifiés
  □ Informer les utilisateurs si maintenance

□ PENDANT
  □ Déployer les nouveaux fichiers
  □ Appliquer les migrations
  □ Redémarrer les services
  □ Vérifier les logs

□ APRÈS
  □ Tester les fonctionnalités critiques
  □ Vérifier les métriques
  □ Confirmer le bon fonctionnement
```

---

# 8. Troubleshooting

## 8.1 Problèmes courants

### Mode Manuel

| Problème | Cause probable | Solution |
|----------|----------------|----------|
| 500 Internal Server Error | Erreur Python | Vérifier les logs Apache/error.log |
| 404 sur l'API | .htaccess mal configuré | Vérifier les règles de rewrite |
| Base de données inaccessible | Mauvais credentials | Vérifier DATABASE_URL dans .env |
| Permission denied | Droits fichiers | `chmod -R 755 backend/` |

### Mode Docker

| Problème | Cause probable | Solution |
|----------|----------------|----------|
| Container ne démarre pas | Erreur dans le Dockerfile | `docker compose logs <service>` |
| Base de données non prête | Healthcheck échoue | Attendre ou vérifier les logs db |
| Port déjà utilisé | Conflit de ports | Changer le port dans docker-compose.yml |
| Permission denied volumes | UID/GID différents | Configurer les permissions |

## 8.2 Commandes de diagnostic

```bash
# Mode Docker
docker compose ps                    # État des conteneurs
docker compose logs backend          # Logs du backend
docker compose exec backend bash     # Shell dans le conteneur
docker compose exec db mysql -u root -p  # Shell MySQL

# Mode Manuel (SSH)
tail -f ~/storage/logs/app.log       # Logs applicatifs
tail -f /var/log/apache2/error.log   # Logs Apache
mysql -u alpe -p alpe_bourse         # Shell MySQL
```
