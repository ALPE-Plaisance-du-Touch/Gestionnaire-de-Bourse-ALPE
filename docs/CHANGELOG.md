---
id: DOC-099-CHANGELOG
title: Changelog (SemVer)
status: draft
version: 0.5.0
updated: 2025-11-06
owner: ALPE Plaisance du Touch
links:
  - rel: source
    href: Reglement_deposant.md
    title: Règlement déposant
  - rel: source
    href: Reglement_interne.md
    title: Règlement intérieur
---

# Historique des versions

## [0.7.0] - 2025-12-28
- **Guide de déploiement (nouveau)**
  - **Document DOC-130** : `deploiement.md`
  - **Deux modes de déploiement** :
    - Mode manuel : hébergement mutualisé (OVH, o2switch) avec MariaDB mutualisée
    - Mode Docker : développement local et production future (VPS/Cloud)
  - **Mode manuel** :
    - Structure des fichiers serveur
    - Configuration Apache (.htaccess) avec routing SPA et proxy API
    - Configuration Passenger (WSGI) pour Python
    - Scripts de déploiement initial et mise à jour
    - Configuration des backups automatiques (cron)
  - **Mode Docker** :
    - Dockerfiles multi-stage (backend, frontend, nginx)
    - Docker Compose développement avec hot-reload
    - Docker Compose production avec Gunicorn et SSL
    - Makefile avec commandes simplifiées
    - Configuration MailHog et phpMyAdmin pour debug
  - **Configuration SSL** : Let's Encrypt via hébergeur ou Certbot
  - **Monitoring et logs** : health checks, commandes de diagnostic
  - **Troubleshooting** : problèmes courants et solutions

## [0.6.0] - 2025-12-28
- **Bonnes pratiques de développement (nouveau)**
  - **Document DOC-120** : `bonnes-pratiques.md`
  - **Langue du code** : tout le code en anglais (variables, fonctions, commentaires, commits)
  - **Mapping terminologique** : correspondance français (métier) ↔ anglais (code)
  - **Conventions de nommage** :
    - Python : snake_case (fonctions, variables), PascalCase (classes), SCREAMING_SNAKE_CASE (constantes)
    - TypeScript : camelCase (fonctions, variables), PascalCase (composants, types)
    - Base de données : snake_case, pluriel pour les tables
  - **Structure du code** :
    - Backend : architecture en couches (API → Service → Repository → Model)
    - Frontend : feature-based structure avec hooks et composants
  - **Patterns architecturaux** détaillés avec exemples
  - **Gestion des erreurs** : exceptions personnalisées, handlers, Error Boundaries
  - **Commentaires et documentation** : quand et comment documenter (docstrings Google style, JSDoc)
  - **Git et versioning** :
    - Branches : feature/, fix/, hotfix/ avec convention de nommage
    - Commits : Conventional Commits (feat, fix, docs, refactor, test, chore)
    - Template de Pull Request
  - **Sécurité du code** : validation des entrées (Pydantic, Zod), gestion des secrets
  - **Performance** : éviter N+1, pagination, memoization React
  - **Accessibilité (a11y)** : labels, ARIA, contraste
  - **Checklist de code review**

## [0.5.0] - 2025-11-06
- **Intégration du Règlement intérieur** (organisation bénévoles et processus opérationnels)
  - **Source** : docs/Reglement_interne.md (règlement interne ALPE septembre 2025, 879 lignes)

  - **Glossaire (v0.4.0)** : ajout termes organisation et listes spéciales
    - Adhérent ALPE (conditions : cotisation à jour, participation 8h min pour listes 1000/2000)
    - Listes 1000 (étiquettes blanches) : adhérents participants, numéros fixes, 2→4 listes, 1€/liste déduit ventes
    - Listes 2000 (étiquettes groseille) : famille/amis adhérents, numérotation liée aux 1000, max 4 listes pour 2 personnes, 5€ pour 2 listes
    - Créneaux de dépôt avec capacités (20/40/15/32 déposants selon horaire)
    - Créneaux réservés Plaisançois (mercredi 20h-22h, vendredi 9h30-12h)
    - Couleurs d'étiquettes par numéro (100=bleu ciel, 200=jaune, 300=fushia, 400=lilas, 500=vert menthe, 600=clémentine, 1000=blanc, 2000=groseille)
    - Horaires restitution différenciés (lundi 18h30-19h30 pour standard, dimanche 17h-18h pour 1000/2000)
    - Date limite recommandée : 3 semaines avant collecte (impression étiquettes par ALPE)
    - Vente privée écoles/ALAE (vendredi 17h-18h avant vente publique)

  - **Exigences (v0.4.0)** : 6 nouvelles exigences d'organisation
    - REQ-F-011 : précision date limite 3 semaines avant collecte
    - REQ-F-013 (nouveau) : restrictions dépôts (1 seul/semaine, majeur uniquement, vérification identité, créneaux Plaisançois réservés sur justificatif domicile)
    - REQ-F-014 (nouveau) : gestion créneaux avec capacités (mercredi 20/40/20, jeudi 15/32, vendredi 15 déposants)
    - REQ-F-015 (nouveau) : listes spéciales 1000/2000 (numérotation, frais différenciés, créneaux spéciaux mardi/mercredi/jeudi, restitution dimanche)
    - REQ-F-016 (nouveau) : horaires restitution différenciés selon type liste
    - REQ-F-017 (nouveau) : vente privée écoles/ALAE Plaisance-du-Touch vendredi 17h-18h

  - **Modèle de domaine (v0.4.0)** : nouveau modèle créneaux et types de listes
    - Nouvelle entité **Creneau** (date, heure_debut, heure_fin, capacite_max, places_reservees, reserve_plaisancois)
    - Entité **Liste** enrichie avec type (standard/1000/2000), couleur_etiquette, frais selon type
    - Relations : Edition → Creneau (définit), Deposant → Creneau (réserve)
    - Section "Créneaux de dépôt" : capacités standard, créneaux spéciaux 1000/2000, restriction 1 seul créneau/déposant
    - Section "Listes" refonte complète : 3 types détaillés, couleurs étiquettes, horaires restitution
    - Section "Reversements" : tarification différenciée (standard 5€ Billetweb, 1000 1€/liste, 2000 5€/2 listes déduits des ventes)
    - 7 nouveaux invariants (capacité créneau, un dépôt/semaine, créneaux Plaisançois, max listes selon type, numérotation 1000↔2000)

  - **US-002 enrichie** : ajout contraintes date limite et dépôt
    - Contexte métier : date limite 3 semaines avant collecte (impression étiquettes ALPE)
    - Note : un déposant = un seul dépôt par semaine de collecte (vérification identité au dépôt physique)

  - **US-007 enrichie** : ajout configuration créneaux avec capacités
    - AC-2bis (nouveau) : configuration créneaux de dépôt (date, horaires, capacité max, réservé Plaisançois)
    - Exemples capacités standard : mercredi 20/40/20, jeudi 15/32, vendredi 15 déposants
    - Blocage réservations une fois capacité atteinte

  - **Réorganisation user-stories (v0.3.1)** : ordre numérique
    - US-001, US-002, US-006, US-007, US-008, US-009 maintenant dans l'ordre logique

## [0.4.0] - 2025-11-06
- **Intégration complète du Règlement déposant**
  - **Source** : docs/Reglement_deposant.md (règlement officiel ALPE du 23/09/2025)

  - **US-002 (nouvelle)** : Déclarer mes articles dans mes listes
    - 15 critères d'acceptation détaillés couvrant toutes les règles métier
    - Gestion des 2 listes max par déposant (24 articles max dont 12 vêtements)
    - Lignes 1-12 réservées vêtements, lignes 13-24 pour toutes catégories
    - Contraintes par catégorie (1 manteau, 1 sac, 2 foulards, 1 tour de lit, 1 peluche, 5 livres adultes max)
    - Gestion des lots (vêtements enfant bodys/pyjamas jusqu'à 36 mois, 3 articles max)
    - Validation prix (1€ min, 150€ max pour poussettes)
    - Liste noire d'articles refusés (sièges-autos, CD/DVD, casques, etc.)
    - Date limite de déclaration avec blocage après échéance
    - Certification de conformité obligatoire par article
    - Aide contextuelle avec prix indicatifs selon catégorie
    - 20 cas de test suggérés

  - **Exigences (v0.3.0)** : enrichissement avec contraintes réglementaires
    - REQ-F-002 : ajout contraintes listes (2 max), articles (24 max dont 12 vêtements), prix (1-150€), catégories
    - REQ-F-002-BIS (nouveau) : validation qualité articles selon règlement
    - REQ-F-005 : ajout tarification précise (5€ frais + 20% commission)
    - REQ-F-011 (nouveau) : gestion date limite de déclaration avec avertissement 3 jours avant
    - REQ-F-012 (nouveau) : affichage rappels réglementaires jour de dépôt

  - **Modèle de domaine (v0.3.0)** : refonte avec entité Liste
    - Ajout entité **Liste** avec attributs (numero, statut, compteurs articles/vêtements)
    - Refonte entité **Article** avec (numero_ligne 1-24, is_lot, lot_quantity, lot_marque, conformite_certifiee)
    - Mise à jour **Edition** avec date_limite_declaration
    - Mise à jour **Deposant** avec creneau_depot
    - Relations : Deposant → Liste (max 2) → Articles (max 24)
    - Ajout 9 invariants pour contraintes listes et articles
    - Règles métier détaillées par entité avec références REQ
    - Documentation tarification ALPE (5€ + 20% commission)

  - **Catégories articles (v1.0.0)** : nouveau document de référence pour bénévoles
    - Guide complet des catégories acceptées avec critères qualité
    - Liste exhaustive des articles refusés (liste noire)
    - Grille de prix indicatifs par type d'article
    - Procédure de vérification au dépôt (checklist bénévole)
    - Gestion des refus et rappels réglementaires

  - **US-007 enrichie** : ajout date limite déclaration et tarification
    - Configuration date_limite_declaration (avant première date de dépôt)
    - Taux commission par défaut 20%
    - Note informative sur frais inscription 5€ (Billetweb)
    - Validation ordre chronologique incluant date limite
    - Blocage modification listes après date limite

## [0.3.0] - 2025-11-05
- **Concept fondamental : Gestion des Éditions de bourse**
  - **Glossaire (v0.2.0)** : ajout de 20+ termes (Édition, cycle de vie, rôles Administrateur/Gestionnaire, Billetweb, dates clés)
  - **Personas (v0.2.0)** : ajout de 2 nouveaux personas détaillés
    - Gestionnaire (Sophie) : configuration éditions, import Billetweb, pilotage
    - Administrateur (Pierre) : création/clôture éditions, gestion utilisateurs, conformité
    - Enrichissement Déposant et Bénévole avec profils détaillés
  - **User Stories (v0.3.0)** : ajout de 4 nouvelles US pour gestion éditions
    - US-006 : Créer une nouvelle édition (administrateur) - 9 AC
    - US-007 : Configurer les dates clés (gestionnaire) - 6 AC
    - US-008 : Importer inscriptions Billetweb (gestionnaire) - 11 AC
    - US-009 : Clôturer une édition (administrateur) - 8 AC
    - Total : 34 critères d'acceptation + règles métier + 36 tests suggérés
  - **Modèle de domaine (v0.2.0)** : refonte complète
    - Ajout entité Edition avec 7 entités (Edition, User, Deposant, Article, Vente, Reversement, Invitation)
    - Diagramme cycle de vie Edition (6 états : Brouillon → Archivée)
    - Règles métier par entité + 7 invariants système
  - **Exigences (v0.2.0)** : restructuration et enrichissement
    - Ajout REQ-F-006 à REQ-F-009 (gestion éditions)
    - Ajout REQ-F-010 (gestion rôles)
    - Organisation par domaine : éditions, utilisateurs, articles/ventes
    - Critères d'acceptation, priorités et responsables de validation pour chaque REQ

## [0.2.0] - 2025-11-05
- **US-001 enrichie** : ajout de 14 critères d'acceptation détaillés (vs 3 initiaux)
  - Cas d'erreur complets (mot de passe invalide, téléphone, champs manquants, tokens expirés/invalides)
  - Spécifications sécurité (rate limiting, audit logs, bcrypt)
  - Critères d'accessibilité (WCAG 2.1 AA, navigation clavier, lecteurs d'écran)
  - Règles métier explicites (durée validité 7 jours, token unique, email = identifiant)
  - Métriques de performance (< 3s activation, < 5min email confirmation)
  - Données RGPD détaillées avec conservation
  - 16 cas de test suggérés pour validation complète

## [0.1.0] - 2025-11-03
- Création de l'ossature `docs/` (README, glossaire, personas, US, exigences, domaine, archi, UI, sécurité, opérations).
- Ajout `api/openapi.yaml`, `adr/DEC-000.md`, `index.yaml`, `CHANGELOG.md`.

