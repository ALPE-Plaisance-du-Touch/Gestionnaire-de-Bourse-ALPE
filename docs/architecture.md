---
id: DOC-050-ARCHI
title: Architecture & Contexte
status: draft
version: 0.5.0
updated: 2025-12-23
owner: ALPE Plaisance du Touch
links:
  - rel: requires
    href: exigences.md
    title: Exigences fonctionnelles et non-fonctionnelles
---

# 1. Vue d'ensemble

Ce document décrit l'architecture technique de l'application **Gestionnaire de Bourse ALPE**, une solution web permettant de gérer les bourses aux vêtements et jouets organisées par l'association ALPE Plaisance du Touch.

## 1.1 Objectifs architecturaux

| Objectif | Description |
|---|---|
| **Simplicité** | Stack accessible, maintenance aisée par une équipe bénévole |
| **Robustesse** | Fonctionnement fiable pendant les pics de vente (200+ transactions/heure) |
| **Économie** | Hébergement mutualisé à faible coût |
| **Offline** | Mode dégradé pour les caisses en cas de perte réseau |

## 1.2 Contraintes

- Budget limité (association à but non lucratif)
- Équipe technique bénévole et variable
- Utilisation ponctuelle mais intensive (2 bourses/an sur 3 jours)
- Réseau WiFi potentiellement instable sur le lieu de la bourse

---

# 2. Diagrammes C4

## 2.1 Niveau 1 : Contexte

Vue d'ensemble du système et de ses interactions avec les acteurs externes.

```mermaid
flowchart TB
    subgraph Acteurs
        Deposant((Déposant))
        Benevole((Bénévole))
        Gestionnaire((Gestionnaire))
        Admin((Administrateur))
    end

    subgraph "Système Bourse ALPE"
        App[Application<br/>Gestionnaire de Bourse]
    end

    subgraph "Systèmes Externes"
        Billetweb[Billetweb<br/>Inscriptions]
        Email[Service Email<br/>SMTP]
    end

    Deposant -->|Consulte listes<br/>Déclare articles| App
    Benevole -->|Étiquette<br/>Encaisse| App
    Gestionnaire -->|Configure éditions<br/>Importe inscriptions| App
    Admin -->|Gère utilisateurs<br/>Clôture éditions| App

    Billetweb -->|Export CSV| Gestionnaire
    App -->|Notifications<br/>Confirmations| Email
```

## 2.2 Niveau 2 : Conteneurs

Décomposition technique du système en conteneurs déployables.

```mermaid
flowchart TB
    subgraph Utilisateurs
        Browser[Navigateur Web<br/>Desktop/Mobile]
        PWA[PWA Caisse<br/>Mode Offline]
    end

    subgraph "Hébergement Mutualisé"
        subgraph Frontend
            React[Application React<br/>TypeScript + Vite]
        end

        subgraph Backend
            API[API FastAPI<br/>Python 3.11+]
        end

        subgraph Données
            MySQL[(MySQL/MariaDB<br/>Base de données)]
            Files[/Stockage Fichiers<br/>PDFs étiquettes/]
        end
    end

    subgraph Services Externes
        SMTP[Serveur SMTP<br/>Emails transactionnels]
    end

    Browser -->|HTTPS| React
    PWA -->|HTTPS| React
    React -->|REST API<br/>JSON| API
    API -->|SQL| MySQL
    API -->|Lecture/Écriture| Files
    API -->|SMTP| SMTP

    PWA -.->|IndexedDB<br/>Cache local| PWA
```

## 2.3 Niveau 3 : Composants

Architecture interne de l'API Backend.

```mermaid
flowchart TB
    subgraph "API FastAPI"
        Router[Routeur API<br/>OpenAPI/Swagger]

        subgraph "Modules Métier"
            AuthModule[Module Auth<br/>JWT + Rôles]
            EditionModule[Module Éditions<br/>Cycle de vie]
            DeposantModule[Module Déposants<br/>Listes & Articles]
            VenteModule[Module Ventes<br/>Transactions]
            EtiquetteModule[Module Étiquettes<br/>Génération PDF]
            ReversementModule[Module Reversements<br/>Calculs & Paiements]
        end

        subgraph "Services Transverses"
            AuthService[Service Auth<br/>bcrypt/JWT]
            PDFService[Service PDF<br/>WeasyPrint/ReportLab]
            EmailService[Service Email<br/>SMTP async]
            SyncService[Service Sync<br/>Résolution conflits]
        end

        subgraph "Couche Données"
            ORM[SQLAlchemy<br/>ORM]
            Migrations[Alembic<br/>Migrations]
        end
    end

    Router --> AuthModule
    Router --> EditionModule
    Router --> DeposantModule
    Router --> VenteModule
    Router --> EtiquetteModule
    Router --> ReversementModule

    AuthModule --> AuthService
    EtiquetteModule --> PDFService
    DeposantModule --> EmailService
    VenteModule --> SyncService

    AuthModule --> ORM
    EditionModule --> ORM
    DeposantModule --> ORM
    VenteModule --> ORM
    ReversementModule --> ORM
```

---

# 3. Stack Technique

## 3.1 Frontend

| Composant | Technologie | Justification |
|---|---|---|
| Framework | React 18+ | Écosystème mature, composants réutilisables |
| Langage | TypeScript | Typage statique, meilleure maintenabilité |
| Build | Vite | Build rapide, configuration simple |
| State | React Query + Context | Gestion cache API + état local |
| UI | Tailwind CSS | Utilitaire, responsive, bundle optimisé |
| PWA | Workbox | Service Worker pour mode offline |
| QR/Barcode | html5-qrcode | Scan caméra tablette/smartphone |

## 3.2 Backend

| Composant | Technologie | Justification |
|---|---|---|
| Framework | FastAPI | Async natif, documentation OpenAPI auto |
| Langage | Python 3.11+ | Lisible, large écosystème, hébergement mutualisé |
| ORM | SQLAlchemy 2.0 | ORM mature, support async |
| Migrations | Alembic | Gestion versions schéma DB |
| Auth | python-jose + passlib | JWT + bcrypt |
| PDF | WeasyPrint ou ReportLab | Génération étiquettes |
| Email | aiosmtplib | Envoi async emails |
| Validation | Pydantic | Validation données entrantes |

## 3.3 Base de données

| Composant | Technologie | Justification |
|---|---|---|
| SGBD | MySQL 8.0 / MariaDB 10.6+ | Disponible hébergement mutualisé |
| Charset | utf8mb4 | Support complet Unicode/émojis |
| Collation | utf8mb4_unicode_ci | Tri insensible à la casse |

## 3.4 Infrastructure

| Composant | Solution | Justification |
|---|---|---|
| Hébergement | Mutualisé (OVH, o2switch, etc.) | Coût ~50-100€/an |
| Déploiement | FTP/SSH + scripts | Compatible hébergement mutualisé |
| SSL | Let's Encrypt (via hébergeur) | HTTPS gratuit |
| Backup | Automatique hébergeur + export manuel | Sécurité données |

---

# 4. Mode Offline (Caisses)

## 4.1 Stratégie

Le mode offline est un **fallback** en cas de perte réseau, pas le mode principal.

```mermaid
sequenceDiagram
    participant Caisse as PWA Caisse
    participant SW as Service Worker
    participant IDB as IndexedDB
    participant API as API Backend

    Note over Caisse,API: Mode Normal (Online)
    Caisse->>API: Scan article
    API-->>Caisse: Détails article
    Caisse->>API: Valider vente
    API-->>Caisse: Confirmation

    Note over Caisse,API: Perte Réseau
    Caisse->>SW: Scan article
    SW->>IDB: Recherche cache
    IDB-->>SW: Données article
    SW-->>Caisse: Détails (cache)
    Caisse->>IDB: Stocker vente locale
    IDB-->>Caisse: OK (pending sync)

    Note over Caisse,API: Retour Réseau
    SW->>IDB: Récupérer ventes pending
    SW->>API: Sync batch ventes
    API-->>SW: Résolution conflits
    SW->>IDB: Marquer synchronisées
```

## 4.2 Données cachées localement

| Données | Stratégie cache | Durée |
|---|---|---|
| Catalogue articles (édition en cours) | Pre-fetch au login | Session |
| Liste des prix | Pre-fetch | Session |
| Ventes en attente | Stockage IndexedDB | Jusqu'à sync |
| Assets statiques | Service Worker | Long terme |

## 4.3 Résolution de conflits

- **Ventes concurrentes sur même article** : Premier arrivé, premier servi (timestamp serveur)
- **Article vendu offline puis online** : Alerte gestionnaire pour résolution manuelle
- **Limite** : Maximum 50 ventes offline par caisse avant sync obligatoire

---

# 5. Sécurité

## 5.1 Authentification

```mermaid
sequenceDiagram
    participant User as Utilisateur
    participant App as Frontend
    participant API as Backend
    participant DB as MySQL

    User->>App: Email + Mot de passe
    App->>API: POST /auth/login
    API->>DB: Vérifier credentials
    DB-->>API: User + hash
    API->>API: Vérifier bcrypt
    API-->>App: JWT (access + refresh)
    App->>App: Stocker tokens

    Note over App,API: Requêtes authentifiées
    App->>API: GET /api/... + Bearer token
    API->>API: Valider JWT
    API-->>App: Données
```

## 5.2 Tokens JWT

| Token | Durée | Usage |
|---|---|---|
| Access Token | 15 minutes | Authentification API |
| Refresh Token | 7 jours | Renouvellement access token |

## 5.3 Rôles et permissions

| Ressource | Déposant | Bénévole | Gestionnaire | Admin |
|---|:---:|:---:|:---:|:---:|
| Voir ses propres listes | ✅ | ✅ | ✅ | ✅ |
| Modifier ses articles | ✅ | ❌ | ❌ | ❌ |
| Scanner/encaisser | ❌ | ✅ | ✅ | ✅ |
| Annuler une vente | ❌ | ❌ | ✅ | ✅ |
| Configurer édition | ❌ | ❌ | ✅ | ✅ |
| Importer inscriptions | ❌ | ❌ | ✅ | ✅ |
| Gérer utilisateurs | ❌ | ❌ | ❌ | ✅ |
| Créer/clôturer édition | ❌ | ❌ | ❌ | ✅ |

---

# 6. Schéma de données (simplifié)

```mermaid
erDiagram
    EDITION ||--o{ INSCRIPTION : contient
    EDITION ||--o{ LISTE : contient
    EDITION ||--o{ VENTE : enregistre

    UTILISATEUR ||--o{ INSCRIPTION : "s'inscrit"
    UTILISATEUR ||--o{ LISTE : possede
    UTILISATEUR }|--|| ROLE : a

    LISTE ||--o{ ARTICLE : contient
    ARTICLE ||--o| VENTE : vendu_dans

    EDITION {
        int id PK
        string nom
        enum statut
        date date_debut_vente
        date date_fin_vente
        decimal taux_commission
    }

    UTILISATEUR {
        int id PK
        string email UK
        string password_hash
        string nom
        string prenom
        int role_id FK
    }

    ROLE {
        int id PK
        string nom
        json permissions
    }

    INSCRIPTION {
        int id PK
        int edition_id FK
        int utilisateur_id FK
        datetime creneau_depot
        boolean est_plaisancois
    }

    LISTE {
        int id PK
        int edition_id FK
        int utilisateur_id FK
        int numero
        enum type
        string couleur_etiquette
    }

    ARTICLE {
        int id PK
        int liste_id FK
        string description
        string taille
        string categorie
        decimal prix
        enum statut
    }

    VENTE {
        int id PK
        int edition_id FK
        int article_id FK
        datetime date_vente
        int caisse_numero
        string mode_paiement
    }
```

---

# 7. Risques et mitigations

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Perte réseau pendant vente | Élevé | Moyenne | Mode offline PWA |
| Pic de charge encaissement | Moyen | Élevée | Cache agressif, optimisation requêtes |
| Double scan article | Élevé | Moyenne | Verrouillage optimiste + alerte |
| Panne hébergeur | Critique | Faible | Backup quotidien, procédure bascule |
| Fuite données personnelles | Critique | Faible | Chiffrement, RGPD, accès restreint |
| Erreur calcul reversement | Élevé | Faible | Tests automatisés, double validation |

---

# 8. ADRs (Architecture Decision Records)

## ADR-001 : Choix du framework frontend

**Statut** : Accepté
**Date** : 2025-12-23

### Contexte
L'application nécessite une interface web responsive accessible sur desktop et tablettes.

### Décision
Utiliser **React 18+ avec TypeScript** et Vite comme bundler.

### Justification
- Écosystème mature avec large communauté
- TypeScript améliore la maintenabilité
- Excellent support PWA via Workbox
- Nombreux développeurs React disponibles

### Alternatives considérées
- Vue.js : Plus simple mais écosystème moins étendu
- Angular : Trop complexe pour le besoin

---

## ADR-002 : Choix du framework backend

**Statut** : Accepté
**Date** : 2025-12-23

### Contexte
Le backend doit exposer une API REST, gérer l'authentification et générer des PDFs.

### Décision
Utiliser **Python 3.11+ avec FastAPI**.

### Justification
- Documentation OpenAPI générée automatiquement
- Async natif pour les opérations I/O
- Compatible hébergement mutualisé (WSGI/CGI possible)
- Python lisible, maintenance aisée

### Alternatives considérées
- Node.js/Express : Full-stack JS mais moins adapté hébergement mutualisé
- PHP/Laravel : Bon pour mutualisé mais moins moderne

---

## ADR-003 : Choix de la base de données

**Statut** : Accepté
**Date** : 2025-12-23

### Contexte
Stockage relationnel des données métier avec transactions.

### Décision
Utiliser **MySQL 8.0 ou MariaDB 10.6+**.

### Justification
- Universellement disponible en hébergement mutualisé
- Robuste et éprouvé
- Outils d'administration répandus (phpMyAdmin)

### Alternatives considérées
- PostgreSQL : Plus puissant mais moins répandu en mutualisé
- SQLite : Pas adapté multi-utilisateurs simultanés

---

## ADR-004 : Stratégie mode offline

**Statut** : Accepté
**Date** : 2025-12-23

### Contexte
Les caisses doivent pouvoir continuer à fonctionner en cas de perte réseau WiFi.

### Décision
Implémenter un **mode fallback offline** via PWA (Service Worker + IndexedDB).

### Justification
- Le mode online reste prioritaire
- Offline limité aux opérations de vente critiques
- Synchronisation automatique au retour réseau
- Complexité maîtrisée

### Alternatives considérées
- Offline-first : Trop complexe pour le besoin
- Pas d'offline : Risque blocage pendant la bourse

---

## ADR-005 : Hébergement mutualisé

**Statut** : Accepté
**Date** : 2025-12-23

### Contexte
Budget limité, association à but non lucratif.

### Décision
Utiliser un **hébergement web mutualisé** (type OVH, o2switch).

### Justification
- Coût très faible (~50-100€/an)
- Inclut MySQL, SSL, email, backup
- Suffisant pour 2 bourses/an avec pics courts
- Maintenance minimale

### Limites acceptées
- Pas de scaling automatique
- Performances limitées en pic extrême
- Déploiement moins automatisé

### Alternatives considérées
- Cloud managé (Vercel/Railway) : Plus cher, plus complexe
- VPS : Nécessite maintenance serveur

---

# 9. Évolutions futures

| Évolution | Priorité | Complexité | Notes |
|---|---|---|---|
| Application mobile native | Basse | Haute | PWA suffisante actuellement |
| Paiement en ligne | Moyenne | Moyenne | Intégration Stripe/PayPal possible |
| Multi-associations | Basse | Haute | Architecture multi-tenant |
| Statistiques avancées | Moyenne | Faible | Dashboard analytique |
