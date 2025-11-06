---
id: DOC-060-DOMAIN
title: Modèle de domaine
status: draft
version: 0.2.0
updated: 2025-11-05
owner: ALPE Plaisance du Touch
links: []
---

# Entités principales

```mermaid
classDiagram
  class Edition {
    +UUID id
    +String nom
    +Date date_debut
    +Date date_fin
    +String lieu
    +Text description
    +Enum statut
    +Date[] dates_depot
    +Date[] dates_vente
    +Date date_retour_invendus
    +Decimal taux_commission
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
  }

  class Article {
    +UUID id
    +String libelle
    +String categorie
    +String taille
    +Decimal prix_propose
    +Enum etat
    +String code_etiquette
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
  Edition "1" -- "*" Article : contient
  Edition "1" -- "*" Invitation : génère
  Edition "1" -- "*" Reversement : calcule

  Deposant "1" -- "*" Article : dépose
  Deposant "1" -- "1" User : est
  Deposant "1" -- "*" Reversement : reçoit

  Article "0..1" -- "1" Vente : vendu_via

  Vente "*" -- "1" Deposant : pour

  Invitation "1" -- "0..1" User : active
  Invitation "*" -- "1" Edition : pour
```

# Cycle de vie d'une Édition

```mermaid
stateDiagram-v2
  [*] --> Brouillon : Création (US-006)
  Brouillon --> Configurée : Configuration dates (US-007)
  Configurée --> Inscriptions_ouvertes : Import Billetweb (US-008)
  Inscriptions_ouvertes --> En_cours : Début période dépôt
  En_cours --> En_cours : Ventes actives
  En_cours --> Clôturée : Clôture admin (US-009)
  Clôturée --> Archivée : Archivage (> 1 an)
  Archivée --> [*]
```

# Règles métier

## Édition
- Une édition a un nom unique dans tout le système (porte généralement saison et année, ex: "Bourse Printemps 2025")
- Le statut évolue selon le cycle de vie (voir diagramme)
- La date de fin doit être strictement postérieure à la date de début
- Les dates de dépôt doivent être comprises dans la période [date_debut, date_fin]
- Les dates de vente doivent être comprises dans la période [date_debut, date_fin]
- La date de retour des invendus doit être postérieure ou égale à la date de fin
- L'ordre chronologique attendu : date_debut ≤ dates_depot ≤ dates_vente ≤ date_fin ≤ date_retour_invendus
- Le taux de commission est un pourcentage entre 0 et 100
- Le lieu est optionnel (peut être précisé ultérieurement)
- Une édition clôturée est en lecture seule définitive

## Utilisateurs et rôles
- **Déposant** : peut gérer ses articles pour les éditions auxquelles il est inscrit
- **Bénévole** : peut scanner et encaisser les ventes pendant une édition
- **Gestionnaire** : peut configurer les éditions et importer les inscriptions
- **Administrateur** : peut créer/clôturer des éditions et gérer les utilisateurs

## Articles
- Une étiquette (code) identifie de manière unique un article au sein d'une édition
- Un article appartient à un seul déposant et une seule édition
- États possibles : brouillon, déposé, en_vente, vendu, invendu, récupéré
- Une fois vendu, un article ne peut plus changer d'état

## Ventes
- Une vente est associée à un article unique
- Moyens de paiement : espèces, carte_bancaire, cheque
- La vente est horodatée et traçable (bénévole vendeur)

## Reversements
- Le reversement = somme des ventes du déposant − (commission × somme ventes)
- Calculé après la période de vente, avant clôture
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
- **Cohérence dates édition** : date_debut < date_fin ET date_fin ≤ date_retour_invendus
- **Cohérence dates opérationnelles** : dates_depot ⊆ [date_debut, date_fin] ET dates_vente ⊆ [date_debut, date_fin]
- **Article → Vente** : Un article ne peut avoir qu'une seule vente (0..1 relation)
- **Édition clôturée** : Aucune modification possible après clôture
- **Invitation expirée** : Un token expiré ne peut plus être utilisé

