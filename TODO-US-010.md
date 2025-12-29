# US-010 - Interface de gestion des invitations

**Branche:** `feature/us-010-invitation-management`
**User Story:** Émettre des invitations manuellement en masse

## Contexte

Le backend est déjà implémenté (v0.2). Cette tâche concerne uniquement le **frontend** pour permettre aux gestionnaires et administrateurs de gérer les invitations depuis l'interface web.

### API Backend disponible

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/v1/invitations` | GET | Liste des invitations (filtrable: pending/expired) |
| `/api/v1/invitations` | POST | Créer une invitation unique |
| `/api/v1/invitations/bulk` | POST | Créer des invitations en masse |
| `/api/v1/invitations/{id}/resend` | POST | Relancer une invitation |

## Tâches

### 1. API Client
- [x] **1.1** Créer les types TypeScript pour les invitations
- [x] **1.2** Créer les fonctions API dans `frontend/src/api/invitations.ts`
  - [x] `getInvitations(status?: 'pending' | 'expired')`
  - [x] `createInvitation(data)`
  - [x] `createBulkInvitations(data[])`
  - [x] `resendInvitation(id)`

### 2. Page de gestion des invitations
- [x] **2.1** Créer `InvitationsPage` (`/admin/invitations`)
  - [x] Tableau avec colonnes: Email, Nom, Prénom, Statut, Date création, Expiration, Actions
  - [x] Filtres par statut (Tous, En attente, Expirés)
  - [x] Statistiques en haut (Total, En attente, Activés, Expirés)
  - [x] Bouton "Nouvelle invitation"
  - [x] Bouton "Invitations en masse"

### 3. Modal création invitation unique
- [x] **3.1** Créer `InvitationCreateModal`
  - [x] Champs: Email, Prénom, Nom, Type de liste (standard/1000/2000)
  - [x] Validation email
  - [x] Gestion erreur doublon
  - [x] Message succès avec feedback

### 4. Modal import CSV en masse
- [x] **4.1** Créer `BulkInvitationModal`
  - [x] Zone de drop/upload fichier CSV
  - [x] Aperçu des données avant import
  - [x] Rapport de validation (erreurs, doublons)
  - [x] Barre de progression pendant l'import
  - [x] Résumé final (créés, ignorés, erreurs)

### 5. Actions sur invitations
- [x] **5.1** Bouton "Relancer" pour invitations en attente/expirées
- [x] **5.2** Confirmation avant relance
- [x] **5.3** Feedback visuel après action

### 6. Routes et navigation
- [x] **6.1** Ajouter route `/admin/invitations`
- [x] **6.2** Protéger avec ProtectedRoute (roles: manager, administrator)
- [x] **6.3** Ajouter lien dans le menu admin/header

### 7. Tests
- [x] **7.1** Tests unitaires InvitationsPage
- [x] **7.2** Tests unitaires InvitationCreateModal
- [x] **7.3** Tests unitaires BulkInvitationModal

### 8. Documentation
- [x] **8.1** Mettre à jour DEVELOPMENT.md avec tâches US-010 frontend

## Critères d'acceptation (depuis US-010)

- [x] AC-1: Interface liste invitations accessible aux gestionnaires/admins
- [x] AC-2: Création invitation unique avec envoi email
- [x] AC-3: Gestion doublon (erreur ou relance)
- [x] AC-4: Import CSV avec validation
- [x] AC-5: Envoi en masse après validation
- [x] AC-8: Relance invitation non activée

## Notes techniques

- Utiliser React Query pour la gestion du cache et des mutations
- Composants UI avec TailwindCSS (cohérent avec le reste de l'app)
- Gestion des erreurs avec toast/alert
- Format CSV attendu: `email,prenom,nom,type_liste`
