---
id: DOC-090-OPS
title: Opérations & Runbooks
status: draft
version: 0.5.0
updated: 2025-12-24
owner: ALPE Plaisance du Touch
links:
  - rel: architecture
    href: architecture.md
    title: Architecture technique
  - rel: security
    href: securite.md
    title: Politique de sécurité
---

# 1. Vue d'ensemble

Ce document définit les procédures opérationnelles pour l'application **Gestionnaire de Bourse ALPE**, incluant :
- Les SLOs (Service Level Objectives)
- Les procédures d'ouverture/fermeture de bourse
- Le plan de continuité en mode offline
- L'observabilité et l'alerting
- Les runbooks pour incidents courants

---

# 2. Service Level Objectives (SLOs)

## 2.1 Objectifs de disponibilité

| Période | SLO | Justification |
|---------|-----|---------------|
| **Hors bourse** (préparation) | 95% | Usage léger, déclaration articles |
| **Pendant la bourse** (3 jours) | 99.5% | Usage critique, ventes en direct |
| **Mode offline caisses** | 100% local | Continuité même sans réseau |

### Calcul de la disponibilité

```
Disponibilité = (Temps total - Temps d'indisponibilité) / Temps total × 100

Pendant la bourse (72h) :
- 99.5% = max 21.6 minutes d'indisponibilité
- 99% = max 43.2 minutes d'indisponibilité
```

## 2.2 Objectifs de performance

| Métrique | Objectif | Seuil critique |
|----------|----------|----------------|
| **Temps de scan article** (p95) | ≤ 1.5s | > 3s |
| **Temps d'encaissement** (p95) | ≤ 3s | > 5s |
| **Génération étiquettes** (300 articles) | ≤ 60s | > 120s |
| **Chargement page déposant** | ≤ 2s | > 4s |
| **Import Billetweb** (500 lignes) | ≤ 30s | > 60s |

## 2.3 Objectifs de capacité

| Ressource | Capacité nominale | Capacité maximale |
|-----------|-------------------|-------------------|
| **Déposants par édition** | 300 | 500 |
| **Articles par édition** | 6,000 | 10,000 |
| **Ventes simultanées** | 5 caisses | 8 caisses |
| **Transactions/heure (pic)** | 200 | 400 |
| **Utilisateurs connectés simultanés** | 50 | 100 |

---

# 3. Procédures opérationnelles

## 3.1 Cycle de vie d'une édition

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CYCLE DE VIE OPÉRATIONNEL                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [J-60]              [J-21]           [J-7]      [BOURSE]     [J+7]     │
│    │                   │                │           │           │       │
│    ▼                   ▼                ▼           ▼           ▼       │
│  CRÉATION          INSCRIPTIONS      GEL DES      VENTE      CLÔTURE   │
│  ÉDITION           OUVERTES          ARTICLES     ACTIVE     ÉDITION   │
│                                                                         │
│  • Config dates    • Import CSV      • Génération • Caisses  • Calcul  │
│  • Config créneaux • Envoi invit.    • étiquettes • actives  • revers. │
│  • Test système    • Suivi activ.    • Briefing   • Offline  • Export  │
│                                      • bénévoles  • ready    • Archive │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Procédure d'ouverture de bourse

### Checklist J-7 (Préparation finale)

```
□ INFRASTRUCTURE
  □ Vérifier espace disque serveur (> 2 Go libres)
  □ Vérifier certificat SSL (validité > 30 jours)
  □ Tester connectivité base de données
  □ Vérifier backup automatique fonctionnel
  □ Mettre à jour l'application si nécessaire

□ DONNÉES
  □ Valider nombre de déposants inscrits
  □ Vérifier tous les articles déclarés et validés
  □ Générer toutes les étiquettes (job batch)
  □ Exporter liste de secours (CSV) des articles

□ CAISSES
  □ Installer/mettre à jour PWA sur chaque poste
  □ Tester mode offline sur chaque caisse
  □ Vérifier scanners/douchettes connectés
  □ Former les bénévoles à l'interface caisse
  □ Préparer feuilles de caisse papier (backup)
```

### Checklist J-1 (Veille de la bourse)

```
□ SYSTÈME
  □ Vider les caches applicatifs
  □ Redémarrer les services si nécessaire
  □ Activer le monitoring renforcé
  □ Vérifier les alertes configurées

□ CAISSES
  □ Pré-charger les données offline sur chaque caisse
  □ Tester un scan fictif sur chaque poste
  □ Vérifier l'impression des tickets (si applicable)
  □ S'assurer que les batteries sont chargées (tablettes)

□ ÉQUIPE
  □ Distribuer les contacts d'urgence
  □ Rappeler la procédure de bascule offline
  □ Confirmer présence du référent technique
```

### Checklist Jour J (Ouverture)

```
□ 1H AVANT OUVERTURE
  □ Démarrer toutes les caisses
  □ Vérifier synchronisation initiale
  □ Tester un scan réel
  □ Confirmer accès réseau/WiFi
  □ Activer le dashboard temps réel

□ À L'OUVERTURE
  □ Valider les premières ventes
  □ Surveiller les métriques de performance
  □ Confirmer fonctionnement des notifications
```

## 3.3 Procédure de fermeture de bourse

### Checklist fin de journée

```
□ SYNCHRONISATION
  □ Forcer synchronisation de toutes les caisses
  □ Vérifier absence de ventes en attente
  □ Contrôler cohérence des totaux

□ CAISSES
  □ Effectuer le comptage physique
  □ Rapprocher avec les totaux système
  □ Documenter les écarts éventuels
  □ Fermer les sessions de caisse
```

### Checklist clôture édition (J+7)

```
□ REVERSEMENTS
  □ Calculer tous les reversements (batch)
  □ Générer les bordereaux PDF
  □ Valider les montants avec le trésorier
  □ Planifier les paiements (virement/espèces)

□ DONNÉES
  □ Exporter statistiques finales
  □ Générer rapport de clôture PDF
  □ Archiver les données de l'édition

□ SYSTÈME
  □ Passer l'édition en statut "Clôturée"
  □ Verrouiller en lecture seule
  □ Effectuer backup final de l'édition
  □ Désactiver le monitoring renforcé
```

---

# 4. Plan de continuité - Mode Offline

## 4.1 Architecture offline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MODE OFFLINE                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐                          ┌──────────────────────┐    │
│  │   SERVEUR    │        Réseau OK         │      CAISSE PWA      │    │
│  │   (Backend)  │◄────────────────────────►│    (IndexedDB)       │    │
│  │              │                          │                      │    │
│  │  • MySQL     │        Réseau KO         │  • Articles locaux   │    │
│  │  • API REST  │         ──X──            │  • Ventes en file    │    │
│  │  • Files     │                          │  • Sync automatique  │    │
│  └──────────────┘                          └──────────────────────┘    │
│                                                                         │
│  DÉCLENCHEMENT AUTOMATIQUE :                                           │
│  • Détection perte réseau (timeout 5s)                                 │
│  • Bascule transparente en mode local                                  │
│  • Indicateur visuel "MODE OFFLINE" en orange                          │
│                                                                         │
│  CAPACITÉ OFFLINE :                                                     │
│  • Jusqu'à 500 ventes en file d'attente                               │
│  • Données articles pré-chargées (max 10,000)                         │
│  • Autonomie : durée de la bourse (3 jours)                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Données synchronisées en mode offline

| Donnée | Pré-chargée | Créée offline | Priorité sync |
|--------|-------------|---------------|---------------|
| Articles (liste complète) | ✅ | ❌ | Haute |
| Déposants (infos basiques) | ✅ | ❌ | Moyenne |
| Ventes | ❌ | ✅ | Critique |
| Encaissements | ❌ | ✅ | Critique |
| Sessions caisse | ✅ | ✅ | Haute |

## 4.3 Procédure de resynchronisation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     RESYNCHRONISATION                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. DÉTECTION RETOUR RÉSEAU                                            │
│     • Ping serveur toutes les 30s                                      │
│     • 3 succès consécutifs = réseau OK                                 │
│                                                                         │
│  2. SYNCHRONISATION AUTOMATIQUE                                         │
│     • Envoi des ventes en file (FIFO)                                  │
│     • Signature HMAC de chaque transaction                             │
│     • Confirmation serveur pour chaque vente                           │
│                                                                         │
│  3. GESTION DES CONFLITS                                               │
│     • Article déjà vendu : alerte + annulation locale                  │
│     • Horodatage prioritaire (première vente gagne)                    │
│     • Log des conflits pour audit                                      │
│                                                                         │
│  4. VALIDATION FINALE                                                   │
│     • Comptage ventes locales vs serveur                               │
│     • Alerte si écart détecté                                          │
│     • Rapport de synchronisation                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 4.4 Procédure de fallback manuel

En cas de défaillance totale du système numérique :

```
NIVEAU 1 : Mode offline PWA
├── Continuer les ventes en mode local
├── Synchroniser dès que possible
└── Aucune intervention manuelle

NIVEAU 2 : Panne caisse individuelle
├── Basculer vers une autre caisse
├── Redémarrer la caisse défaillante
└── Récupérer données IndexedDB si possible

NIVEAU 3 : Panne totale système
├── Activer feuilles de caisse papier
├── Noter manuellement : code article + prix + heure
├── Saisir a posteriori dans le système
└── Prévoir 2h de saisie pour 200 ventes
```

---

# 5. Observabilité

## 5.1 Métriques applicatives

### Métriques business (priorité haute)

| Métrique | Description | Fréquence |
|----------|-------------|-----------|
| `ventes_total` | Nombre total de ventes | Temps réel |
| `ventes_par_minute` | Débit de ventes | 1 min |
| `montant_total_vendu` | CA cumulé en euros | Temps réel |
| `articles_restants` | Stock non vendu | 5 min |
| `caisses_actives` | Nombre de caisses connectées | 30s |
| `ventes_offline_pending` | Ventes en attente de sync | 30s |

### Métriques techniques

| Métrique | Description | Seuil alerte |
|----------|-------------|--------------|
| `api_latency_p95` | Latence API 95ème percentile | > 2s |
| `api_errors_rate` | Taux d'erreurs 5xx | > 1% |
| `db_connections_used` | Connexions DB actives | > 80% |
| `disk_usage_percent` | Utilisation disque | > 85% |
| `memory_usage_percent` | Utilisation mémoire | > 90% |
| `scan_failures` | Échecs de scan | > 5/min |

## 5.2 Logs applicatifs

### Format de log structuré

```json
{
  "timestamp": "2025-03-15T14:32:45.123Z",
  "level": "INFO|WARN|ERROR",
  "service": "api|caisse|batch",
  "correlation_id": "uuid-v4",
  "user_id": "123",
  "edition_id": "456",
  "action": "vente.create",
  "details": {
    "article_id": "789",
    "prix": 5.50,
    "caisse_id": "C1"
  },
  "duration_ms": 145
}
```

### Événements à logger

| Niveau | Événements |
|--------|------------|
| **INFO** | Vente réussie, Login, Sync OK, Génération étiquettes |
| **WARN** | Scan échoué, Sync retry, Token expirant, Capacité >80% |
| **ERROR** | Erreur DB, Échec paiement, Conflit sync, Auth échouée |

### Rétention des logs

| Type | Rétention | Stockage |
|------|-----------|----------|
| Logs applicatifs | 90 jours | Fichiers rotatifs |
| Logs d'audit | 1 an | Base de données |
| Logs de sécurité | 5 ans | Archive chiffrée |

## 5.3 Dashboard temps réel

### Vue gestionnaire pendant la bourse

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD BOURSE - Édition Printemps 2025           [En direct ●]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │  VENTES        │  │  CHIFFRE       │  │  ARTICLES      │            │
│  │  ████████ 847  │  │  D'AFFAIRES    │  │  RESTANTS      │            │
│  │  +12/min       │  │  4,523.50 €    │  │  2,153 / 5,000 │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
│                                                                         │
│  CAISSES ACTIVES                                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                         │
│  │ C1 ● │ │ C2 ● │ │ C3 ● │ │ C4 ● │ │ C5 ○ │                         │
│  │Online│ │Online│ │Offln │ │Online│ │Inact │                         │
│  │ 152  │ │ 178  │ │ 23   │ │ 165  │ │  -   │  (ventes)               │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                         │
│                                                                         │
│  VENTES PAR HEURE                                                       │
│  150│    ▄▄                                                            │
│  100│ ▄▄ ██ ▄▄                                                         │
│   50│ ██ ██ ██ ▄▄ ▄▄                                                   │
│    0└─────────────────                                                 │
│      10h 11h 12h 13h 14h                                               │
│                                                                         │
│  ALERTES                                                                │
│  ⚠️ 14:15 - Caisse C3 en mode offline (sync pending: 23 ventes)        │
│  ✅ 14:18 - Caisse C3 resynchronisée                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 6. Alerting

## 6.1 Niveaux d'alerte

| Niveau | Délai réaction | Notification | Exemples |
|--------|----------------|--------------|----------|
| **P1 - Critique** | < 15 min | SMS + Appel | Système down, perte données |
| **P2 - Majeur** | < 1h | SMS + Email | Caisse offline >30min, erreurs >5% |
| **P3 - Mineur** | < 4h | Email | Performance dégradée, disque >85% |
| **P4 - Info** | Best effort | Email digest | Stats quotidiennes, maintenance |

## 6.2 Règles d'alerte

### Alertes P1 (Critiques)

```yaml
alerte_systeme_down:
  condition: api_health_check == false pendant 2 min
  niveau: P1
  message: "CRITIQUE: API non accessible"
  action: Appeler référent technique

alerte_base_donnees:
  condition: db_connections_failed > 0 pendant 1 min
  niveau: P1
  message: "CRITIQUE: Base de données inaccessible"
  action: Vérifier MySQL, restaurer si nécessaire

alerte_sync_bloquee:
  condition: ventes_offline_pending > 100 ET sync_attempts_failed > 5
  niveau: P1
  message: "CRITIQUE: Synchronisation bloquée - risque perte données"
  action: Intervention manuelle, export données locales
```

### Alertes P2 (Majeures)

```yaml
alerte_caisse_offline_prolongee:
  condition: caisse_offline_duration > 30 min
  niveau: P2
  message: "MAJEUR: Caisse {id} offline depuis 30 min"
  action: Vérifier réseau, redémarrer caisse

alerte_taux_erreur:
  condition: api_errors_rate > 5% pendant 5 min
  niveau: P2
  message: "MAJEUR: Taux d'erreur API élevé ({rate}%)"
  action: Analyser logs, identifier cause

alerte_performance:
  condition: api_latency_p95 > 3s pendant 10 min
  niveau: P2
  message: "MAJEUR: Latence API dégradée ({latency}ms)"
  action: Vérifier charge, optimiser requêtes
```

### Alertes P3 (Mineures)

```yaml
alerte_disque:
  condition: disk_usage_percent > 85%
  niveau: P3
  message: "MINEUR: Espace disque faible ({usage}%)"
  action: Nettoyer logs/fichiers temporaires

alerte_certificat:
  condition: ssl_expiry_days < 30
  niveau: P3
  message: "MINEUR: Certificat SSL expire dans {days} jours"
  action: Renouveler certificat

alerte_scan_echecs:
  condition: scan_failures > 10 par 15 min
  niveau: P3
  message: "MINEUR: Nombreux échecs de scan"
  action: Vérifier qualité étiquettes, scanner
```

## 6.3 Contacts d'astreinte

| Rôle | Nom/Alias | Contact | Disponibilité |
|------|-----------|---------|---------------|
| **Référent technique principal** | À définir | Tel + SMS | J-1 à J+1 bourse |
| **Référent technique backup** | À définir | Tel + SMS | J-1 à J+1 bourse |
| **Gestionnaire bourse** | À définir | Tel + Email | Pendant bourse |
| **Administrateur ALPE** | À définir | Email | H ouvrées |

## 6.4 Escalade

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PROCÉDURE D'ESCALADE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  T+0        Alerte déclenchée                                          │
│    │                                                                    │
│    ▼                                                                    │
│  T+5min     Référent technique notifié (auto)                          │
│    │                                                                    │
│    │        Si non-acquittée:                                          │
│    ▼                                                                    │
│  T+15min    Référent backup notifié                                    │
│    │                                                                    │
│    │        Si P1 non résolu:                                          │
│    ▼                                                                    │
│  T+30min    Gestionnaire bourse alerté                                 │
│    │        Décision : continuer/mode dégradé/arrêt                    │
│    │                                                                    │
│    │        Si impact majeur:                                          │
│    ▼                                                                    │
│  T+1h       Administrateur ALPE informé                                │
│             Décision stratégique                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 7. Runbooks

## 7.1 RUN-001 : Incident réseau - Bascule offline

**Déclencheur** : Perte de connectivité réseau détectée

**Symptômes** :
- Indicateur "OFFLINE" affiché sur les caisses
- Dashboard gestionnaire ne se met plus à jour
- Ventes continuent localement

**Actions** :

```
1. ÉVALUATION (2 min)
   □ Identifier les caisses affectées (toutes ou certaines ?)
   □ Vérifier si c'est un problème local (WiFi) ou général (Internet)
   □ Estimer le nombre de ventes en file d'attente

2. COMMUNICATION (immédiat)
   □ Informer les bénévoles en caisse : "Mode offline activé, continuez normalement"
   □ Rassurer : les ventes sont sauvegardées localement

3. DIAGNOSTIC (5-10 min)
   □ Vérifier le routeur/box Internet
   □ Tester la connexion depuis un autre appareil
   □ Contacter le FAI si nécessaire

4. SI RÉSEAU RÉTABLI
   □ Attendre la resynchronisation automatique (30s-2min)
   □ Vérifier sur le dashboard que les compteurs se mettent à jour
   □ Contrôler le nombre de ventes synchronisées

5. SI RÉSEAU RESTE DOWN (> 30 min)
   □ Continuer en mode offline
   □ Surveiller le nombre de ventes en file (max 500/caisse)
   □ Prévoir resync à la fermeture du soir
```

**Résolution** :
- Confirmer la resynchronisation complète
- Vérifier l'absence de conflits (articles doublement vendus)
- Documenter l'incident

---

## 7.2 RUN-002 : Erreur étiquette - Régénération

**Déclencheur** : Étiquette illisible, perdue, ou erreur de scan répétée

**Symptômes** :
- Scanner ne reconnaît pas le QR code
- Étiquette physiquement endommagée
- Article sans étiquette

**Actions** :

```
1. IDENTIFICATION (1 min)
   □ Récupérer le numéro de liste du déposant
   □ Identifier l'article (description, prix)
   □ Rechercher dans le système

2. RECHERCHE ARTICLE
   □ Menu : Recherche > Articles
   □ Filtrer par : Numéro liste OU Description OU Prix
   □ Confirmer visuellement l'article trouvé

3. OPTIONS DE RÉSOLUTION

   Option A : Vente manuelle (rapide)
   □ Saisir le code article manuellement
   □ Confirmer le prix affiché
   □ Enregistrer la vente

   Option B : Réimpression étiquette (si temps)
   □ Sélectionner l'article
   □ Action > Réimprimer étiquette
   □ Coller la nouvelle étiquette
   □ Scanner normalement

4. TRAÇABILITÉ
   □ Documenter l'incident (article, raison)
   □ Si répétitif : alerter le gestionnaire
```

**Prévention** :
- Vérifier la qualité d'impression avant la bourse
- Protéger les étiquettes (pas de pliage, pas d'humidité)
- Avoir des étiquettes de secours pré-imprimées

---

## 7.3 RUN-003 : Conflit de synchronisation

**Déclencheur** : Article vendu simultanément sur 2 caisses offline

**Symptômes** :
- Alerte "Conflit de synchronisation" lors du retour online
- Article marqué "vendu" alors qu'une caisse tente de le vendre

**Actions** :

```
1. DÉTECTION
   □ Le système détecte automatiquement le conflit
   □ Notification sur la caisse concernée
   □ Log de conflit créé

2. RÉSOLUTION AUTOMATIQUE
   □ Règle : la première vente (horodatage) est conservée
   □ La seconde vente est automatiquement annulée
   □ Article retiré du panier local

3. GESTION CLIENT
   □ Informer le client : "Désolé, cet article vient d'être vendu"
   □ Proposer des alternatives si possible
   □ Ne PAS encaisser l'article en double

4. VÉRIFICATION
   □ Consulter le rapport de synchronisation
   □ Confirmer qu'une seule vente est enregistrée
   □ Vérifier les statistiques de la caisse

5. SI DÉJÀ ENCAISSÉ EN DOUBLE
   □ Procédure d'annulation partielle
   □ Rembourser le client
   □ Documenter pour le rapprochement de caisse
```

**Prévention** :
- Minimiser le temps en mode offline
- Resynchroniser régulièrement
- Éviter les articles "populaires" sur plusieurs caisses

---

## 7.4 RUN-004 : Panne d'une caisse

**Déclencheur** : Poste de caisse ne répond plus

**Symptômes** :
- Écran figé ou noir
- Application ne répond pas
- Erreur système

**Actions** :

```
1. ÉVALUATION RAPIDE (30s)
   □ L'écran est-il allumé ?
   □ L'application est-elle gelée ?
   □ Y a-t-il un message d'erreur ?

2. REDÉMARRAGE SOFT (1 min)
   □ Fermer et rouvrir l'application PWA
   □ Rafraîchir la page (Ctrl+F5)
   □ Vider le cache si nécessaire

3. SI TOUJOURS KO - REDÉMARRAGE HARD (3 min)
   □ Éteindre complètement l'appareil
   □ Attendre 30 secondes
   □ Rallumer
   □ Relancer l'application

4. RÉCUPÉRATION DES DONNÉES
   □ Les ventes sont dans IndexedDB (persistant)
   □ Au redémarrage, vérifier le compteur de ventes locales
   □ Forcer une synchronisation

5. SI CAISSE DÉFINITIVEMENT KO
   □ Basculer vers une caisse de secours
   □ OU réduire le nombre de caisses actives
   □ Documenter le matériel défaillant

6. RÉCUPÉRATION ULTÉRIEURE
   □ Après la bourse, tenter de récupérer l'IndexedDB
   □ Outils développeur > Application > IndexedDB
   □ Exporter les données manuellement si nécessaire
```

---

## 7.5 RUN-005 : Calcul reversement incorrect

**Déclencheur** : Déposant conteste le montant de son reversement

**Symptômes** :
- Écart entre le montant attendu et le montant calculé
- Articles manquants dans le récapitulatif
- Commission mal appliquée

**Actions** :

```
1. RECUEIL D'INFORMATIONS (5 min)
   □ Numéro de liste du déposant
   □ Montant contesté vs montant attendu
   □ Liste des articles concernés (si connue)

2. VÉRIFICATION DANS LE SYSTÈME
   □ Menu : Reversements > Recherche par liste
   □ Afficher le détail du calcul :
     - Ventes brutes
     - Commission (20%)
     - Frais de liste (si 1000/2000)
     - Montant net

3. AUDIT DES VENTES
   □ Lister toutes les ventes de la liste
   □ Vérifier : article, prix, date/heure, caisse
   □ Comparer avec le bordereau du déposant

4. CAS POSSIBLES

   Cas A : Article non vendu mais réclamé vendu
   □ Vérifier si l'article est en invendu
   □ Chercher dans les conflits de sync
   □ L'article peut être au stock ALPE

   Cas B : Prix de vente incorrect
   □ Comparer prix affiché vs prix déclaré
   □ Erreur possible lors de la déclaration
   □ Politique : prix de l'étiquette fait foi

   Cas C : Commission mal calculée
   □ Vérifier le taux de commission de l'édition
   □ Recalculer manuellement : brut × 0.80 = net
   □ Corriger si erreur système

5. RÉSOLUTION
   □ Si erreur confirmée : ajustement manuel
   □ Si calcul correct : expliquer au déposant
   □ Documenter la réclamation et la résolution
```

---

## 7.6 RUN-006 : Restauration après panne serveur

**Déclencheur** : Serveur web ou base de données inaccessible

**Symptômes** :
- Application affiche "Erreur de connexion"
- Aucune donnée ne se charge
- Alertes P1 déclenchées

**Actions** :

```
1. DIAGNOSTIC (5 min)
   □ Vérifier le status de l'hébergeur (page status)
   □ Tester l'accès SSH/FTP au serveur
   □ Vérifier les logs serveur (erreurs)

2. SI PROBLÈME HÉBERGEUR
   □ Attendre la résolution (rien à faire)
   □ Surveiller la page status
   □ Activer mode offline sur les caisses

3. SI PROBLÈME APPLICATIF
   □ Redémarrer les services (PHP-FPM, MySQL)
   □ Vérifier l'espace disque
   □ Consulter les logs d'erreur

4. SI BASE DE DONNÉES CORROMPUE
   □ STOP - Ne pas tenter de réparer soi-même
   □ Contacter le support hébergeur
   □ Identifier le dernier backup valide
   □ Restaurer depuis le backup

5. APRÈS RESTAURATION
   □ Vérifier l'intégrité des données
   □ Tester les fonctions critiques (scan, vente)
   □ Resynchroniser les caisses offline
   □ Informer l'équipe du retour à la normale

6. POST-MORTEM
   □ Documenter l'incident (timeline, cause, résolution)
   □ Identifier les améliorations possibles
   □ Mettre à jour les runbooks si nécessaire
```

---

# 8. Maintenance planifiée

## 8.1 Tâches quotidiennes (automatiques)

| Tâche | Heure | Description |
|-------|-------|-------------|
| Backup base de données | 03:00 | Export MySQL + copie distante |
| Rotation des logs | 04:00 | Compression logs > 7 jours |
| Nettoyage fichiers temp | 05:00 | Suppression fichiers > 24h |
| Health check | */5 min | Vérification services actifs |

## 8.2 Tâches hebdomadaires

| Tâche | Jour | Description |
|-------|------|-------------|
| Vérification backups | Lundi | Test de restauration |
| Revue des alertes | Lundi | Analyse des incidents semaine |
| Mise à jour dépendances | Mercredi | npm audit, pip check |
| Test mode offline | Vendredi | Simulation perte réseau |

## 8.3 Tâches avant chaque bourse

| Tâche | Timing | Description |
|-------|--------|-------------|
| Mise à jour application | J-7 | Déployer dernière version stable |
| Test complet | J-5 | Parcours utilisateur complet |
| Backup pré-bourse | J-1 | Sauvegarde complète |
| Activation monitoring | J-1 | Alertes renforcées |

## 8.4 Fenêtres de maintenance

```
HORS BOURSE :
├── Maintenance possible : 24/7
├── Préavis : 24h (email gestionnaires)
└── Durée max : 4h

PÉRIODE PRÉ-BOURSE (J-14 à J-1) :
├── Maintenance possible : 22h-06h uniquement
├── Préavis : 48h
└── Durée max : 2h

PENDANT LA BOURSE :
├── Maintenance possible : NON (sauf urgence P1)
├── Toute intervention = approbation Admin
└── Documentation obligatoire
```

---

# 9. Annexes

## 9.1 Checklist équipement bourse

```
MATÉRIEL PAR CAISSE
□ 1 ordinateur/tablette avec navigateur moderne
□ 1 scanner code-barres USB ou Bluetooth
□ 1 connexion réseau (WiFi ou Ethernet)
□ 1 multiprise électrique
□ 1 feuille de caisse papier (backup)

MATÉRIEL CENTRAL
□ 1 routeur WiFi (ou point d'accès)
□ 1 imprimante pour réimpressions étiquettes
□ 1 PC gestionnaire pour dashboard
□ Câbles réseau de secours
□ Batteries/onduleur pour équipements critiques

DOCUMENTATION
□ Ce runbook imprimé
□ Contacts d'urgence
□ Identifiants de connexion (coffre)
□ Procédure mode papier
```

## 9.2 Modèle de rapport d'incident

```
═══════════════════════════════════════════════════════════════════════════
                        RAPPORT D'INCIDENT
═══════════════════════════════════════════════════════════════════════════

Date/Heure détection : ____/____/____ à ____:____
Date/Heure résolution : ____/____/____ à ____:____
Durée totale : ____ minutes

CLASSIFICATION
□ P1 - Critique    □ P2 - Majeur    □ P3 - Mineur    □ P4 - Info

DESCRIPTION DE L'INCIDENT
___________________________________________________________________________
___________________________________________________________________________

IMPACT
- Nombre de caisses affectées : ____
- Nombre de ventes impactées : ____
- Données perdues : □ Oui □ Non
- Estimation impact financier : ____ €

CAUSE RACINE
___________________________________________________________________________
___________________________________________________________________________

ACTIONS CORRECTIVES
1. ________________________________________________________________________
2. ________________________________________________________________________
3. ________________________________________________________________________

ACTIONS PRÉVENTIVES
1. ________________________________________________________________________
2. ________________________________________________________________________

RESPONSABLE DU RAPPORT : _______________________
DATE : ____/____/____

═══════════════════════════════════════════════════════════════════════════
```

## 9.3 Glossaire opérationnel

| Terme | Définition |
|-------|------------|
| **SLO** | Service Level Objective - Objectif de niveau de service |
| **P95** | 95ème percentile - 95% des requêtes sont plus rapides |
| **Runbook** | Procédure documentée pour gérer un incident |
| **IndexedDB** | Base de données locale du navigateur (mode offline) |
| **FIFO** | First In First Out - Premier entré, premier sorti |
| **Health check** | Vérification automatique de l'état d'un service |
| **Escalade** | Transfert d'un incident à un niveau supérieur |
| **Post-mortem** | Analyse après incident pour comprendre et améliorer |
