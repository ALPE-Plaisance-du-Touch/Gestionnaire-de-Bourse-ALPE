# PLAN.md - Plan unifié du projet

Ce fichier centralise toute la planification : roadmap de développement, taches de spécification
restantes et préparation production. Il remplace `docs/plan.md` (plan de rédaction des specs,
archivé car terminé à 95%+).

---

## Règle de versionnement

La version majeure reste à **0** tant que des fonctionnalités sont ajoutées.
Le passage à **1.0.0** marque le feature freeze : seuls les bugfixes, la stabilisation
et les corrections de sécurité sont acceptés à partir de ce point.

```
0.x   = développement actif (nouvelles features)
1.0.0 = feature freeze → debug, stabilisation, production
1.x.y = maintenance (patches, bugfixes)
```

---

## Bilan des versions livrées

| Version | Nom | Statut |
|---------|-----|--------|
| 0.1 | Project Scaffolding | ✅ Done |
| 0.2 | Authentication | ✅ Done |
| 0.3 | Edition Management | ✅ Done |
| 0.4 | Billetweb Import | ✅ Done |
| 0.5 | Article Declaration | ✅ Done |
| 0.6 | Label Generation | ✅ Done |
| 0.7 | Sales & Checkout | ✅ Done |
| 0.8 | Payout Calculation | ✅ Done |
| 0.9 | Dashboard & Reports | ✅ Done |
| 0.10 | Edition Closure | ✅ Done |
| 0.11 | PWA & Offline Mode | ✅ Done |
| 0.12 | Conformité RGPD & Sécurité | ✅ Done |
| 0.13 | Ops & Déploiement | ✅ Done |
| 0.14 | Listes spéciales & Règles métier | ✅ Done |
| 0.15 | Fonctionnalités secondaires | ✅ Done |

**Conformité specs : ~85%** (56/66 exigences couvertes) — voir [rapport d'analyse](docs/analysis-report-2026-02-09.md)

---

## Roadmap v0.12 → v1.0.0

| Version | Nom | Périmètre | Priorité |
|---------|-----|-----------|----------|
| 0.12 | Conformité RGPD & Sécurité | Droits utilisateurs RGPD, audit logging, headers sécurité | Haute |
| 0.13 | Ops & Déploiement | HTTPS/TLS production, backup/restore automatisé | Haute |
| 0.14 | Listes spéciales & Règles métier | Listes 1000/2000, date limite déclaration, capacité créneaux | ✅ Done |
| 0.15 | Fonctionnalités secondaires | Vente privée écoles, rappel récupération, aide tarifaire, prévisualisation | ✅ Done |
| 0.16 | Accessibilité & UX | WCAG 2.1 AA, indicateur mot de passe, UX scanner, détection déposant | Moyenne |
| 0.17 | Améliorations gestion | Override annulation, export Excel invitations, archivage auto, relance bulk | Basse |
| 1.0.0 | Feature Freeze & Production | Bug fixes, tests intégration, perf, audit, release | - |

---

## v0.12 - Conformité RGPD & Sécurité ✅

**Branche :** `feature/rgpd-security`
**Exigences :** REQ-NF-003, REQ-NF-009

### RGPD - Droits utilisateurs (TASK-001) ✅
- [x] **0.12.1** Backend : service GDPR (export données JSON, anonymisation compte)
- [x] **0.12.2** Backend : endpoints `/users/me/export`, `DELETE /users/me`, `PATCH /users/me`
- [x] **0.12.3** Backend : migration `deleted_at`, `anonymized_at` sur User
- [x] **0.12.4** Frontend : page Profil (édition nom, prénom, téléphone, adresse)
- [x] **0.12.5** Frontend : page Politique de confidentialité + lien dans le footer
- [x] **0.12.6** Frontend : bouton "Supprimer mon compte" avec confirmation + export préalable

### Audit Logging (TASK-002) ✅
- [x] **0.12.7** Backend : modèle `AuditLog` (timestamp, user_id, role, ip, user_agent, action, entity, result)
- [x] **0.12.8** Backend : migration + service `log_action()` (never-raise design)
- [x] **0.12.9** Backend : intégration aux endpoints sensibles (auth, profil, export, suppression)
- [x] **0.12.10** Frontend : page admin AuditLogPage (liste paginée, filtres par action/utilisateur/date)

### Tests & docs ✅
- [x] **0.12.11** Tests unitaires GDPR (5 tests : export, anonymisation, timestamps)
- [x] **0.12.12** Tests unitaires audit logging (8 tests : création, filtrage, pagination, résilience)
- [x] **0.12.13** Mise à jour DEVELOPMENT.md

---

## v0.13 - Ops & Déploiement ✅

**Branche :** `feature/ops-deploy`
**Exigences :** REQ-NF-010, REQ-NF-012

### HTTPS/TLS Production (TASK-003) ✅
- [x] **0.13.1** Config nginx production : SSL termination, Let's Encrypt, auto-renew
- [x] **0.13.2** Headers de sécurité : HSTS, X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy, Permissions-Policy
- [x] **0.13.3** Redirect HTTP → HTTPS automatique
- [x] **0.13.4** docker-compose.prod.yml avec variables d'environnement production

### Backup/Restore (TASK-004) ✅
- [x] **0.13.5** Script backup quotidien MariaDB (`scripts/backup.sh`) avec politique de rétention
- [x] **0.13.6** Script restauration (`scripts/restore.sh`) avec vérification d'intégrité
- [x] **0.13.7** Cron configuration (`scripts/setup-cron.sh`) + snapshot pré-édition
- [x] **0.13.8** Scripts documentés avec usage intégré (--help)
- [x] **0.13.9** Test de restauration automatisé (`scripts/test-restore.sh`)

### Tests & docs ✅
- [x] **0.13.10** Validation syntaxe bash (`bash -n`) tous scripts
- [x] **0.13.11** Mise à jour DEVELOPMENT.md

---

## v0.14 - Listes spéciales & Règles métier

**Branche :** `feature/special-lists`
**Exigences :** REQ-F-011, REQ-F-014, REQ-F-015

### Listes spéciales 1000/2000 (TASK-009)
- [x] **0.14.1** Backend : numérotation automatique (standard 100-600, ALPE 1000+, amis 2000+)
- [x] **0.14.2** Backend : frais de liste (1 EUR liste 1000, 5 EUR pour 2 listes 2000)
- [x] **0.14.3** Backend : créneaux réservés Plaisançois (mercredi 20h-22h, vendredi 9h30-12h)
- [x] **0.14.4** Frontend : sélection type de liste dans import Billetweb + invitation manuelle
- [x] **0.14.5** Frontend : couleurs étiquettes par type (blanc standard, blanc ALPE, rose amis)

### Date limite déclaration articles (TASK-011)
- [x] **0.14.6** Backend : vérification date limite dans les endpoints articles (create/update/delete)
- [x] **0.14.7** Backend : email rappel automatique 3 jours avant la date limite
- [x] **0.14.8** Frontend : bannière d'avertissement sur la page de déclaration si < 3 jours

### Capacité créneaux de dépôt (TASK-008)
- [x] **0.14.9** Backend : vérification capacité dans l'import Billetweb (pas de surréservation)
- [x] **0.14.10** Frontend : affichage places restantes sur chaque créneau

### Tests & docs
- [x] **0.14.11** Tests unitaires listes spéciales, date limite, capacité
- [x] **0.14.12** Mise à jour DEVELOPMENT.md

---

## v0.15 - Fonctionnalités secondaires ✅

**Branche :** `feature/secondary-features`

### Vente privée écoles (TASK-010) ✅
- [x] **0.15.1** Backend : flag `is_private_sale` sur Sale, migration, détection auto vendredi 17h-18h
- [x] **0.15.2** Frontend : bannière "Vente privée écoles/ALAE" sur la page caisse

### Rappel récupération déposants absents (TASK-012) ✅
- [x] **0.15.3** Backend : endpoint bulk remind (`POST /payouts/bulk-remind`) + relance individuelle existante
- [x] **0.15.4** Frontend : bouton "Relancer tous les absents" sur PayoutsManagementPage

### Aide tarifaire articles (TASK-006) ✅ (déjà implémenté en v0.5)
- [x] **0.15.5** Backend : `PriceHint` schema + `get_price_hints()` + endpoint `GET /price-hints`
- [x] **0.15.6** Frontend : tooltip aide tarifaire dans ArticleForm

### Prévisualisation liste déposant (TASK-007) ✅
- [x] **0.15.7** Backend : endpoint `GET /lists/{id}/pdf` pour téléchargement PDF
- [x] **0.15.8** Frontend : bouton "Télécharger PDF" sur ListDetailPage

### Tests & docs ✅
- [x] **0.15.9** Tests unitaires vente privée (8 tests), schemas PDF (4 tests)
- [x] **0.15.10** Mise à jour DEVELOPMENT.md

---

## v0.16 - Accessibilité & UX

**Branche :** `feature/a11y-ux`
**Exigences :** REQ-NF-004

### WCAG 2.1 AA (TASK-005)
- [ ] **0.16.1** ARIA landmarks sur toutes les pages (header, nav, main, footer)
- [ ] **0.16.2** Navigation clavier complète (Tab, Entrée, Échap), focus visible
- [ ] **0.16.3** Contraste texte/fond >= 4.5:1 (audit + corrections)
- [ ] **0.16.4** Labels explicites sur tous les champs de formulaire
- [ ] **0.16.5** Test lecteur d'écran (NVDA/VoiceOver) sur les écrans prioritaires

### Indicateur force mot de passe (TASK-019)
- [ ] **0.16.6** Frontend : barre Faible/Moyen/Fort en temps réel sur ActivatePage et ResetPasswordPage

### UX scanner QR (TASK-015)
- [ ] **0.16.7** Frontend : hint timeout 5s, meilleur messaging saisie manuelle, validation format

### Détection déposant existant (TASK-016)
- [ ] **0.16.8** Backend : endpoint `GET /invitations/lookup?email={email}`
- [ ] **0.16.9** Frontend : auto-suggestion avec historique dans le formulaire d'invitation

### Tests & docs
- [ ] **0.16.10** Audit accessibilité (axe DevTools) sur les écrans prioritaires
- [ ] **0.16.11** Mise à jour DEVELOPMENT.md

---

## v0.17 - Améliorations gestion

**Branche :** `feature/management-enhancements`

### Override annulation vente par gestionnaire (TASK-017)
- [ ] **0.17.1** Backend : paramètre `manager_override` sur `cancel_sale()`, bypass limite 5 min
- [ ] **0.17.2** Frontend : page SalesManagementPage (liste ventes, filtre, annulation manager)

### Export Excel statistiques invitations (TASK-014)
- [ ] **0.17.3** Backend : endpoint `GET /invitations/export-excel` (3 onglets)
- [ ] **0.17.4** Frontend : bouton "Exporter Excel" sur InvitationStatsPage

### Archivage automatisé éditions (TASK-018)
- [ ] **0.17.5** Frontend : onglets Actives / Clôturées / Archivées sur EditionsListPage
- [ ] **0.17.6** Badge "À archiver" sur les éditions clôturées > 1 an

### Relance invitations en masse (TASK-020)
- [ ] **0.17.7** Backend : endpoint `POST /invitations/bulk-resend`
- [ ] **0.17.8** Frontend : sélection checkbox + bouton "Relancer la sélection" sur InvitationsPage

### Renforcement prérequis clôture (TASK-013)
- [ ] **0.17.9** Backend : vérification reversements calculés + paiements finalisés dans closure check

### Tests & docs
- [ ] **0.17.10** Tests unitaires pour chaque fonctionnalité
- [ ] **0.17.11** Mise à jour DEVELOPMENT.md

---

## v1.0.0 - Feature Freeze & Production

**Prérequis :** Toutes les versions 0.12 à 0.17 terminées et testées.

À partir de cette version, plus aucune fonctionnalité n'est ajoutée.
Seuls les bugfixes, la stabilisation et l'optimisation sont acceptés.

### Tests & validation
- [ ] **1.0.1** Tests d'intégration end-to-end (scénario complet déposant + bénévole + gestionnaire)
- [ ] **1.0.2** Tests de charge (5 caisses simultanées, 50 transactions/min) — REQ-NF-001, REQ-NF-005
- [ ] **1.0.3** Audit sécurité (OWASP ZAP, vérification headers, injection)
- [ ] **1.0.4** Audit accessibilité externe (WCAG 2.1 AA)
- [ ] **1.0.5** Tests RGPD exhaustifs (export, rectification, effacement, portabilité)

### Specs & docs restantes
- [ ] **1.0.6** Compléter traçabilité : tests manquants pour REQ-F-012, F-013, F-015, F-016
- [ ] **1.0.7** Créer REQ-F-018 pour US-010 (identifiée comme manquante dans la matrice)
- [ ] **1.0.8** Revue documentation (README utilisateur, guides déploiement)

### Stabilisation
- [ ] **1.0.9** Optimisation performance (lazy loading, bundle size, requêtes N+1)
- [ ] **1.0.10** Bug fixes identifiés durant les tests
- [ ] **1.0.11** Tag release + déploiement production

---

## Correspondance TASK → Version

| TASK | Version | Nom | Exigence |
|------|---------|-----|----------|
| TASK-001 | 0.12 | RGPD droits utilisateurs | REQ-NF-003 |
| TASK-002 | 0.12 | Audit logging centralisé | REQ-NF-009 |
| TASK-003 | 0.13 | HTTPS/TLS production | REQ-NF-010 |
| TASK-004 | 0.13 | Backup/restore automatisé | REQ-NF-012 |
| TASK-005 | 0.16 | Accessibilité WCAG 2.1 AA | REQ-NF-004 |
| TASK-006 | 0.15 | Aide tarifaire articles | US-002 AC-8 |
| TASK-007 | 0.15 | Prévisualisation liste déposant | US-002 AC-9 |
| TASK-008 | 0.14 | Capacité créneaux de dépôt | REQ-F-014 |
| TASK-009 | 0.14 | Listes spéciales 1000/2000 | REQ-F-015 |
| TASK-010 | 0.15 | Vente privée écoles | US-004 AC-10 |
| TASK-011 | 0.14 | Date limite déclaration | REQ-F-011 |
| TASK-012 | 0.15 | Rappel récupération | US-009 AC-5 |
| TASK-013 | 0.17 | Prérequis clôture renforcés | US-009 AC-2 |
| TASK-014 | 0.17 | Export Excel invitations | US-010 AC-13 |
| TASK-015 | 0.16 | UX scanner QR | US-004 AC-7 |
| TASK-016 | 0.16 | Détection déposant existant | US-010 AC-11 |
| TASK-017 | 0.17 | Override annulation vente | US-004 AC-9 |
| TASK-018 | 0.17 | Archivage automatisé | US-009 AC-7 |
| TASK-019 | 0.16 | Indicateur force mot de passe | US-001 AC-2 |
| TASK-020 | 0.17 | Relance invitations en masse | US-010 AC-12 |

---

## Documents de référence

| Document | Chemin | Description |
|----------|--------|-------------|
| Rapport d'analyse | [docs/analysis-report-2026-02-09.md](docs/analysis-report-2026-02-09.md) | Écarts détaillés + prompts prêts à l'emploi par TASK |
| Suivi d'avancement | [DEVELOPMENT.md](DEVELOPMENT.md) | Checkboxes détaillées par version livrée |
| User Stories | [docs/user-stories.md](docs/user-stories.md) | US-001 à US-010, critères d'acceptation |
| Exigences | [docs/exigences.md](docs/exigences.md) | REQ-F-001 à F-017, REQ-NF-001 à NF-012 |
| Architecture | [docs/architecture.md](docs/architecture.md) | C4, ADR, stack technique |
| Sécurité | [docs/securite.md](docs/securite.md) | Matrice RBAC, RGPD, audit, anti-fraude |
| Opérations | [docs/operations.md](docs/operations.md) | SLOs, runbooks, checklists |
| Plan specs (archivé) | [docs/plan.md](docs/plan.md) | Plan rédaction specs — terminé (95%+) |
