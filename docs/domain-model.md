---
id: DOC-060-DOMAIN
title: Modèle de domaine
status: validated
version: 1.0.0
updated: 2025-12-28
owner: ALPE Plaisance du Touch
links:
  - rel: source
    href: Reglement_deposant.md
    title: Règlement déposant
  - rel: source
    href: Reglement_interne.md
    title: Règlement intérieur
  - rel: api
    href: api/openapi.yaml
    title: Spécification API
---

# Entités principales

```mermaid
classDiagram
  class Edition {
    +UUID id
    +String nom
    +DateTime datetime_debut
    +DateTime datetime_fin
    +String lieu?
    +Text description?
    +Enum statut
    +Date[] dates_depot?
    +Date[] dates_vente?
    +Date date_retour_invendus?
    +Date date_limite_declaration?
    +Decimal taux_commission?
    +Timestamp created_at
    +User created_by
    +Timestamp updated_at
    +User updated_by
  }

  class User {
    +UUID id
    +String email
    +String nom
    +String prenom
    +String telephone
    +Enum role
    +Timestamp created_at
  }

  class Deposant {
    +UUID id
    +User user
    +String iban
    +String adresse
    +String creneau_depot?
  }

  class Creneau {
    +UUID id
    +Date date
    +Time heure_debut
    +Time heure_fin
    +Integer capacite_max
    +Integer places_reservees
    +Boolean reserve_plaisancois
    +String description?
  }

  class Liste {
    +UUID id
    +Integer numero
    +Enum type
    +Enum statut
    +String couleur_etiquette
    +Integer nombre_articles
    +Integer nombre_vetements
    +Decimal frais
    +Timestamp created_at
    +Timestamp validated_at?
  }

  class Article {
    +UUID id
    +Integer numero_ligne
    +String categorie
    +String genre?
    +String taille?
    +String description
    +Decimal prix_propose
    +Boolean is_lot
    +Integer lot_quantity?
    +String lot_marque?
    +Enum etat
    +String code_etiquette?
    +Boolean conformite_certifiee
    +Timestamp created_at
  }

  class Vente {
    +UUID id
    +Decimal prix_vente
    +Enum moyen_paiement
    +Timestamp date_heure
    +User vendeur
  }

  class Reversement {
    +UUID id
    +Decimal montant_ventes
    +Decimal montant_commission
    +Decimal montant_net
    +Enum statut
    +Date date_calcul
    +Date date_paiement
  }

  class Invitation {
    +UUID id
    +String email
    +String token
    +Enum statut
    +Timestamp created_at
    +Timestamp expires_at
    +Timestamp used_at
  }

  %% Relations
  Edition "1" -- "*" Liste : contient
  Edition "1" -- "*" Invitation : génère
  Edition "1" -- "*" Reversement : calcule
  Edition "1" -- "*" Creneau : définit

  Deposant "1" -- "*" Liste : crée (max 2/4 selon type)
  Deposant "1" -- "1" User : est
  Deposant "1" -- "*" Reversement : reçoit
  Deposant "*" -- "0..1" Creneau : réserve

  Liste "1" -- "*" Article : contient (max 24)
  Liste "*" -- "1" Edition : pour

  Article "0..1" -- "1" Vente : vendu_via

  Vente "*" -- "1" Deposant : pour

  Invitation "1" -- "0..1" User : active
  Invitation "*" -- "1" Edition : pour
```

# Cycle de vie d'une Édition

```mermaid
stateDiagram-v2
  [*] --> Brouillon : Création (US-006)
  Brouillon --> Inscriptions_ouvertes : Import Billetweb (US-008)
  Inscriptions_ouvertes --> Dépôt : Début période de dépôt
  Dépôt --> Vente : Début des ventes
  Vente --> Bilan : Fin des ventes
  Bilan --> Clôturée : Validation du bilan (US-009)
  Clôturée --> Archivée : Archivage (> 1 an)
  Archivée --> [*]
```

### Description des statuts

| Statut | Technique | Description |
|--------|-----------|-------------|
| **Brouillon** | `draft` | Préparation de l'édition : nom, dates, lieu, commission, créneaux de dépôt. L'ancien statut "Configurée" est supprimé — la configuration se fait dans le brouillon. |
| **Inscriptions ouvertes** | `registrations_open` | Les déposants s'inscrivent via Billetweb et peuvent déclarer leurs listes d'articles dans l'application. |
| **Dépôt** | `deposit` | Les déposants viennent physiquement déposer leurs articles. Les bénévoles vérifient et acceptent ou refusent les articles. |
| **Vente** | `sale` | La bourse est ouverte au public. Les articles sont en vente. |
| **Bilan** | `settlement` | Fin des ventes. Les bénévoles font l'inventaire des invendus et préparent le bilan des reversements pour la trésorière. |
| **Clôturée** | `closed` | L'édition est terminée. Passage en lecture seule. L'édition reste visible dans la liste des éditions. |
| **Archivée** | `archived` | L'édition est en lecture seule et disparaît de la liste principale. Elle reste accessible dans la liste des archives. |

# Règles métier

## Édition
- Une édition a un nom unique dans tout le système (porte généralement saison et année, ex: "Bourse Printemps 2025")
- Le statut évolue selon le cycle de vie (voir diagramme)
- **Lors de la création (US-006)** : seuls nom, datetime_debut, datetime_fin sont obligatoires. La configuration (dates opérationnelles, commission, créneaux de dépôt) se fait dans le même statut brouillon.
- La date/heure de fin doit être strictement postérieure à la date/heure de début
- Les dates de dépôt doivent être comprises dans la période temporelle de l'édition
- Les dates de vente doivent être comprises dans la période temporelle de l'édition
- La date de retour des invendus doit être postérieure à la date/heure de fin
- Le taux de commission est un pourcentage entre 0 et 100
- Le lieu et la description sont optionnels
- Une édition clôturée ou archivée est en lecture seule définitive

## Utilisateurs et rôles
- **Déposant** : peut gérer ses articles pour les éditions auxquelles il est inscrit
- **Bénévole** : peut scanner et encaisser les ventes pendant une édition
- **Gestionnaire** : peut configurer les éditions et importer les inscriptions
- **Administrateur** : peut créer/clôturer des éditions et gérer les utilisateurs

## Créneaux de dépôt
- Un créneau est défini par une date, une plage horaire (heure début - heure fin) et une capacité maximum
- Chaque créneau peut être réservé aux habitants de Plaisance-du-Touch (mercredi 20h-22h, vendredi 9h30-12h)
- Exemples de capacités standard (REQ-F-014) :
  - Mercredi 9h30-11h30 : 20 déposants
  - Mercredi 14h-18h : 40 déposants
  - Mercredi 20h-22h : 20 déposants (réservé Plaisançois)
  - Jeudi 9h30-12h : 15 déposants
  - Jeudi 17h-21h : 32 déposants
  - Vendredi 9h30-12h : 15 déposants (réservé Plaisançois)
- Créneaux spéciaux pour listes 1000/2000 : mardi jusqu'à 23h, mercredi 12h-14h et 18h-20h, jeudi 21h-22h
- Les inscriptions sont bloquées une fois la capacité atteinte
- Un déposant ne peut réserver qu'un seul créneau par semaine de collecte (REQ-F-013)

## Listes
- **Types de listes** (REQ-F-015) :
  - **Standard** : maximum 2 listes par déposant par édition, frais 5€ pour 2 listes (Billetweb), couleurs 100-600 selon numéro
  - **Liste 1000** (étiquettes blanches) : réservée aux adhérents ALPE participant min 8h, numéro fixe définitif, limite 2 listes (1ère bourse) puis 4, frais 1€/liste déduit des ventes
  - **Liste 2000** (étiquettes groseille) : pour famille/amis d'adhérents ne participant pas, numérotation liée aux 1000, max 4 listes pour 2 personnes, frais 5€ pour 2 listes déduit des ventes
- Chaque liste est numérotée et rattachée à un déposant et une édition
- Une liste contient maximum 24 articles dont 12 vêtements maximum (REQ-F-002)
- Statuts possibles : brouillon, validee
- Les vêtements occupent les premières lignes (max 12), suivis des autres catégories, numérotation séquentielle sans trous
- Une liste ne peut plus être modifiée après la date limite de déclaration (REQ-F-011 : 3 semaines avant collecte)
- Une liste validée génère un récapitulatif PDF envoyé au déposant par email
- **Couleurs d'étiquettes par numéro** :
  - 100 : Bleu ciel
  - 200 : Jaune soleil
  - 300 : Fushia
  - 400 : Lilas
  - 500 : Vert menthe
  - 600 : Clémentine
  - 1000 : Blanc
  - 2000 : Groseille
- **Horaires de restitution différenciés** (REQ-F-016) :
  - Listes standard : lundi 18h30-19h30 après la vente
  - Listes 1000/2000 : dimanche 17h-18h (jour de la vente)

## Articles
- Un article appartient à une liste unique (rattaché à un déposant et une édition via la liste)
- Chaque article occupe une ligne numérotée (1-24) dans sa liste
- Une étiquette (code) identifie de manière unique un article au sein d'une édition (générée lors du dépôt physique)
- Prix minimum : 1€ pour tout article (REQ-F-002)
- Prix maximum : 150€ uniquement pour poussettes/landaus (REQ-F-002)
- Contraintes par catégorie (REQ-F-002) :
  - Vêtements : 12 maximum par liste, toujours placés en premier dans la numérotation
  - Manteau/Blouson : 1 maximum par liste
  - Sac à main : 1 maximum par liste
  - Foulards : 2 maximum par liste
  - Tour de lit : 1 maximum par liste
  - Peluche : 1 maximum par liste
  - Livres adultes : 5 maximum par liste
- Lots autorisés : vêtements enfant (bodys/pyjamas) jusqu'à 36 mois, maximum 3 articles par lot, taille et marque identiques
- Un lot compte comme 1 article dans la limite des 24
- Articles de la liste noire bloqués automatiquement (sièges-autos, CD/DVD, casques, etc.)
- Certification de conformité obligatoire (case à cocher par le déposant)
- États possibles : brouillon, déposé, refusé, en_vente, vendu, invendu, récupéré
- Un article peut être **refusé** lors du dépôt physique par un bénévole/gestionnaire/administrateur si l'article est taché, abîmé, incomplet ou non conforme. Le motif de refus est optionnel. L'article refusé reste en mémoire mais est exclu des compteurs de la liste (articles en vente, valeur totale, etc.)
- Une fois vendu, un article ne peut plus changer d'état

## Ventes
- Une vente est associée à un article unique
- Moyens de paiement : espèces, carte_bancaire, cheque
- La vente est horodatée et traçable (bénévole vendeur)

## Reversements
- Le reversement = somme des ventes du déposant − (20% × somme ventes) − frais selon type de liste
- **Tarification ALPE** (selon règlement) :
  - **Listes standard** : Frais d'inscription 5€ pour 2 listes (payé via Billetweb en amont, non remboursable) + Commission ALPE 20% des ventes
  - **Listes 1000** : 1€ par liste déduit du montant des ventes + Commission ALPE 20% des ventes
  - **Listes 2000** : 5€ pour 2 listes déduit du montant des ventes + Commission ALPE 20% des ventes
  - Note : Pour listes standard, les frais Billetweb sont gérés hors application. Pour listes 1000/2000, les frais sont déduits automatiquement du reversement
- Calculé après la période de vente, avant clôture
- Versement par chèque sous quinzaine (enveloppe timbrée fournie par le déposant)
- Statuts : en_attente, calculé, payé, annulé
- Un reversement est lié à un déposant pour une édition donnée

## Invitations
- Une invitation a un token unique et une durée de validité de 7 jours
- Statuts : envoyée, utilisée, expirée
- Un token ne peut être utilisé qu'une seule fois
- Les invitations sont générées lors de l'import Billetweb (US-008)

# Invariants

- **Unicité email** : Un email ne peut être associé qu'à un seul utilisateur
- **Unicité étiquette/édition** : Un code étiquette est unique au sein d'une édition
- **Unicité nom édition** : Le nom d'une édition est unique globalement
- **Cohérence dates/heures édition** : datetime_debut < datetime_fin
- **Cohérence dates opérationnelles** : dates_depot et dates_vente comprises dans la période temporelle de l'édition
- **Cohérence date retour invendus** : date_retour_invendus doit être postérieure à la partie date de datetime_fin
- **Cohérence date limite déclaration** : date_limite_declaration doit être antérieure à la première date de dépôt (recommandé : 3 semaines avant)
- **Maximum listes selon type** :
  - Listes standard : 2 maximum par déposant par édition
  - Listes 1000 : 2 pour première bourse, puis 4 pour adhérent régulier
  - Listes 2000 : 4 maximum pour 2 personnes
- **Un seul dépôt par semaine** : Un déposant ne peut effectuer qu'un seul dépôt physique par semaine de collecte (REQ-F-013)
- **Capacité créneau** : Le nombre de réservations pour un créneau ne peut dépasser sa capacité maximum
- **Créneau Plaisançois** : Les créneaux réservés Plaisançois ne peuvent être réservés que par des habitants de Plaisance-du-Touch
- **Maximum 24 articles par liste** : Une liste ne peut contenir plus de 24 articles
- **Maximum 12 vêtements par liste** : Une liste ne peut contenir plus de 12 articles de catégorie "Vêtements"
- **Vêtements en premier** : Les articles vêtements sont toujours numérotés avant les autres catégories (numérotation séquentielle sans trous)
- **Prix article ≥ 1€** : Le prix proposé d'un article doit être au minimum 1€
- **Prix poussette ≤ 150€** : Le prix d'une poussette/landau ne peut dépasser 150€
- **Contraintes catégorie respectées** : Les contraintes par catégorie (1 manteau, 2 foulards, etc.) doivent être respectées par liste
- **Article → Vente** : Un article ne peut avoir qu'une seule vente (0..1 relation)
- **Édition clôturée** : Aucune modification possible après clôture
- **Liste après date limite** : Aucune modification de liste possible après date_limite_declaration
- **Invitation expirée** : Un token expiré ne peut plus être utilisé
- **Numérotation 1000/2000** : Les numéros 2000 correspondent aux numéros 1000 (ex: 1100 → 2100)

---

# Diagrammes séquence

## Parcours dépôt d'articles (Déposant)

Ce diagramme illustre le parcours complet d'un déposant depuis l'activation de son compte jusqu'à la validation de sa liste.

```mermaid
sequenceDiagram
    autonumber
    participant D as Déposant (Marie)
    participant UI as Frontend PWA
    participant API as Backend API
    participant DB as Base de données
    participant Email as Service Email

    Note over D,Email: Phase 1 - Activation du compte

    D->>UI: Clique lien invitation (email)
    UI->>API: GET /auth/activate?token=xxx
    API->>DB: Vérifie token (validité, expiration)
    DB-->>API: Token valide, invitation trouvée

    D->>UI: Remplit formulaire (mot de passe, CGU)
    UI->>API: POST /auth/activate {password, accept_cgu}
    API->>DB: Crée compte User + Deposant
    API->>DB: Marque invitation "utilisée"
    API->>Email: Envoie confirmation activation
    API-->>UI: {access_token, refresh_token}
    UI-->>D: Redirection vers dashboard

    Note over D,Email: Phase 2 - Création de liste

    D->>UI: Clique "Nouvelle liste"
    UI->>API: POST /listes {edition_id}
    API->>DB: Vérifie quota listes (max 2 standard)
    API->>DB: Crée Liste (statut: brouillon)
    DB-->>API: Liste créée (id, numéro attribué)
    API-->>UI: {liste_id, numero, couleur_etiquette}
    UI-->>D: Affiche éditeur de liste

    Note over D,Email: Phase 3 - Ajout d'articles

    loop Pour chaque article (max 24)
        D->>UI: Remplit formulaire article
        UI->>UI: Validation locale (prix, catégorie)
        UI->>API: POST /listes/{id}/articles
        API->>DB: Vérifie contraintes métier
        Note right of API: Max 12 vêtements<br/>Lignes 1-12 = vêtements<br/>Prix 1€-150€<br/>Catégories limitées
        alt Contraintes OK
            API->>DB: Crée Article (etat: brouillon)
            API-->>UI: {article_id, numero_ligne}
            UI-->>D: Article ajouté ✓
        else Contrainte violée
            API-->>UI: 422 {error: "limite_vetements"}
            UI-->>D: Message d'erreur explicite
        end
    end

    Note over D,Email: Phase 4 - Validation de la liste

    D->>UI: Clique "Valider ma liste"
    UI->>API: POST /listes/{id}/validate
    API->>DB: Vérifie date limite non dépassée
    API->>DB: Vérifie au moins 1 article
    API->>DB: Met à jour statut → "validée"
    API->>DB: Met à jour articles → "déposé"
    API->>Email: Génère et envoie récapitulatif PDF
    API-->>UI: {statut: "validée", pdf_url}
    UI-->>D: Confirmation + lien PDF

    Note over D,Email: Phase 5 - Suivi des ventes (pendant bourse)

    D->>UI: Consulte "Mes ventes"
    UI->>API: GET /deposants/me/ventes?edition_id=xxx
    API->>DB: Agrège ventes par article
    DB-->>API: Liste ventes + totaux
    API-->>UI: {ventes[], total_brut, commission, net}
    UI-->>D: Affiche tableau de bord ventes
```

## Parcours vente en caisse (Bénévole)

Ce diagramme illustre le processus de vente d'un article en caisse, incluant le mode offline.

```mermaid
sequenceDiagram
    autonumber
    participant B as Bénévole (Jean)
    participant Scan as Scanner/Douchette
    participant UI as PWA Caisse
    participant IDB as IndexedDB (local)
    participant API as Backend API
    participant DB as Base de données

    Note over B,DB: Scénario A - Mode Online

    B->>Scan: Scanne QR code étiquette
    Scan-->>UI: Code article: "E2025-L142-A07"
    UI->>API: GET /articles/by-code/{code}
    API->>DB: Recherche article + statut
    DB-->>API: Article trouvé

    alt Article disponible
        API-->>UI: {article, prix, deposant, statut: "en_vente"}
        UI-->>B: Affiche détails article
        Note right of UI: Description<br/>Prix: 8,00€<br/>Déposant: #142

        B->>UI: Confirme la vente
        UI->>API: POST /ventes {article_id, caisse_id}
        API->>DB: Vérifie article non vendu (double-check)
        API->>DB: Crée Vente + MAJ article → "vendu"
        API-->>UI: {vente_id, horodatage}
        UI-->>B: ✓ Vente enregistrée - 8,00€
        UI->>UI: Ajoute au panier caisse

    else Article déjà vendu
        API-->>UI: 409 {error: "article_deja_vendu"}
        UI-->>B: ⚠️ Article déjà vendu !
        Note right of UI: Vendu le 15/03 à 14:32<br/>Caisse C2
    end

    Note over B,DB: Scénario B - Mode Offline (perte réseau)

    UI->>UI: Détecte perte réseau (timeout)
    UI-->>B: 🟠 MODE OFFLINE activé

    B->>Scan: Scanne QR code étiquette
    Scan-->>UI: Code article: "E2025-L089-A15"
    UI->>IDB: Recherche article (cache local)
    IDB-->>UI: Article trouvé (pré-chargé)
    UI-->>B: Affiche détails article

    B->>UI: Confirme la vente
    UI->>IDB: Stocke vente locale
    Note right of IDB: {article_id, timestamp,<br/>caisse_id, signature_hmac}
    UI->>UI: Incrémente compteur "en attente"
    UI-->>B: ✓ Vente enregistrée localement
    UI-->>B: 📤 1 vente en attente de sync

    Note over B,DB: Scénario C - Resynchronisation

    UI->>UI: Détecte retour réseau
    UI-->>B: 🟢 Réseau rétabli - Sync en cours...

    UI->>IDB: Récupère ventes en attente
    IDB-->>UI: [{vente1}, {vente2}, ...]

    loop Pour chaque vente locale
        UI->>API: POST /ventes/sync {vente, signature}
        API->>API: Vérifie signature HMAC
        API->>DB: Vérifie article non vendu
        alt Sync OK
            API->>DB: Crée Vente
            API-->>UI: {sync: "ok", vente_id}
        else Conflit détecté
            API-->>UI: {sync: "conflict", raison}
            UI-->>B: ⚠️ Conflit: Article déjà vendu
        end
    end

    UI->>IDB: Purge ventes synchronisées
    UI-->>B: ✓ Synchronisation terminée
```

## Parcours import Billetweb (Gestionnaire)

Ce diagramme illustre le processus d'import des inscriptions depuis Billetweb.

```mermaid
sequenceDiagram
    autonumber
    participant G as Gestionnaire (Sophie)
    participant UI as Frontend
    participant API as Backend API
    participant DB as Base de données
    participant Job as Job Async
    participant Email as Service Email

    Note over G,Email: Phase 1 - Upload du fichier

    G->>UI: Sélectionne fichier CSV Billetweb
    UI->>UI: Validation format (UTF-8, colonnes)
    UI->>API: POST /editions/{id}/import/preview
    Note right of UI: Multipart: fichier CSV

    API->>API: Parse CSV (500 lignes max)
    API->>DB: Recherche emails existants
    DB-->>API: Emails trouvés en base

    API-->>UI: Prévisualisation import
    Note right of API: {<br/>  total: 150,<br/>  nouveaux: 120,<br/>  existants: 27,<br/>  doublons_fichier: 3,<br/>  erreurs: [{ligne, raison}]<br/>}

    UI-->>G: Affiche rapport prévisualisation
    Note right of UI: 150 inscriptions<br/>✓ 120 nouvelles invitations<br/>✓ 27 comptes existants<br/>⚠️ 3 doublons ignorés

    Note over G,Email: Phase 2 - Confirmation et traitement

    G->>UI: Confirme l'import
    UI->>API: POST /editions/{id}/import/execute

    API->>DB: Crée job async (statut: pending)
    API-->>UI: {job_id, status: "processing"}
    UI-->>G: Import en cours... (barre progression)

    API->>Job: Démarre traitement async

    loop Pour chaque inscription valide
        Job->>DB: Vérifie email existant
        alt Email existant
            Job->>DB: Associe user à édition
            Job->>DB: Crée Liste pour déposant
        else Nouveau déposant
            Job->>DB: Crée Invitation (token 7j)
            Job->>Email: Envoie email invitation
        end
        Job->>DB: MAJ progression job
    end

    Job->>DB: Finalise job (statut: completed)

    Note over G,Email: Phase 3 - Résultat final

    UI->>API: GET /jobs/{job_id} (polling)
    API->>DB: Récupère statut job
    API-->>UI: {status: "completed", results}

    UI-->>G: Import terminé !
    Note right of UI: ✓ 120 invitations envoyées<br/>✓ 27 comptes associés<br/>✓ 147 listes créées
```

## Parcours calcul reversements (Fin d'édition)

Ce diagramme illustre le processus de calcul des reversements après la bourse.

```mermaid
sequenceDiagram
    autonumber
    participant G as Gestionnaire (Sophie)
    participant UI as Frontend
    participant API as Backend API
    participant DB as Base de données
    participant Job as Job Async
    participant PDF as Service PDF

    Note over G,PDF: Phase 1 - Lancement du calcul

    G->>UI: Accède aux reversements édition
    UI->>API: GET /editions/{id}/reversements/status
    API->>DB: Compte ventes, déposants
    API-->>UI: {pret_calcul: true, nb_deposants: 150}
    UI-->>G: 150 déposants avec ventes

    G->>UI: Lance le calcul
    UI->>API: POST /editions/{id}/reversements/calculate
    API->>DB: Vérifie édition non clôturée
    API->>DB: Crée job calcul (pending)
    API-->>UI: {job_id, status: "processing"}

    API->>Job: Démarre calcul async

    Note over G,PDF: Phase 2 - Calcul par déposant

    loop Pour chaque déposant
        Job->>DB: Récupère ventes du déposant
        DB-->>Job: Liste ventes [{article, prix}, ...]

        Job->>Job: Calcul montants
        Note right of Job: montant_brut = Σ prix_vente<br/>commission = brut × 0.20<br/>frais = selon type liste<br/>net = brut - commission - frais

        Job->>DB: Crée/MAJ Reversement
        Note right of DB: {deposant_id,<br/>montant_brut,<br/>commission,<br/>frais_liste,<br/>montant_net,<br/>statut: "calculé"}

        Job->>DB: MAJ progression
    end

    Job->>DB: Finalise job
    Job-->>API: Calcul terminé

    Note over G,PDF: Phase 3 - Génération bordereaux

    UI->>API: GET /jobs/{job_id}
    API-->>UI: {status: "completed"}
    UI-->>G: Calcul terminé !

    G->>UI: Génère tous les bordereaux
    UI->>API: POST /reversements/bordereaux/generate-all

    API->>Job: Job génération PDF

    loop Pour chaque reversement
        Job->>DB: Récupère détails reversement
        Job->>PDF: Génère bordereau PDF
        Note right of PDF: Bordereau de reversement<br/>─────────────────<br/>Déposant: Marie Dupont<br/>Liste: #142<br/>─────────────────<br/>Articles vendus: 12<br/>Total brut: 85,00€<br/>Commission (20%): 17,00€<br/>Montant net: 68,00€
        PDF-->>Job: PDF généré
        Job->>DB: Stocke URL PDF
    end

    Job-->>API: Génération terminée
    API-->>UI: {pdf_archive_url}
    UI-->>G: Bordereaux prêts ✓

    Note over G,PDF: Phase 4 - Validation et paiement

    G->>UI: Consulte reversement individuel
    UI->>API: GET /reversements/{id}
    API-->>UI: Détail complet
    UI-->>G: Affiche bordereau + détails

    G->>UI: Marque comme payé
    UI->>API: PATCH /reversements/{id} {statut: "payé"}
    API->>DB: MAJ statut
    API-->>UI: OK
    UI-->>G: ✓ Reversement payé
```

## Parcours génération étiquettes (Gestionnaire)

```mermaid
sequenceDiagram
    autonumber
    participant G as Gestionnaire
    participant UI as Frontend
    participant API as Backend API
    participant DB as Base de données
    participant Job as Job Async
    participant PDF as Service PDF
    participant QR as Générateur QR

    Note over G,QR: Génération en masse des étiquettes

    G->>UI: Sélectionne listes validées
    UI->>API: GET /listes?edition_id=xxx&statut=validee
    API->>DB: Récupère listes validées
    API-->>UI: {listes: [...], total: 150}
    UI-->>G: 150 listes, 2847 articles

    G->>UI: Lance génération
    UI->>API: POST /etiquettes/generate {liste_ids: [...]}
    API->>DB: Crée job génération
    API-->>UI: {job_id}

    API->>Job: Démarre génération async

    loop Pour chaque liste
        Job->>DB: Récupère articles de la liste
        loop Pour chaque article
            Job->>QR: Génère QR code unique
            Note right of QR: Code: E2025-L142-A07<br/>Contient: edition_id,<br/>liste_numero, article_ligne
            QR-->>Job: Image QR
            Job->>Job: Prépare données étiquette
        end
    end

    Job->>PDF: Génère PDF A4 (12 étiquettes/page)
    Note right of PDF: Format étiquette:<br/>┌──────────────┐<br/>│ [QR] #142-07 │<br/>│ Pantalon bleu│<br/>│ T8 - 8,00€   │<br/>│ ══════ BLEU  │<br/>└──────────────┘

    PDF-->>Job: PDF généré (150 pages)
    Job->>DB: Stocke PDF + stats
    Job->>DB: MAJ job completed

    UI->>API: GET /jobs/{job_id}
    API-->>UI: {status: "completed", pdf_url, stats}
    UI-->>G: Génération terminée !
    Note right of UI: 2847 étiquettes<br/>150 pages PDF<br/>Durée: 45s

    G->>UI: Télécharge PDF
    UI->>API: GET /etiquettes/download/{job_id}
    API-->>UI: Fichier PDF
    UI-->>G: Téléchargement...
```

---

# Cycle de vie des entités

## Cycle de vie d'un Article

```mermaid
stateDiagram-v2
    [*] --> Brouillon : Création par déposant

    Brouillon --> Brouillon : Modification (prix, description)
    Brouillon --> Supprimé : Suppression par déposant
    Brouillon --> Déposé : Validation liste

    Déposé --> Déposé : Édition par bénévole (revue)
    Déposé --> Accepté : Acceptation lors de la revue
    Déposé --> Refusé : Refus lors de la revue

    Accepté --> En_vente : Début période vente

    En_vente --> Vendu : Scan + vente caisse
    En_vente --> Invendu : Fin période vente (non vendu)

    Vendu --> [*] : État final

    Invendu --> Récupéré : Retrait par déposant
    Invendu --> Stock_ALPE : Non récupéré (don)

    Refusé --> [*] : État final
    Récupéré --> [*] : État final
    Stock_ALPE --> [*] : État final
    Supprimé --> [*] : État final

    note right of Brouillon
        Modifiable tant que
        date_limite non atteinte
    end note

    note right of Déposé
        Bénévole peut éditer
        les infos de l'article
    end note

    note right of Accepté
        Article conforme
        Prêt pour la vente
    end note

    note right of Refusé
        Exclu des compteurs
        Motif optionnel
        Irréversible
    end note

    note right of Vendu
        Immutable
        Horodaté + traçé
    end note

    note right of Stock_ALPE
        Invendus non récupérés
        après délai (3 semaines)
    end note
```

### Transitions détaillées

| État initial | Événement | État final | Conditions | Actions |
|--------------|-----------|------------|------------|---------|
| — | Création article | Brouillon | Liste en brouillon, contraintes OK | Assigne numéro ligne |
| Brouillon | Modification | Brouillon | Date limite non atteinte | MAJ champs |
| Brouillon | Suppression | Supprimé | Date limite non atteinte | Soft delete |
| Brouillon | Validation liste | Déposé | Liste validée | Génère code étiquette |
| Déposé | Édition (revue) | Déposé | Rôle bénévole/gestionnaire/admin, édition en statut Dépôt | MAJ champs article, trace utilisateur |
| Déposé | Acceptation (revue) | Accepté | Rôle bénévole/gestionnaire/admin, édition en statut Dépôt | Horodate, trace utilisateur |
| Déposé | Refus (revue) | Refusé | Rôle bénévole/gestionnaire/admin, édition en statut Dépôt | Enregistre motif (opt.), exclut des compteurs |
| Accepté | Début vente | En_vente | Édition passe au statut Vente | — |
| En_vente | Vente | Vendu | Article non vendu | Crée Vente, horodate |
| En_vente | Fin vente | Invendu | Période vente terminée | — |
| Invendu | Récupération | Récupéré | Déposant présent | Trace récupération |
| Invendu | Délai dépassé | Stock_ALPE | +3 semaines sans récup | Don automatique |

## Cycle de vie d'une Liste

```mermaid
stateDiagram-v2
    [*] --> Brouillon : Création

    Brouillon --> Brouillon : Ajout/Modif articles
    Brouillon --> Validée : Validation déposant
    Brouillon --> Supprimée : Suppression (0 articles)

    Validée --> Validée : Lecture seule
    Validée --> Déposée : Check-in dépôt physique

    Déposée --> Revue_terminée : Finalisation revue (tous articles traités)

    Revue_terminée --> Clôturée : Fin édition

    Clôturée --> [*] : État final
    Supprimée --> [*] : État final

    note right of Validée
        Génère récapitulatif PDF
        Email au déposant
    end note

    note right of Déposée
        Articles physiquement
        déposés et étiquetés
        Revue en cours
    end note

    note right of Revue_terminée
        Tous les articles
        acceptés ou refusés
    end note
```

## Cycle de vie d'une Invitation

```mermaid
stateDiagram-v2
    [*] --> Créée : Génération token

    Créée --> Envoyée : Email envoyé
    Envoyée --> Envoyée : Relance (max 3)
    Envoyée --> Utilisée : Activation compte
    Envoyée --> Expirée : Délai 7 jours

    Utilisée --> [*] : État final
    Expirée --> Renouvelée : Nouvelle invitation
    Renouvelée --> Envoyée : Email envoyé

    note right of Envoyée
        Token valide 7 jours
        Max 3 relances
    end note

    note right of Utilisée
        Token invalidé
        Compte créé
    end note
```

---

# Matrice des transitions d'état

## Article : Actions autorisées par état

| Action | Brouillon | Déposé | Accepté | En_vente | Vendu | Invendu | Récupéré | Refusé |
|--------|-----------|--------|---------|----------|-------|---------|----------|--------|
| Modifier (déposant) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Supprimer (déposant) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Valider (via liste) | ✅ | — | — | — | — | — | — | — |
| Éditer (revue bénévole) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Accepter (revue) | ❌ | ✅ | — | — | — | — | — | — |
| Refuser (revue) | ❌ | ✅ | — | — | — | — | — | — |
| Vendre | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Annuler vente | ❌ | ❌ | ❌ | ❌ | ✅* | ❌ | ❌ | ❌ |
| Récupérer | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | — | ❌ |

*Annulation vente : uniquement par Gestionnaire/Admin

## Liste : Actions autorisées par état

| Action | Brouillon | Validée | Déposée | Revue terminée | Clôturée |
|--------|-----------|---------|---------|----------------|----------|
| Ajouter article | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modifier article (déposant) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Supprimer article | ✅ | ❌ | ❌ | ❌ | ❌ |
| Valider | ✅ | — | — | — | — |
| Revue articles (bénévole) | ❌ | ❌ | ✅ | ❌ | ❌ |
| Finaliser revue | ❌ | ❌ | ✅* | — | — |
| Invalider | ❌ | ✅** | ❌ | ❌ | ❌ |
| Check-in dépôt | ❌ | ✅ | — | — | — |
| Consulter | ✅ | ✅ | ✅ | ✅ | ✅ |

*Finaliser revue : uniquement quand tous les articles sont traités (acceptés ou refusés)
**Invalidation : uniquement par Gestionnaire (cas exceptionnel)

