# US-010 - Interface de gestion des invitations

**Branche:** `feature/us-010-invitation-management`
**User Story:** Émettre des invitations manuellement en masse

## Contexte

Le backend est déjà implémenté (v0.2). Cette tâche concerne uniquement le **frontend** pour permettre aux gestionnaires et administrateurs de gérer les invitations depuis l'interface web.

### API Backend disponible

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/v1/invitations` | GET | Liste des invitations (filtrable: pending/expired/activated/all) |
| `/api/v1/invitations` | POST | Créer une invitation unique |
| `/api/v1/invitations/bulk` | POST | Créer des invitations en masse |
| `/api/v1/invitations/{id}/resend` | POST | Relancer une invitation |
| `/api/v1/invitations/{id}` | DELETE | Supprimer une invitation |
| `/api/v1/invitations/bulk-delete` | POST | Supprimer plusieurs invitations |

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

---

## Phase 2 - Améliorations (À implémenter)

### 9. Affichage des invitations acceptées
- [x] **9.1** Backend: Modifier `GET /api/v1/invitations` pour supporter le filtre `activated`
- [x] **9.2** Frontend: Ajouter le filtre "Activées" dans le select de statut
- [x] **9.3** Frontend: Afficher la date d'activation dans une nouvelle colonne (si applicable)
- [x] **9.4** Frontend: Mettre à jour les statistiques pour inclure le compte des activées

### 10. Suppression d'invitations individuelles
- [x] **10.1** Backend: Créer endpoint `DELETE /api/v1/invitations/{id}`
  - Supprimer l'invitation (peu importe son statut)
  - Retourner 204 No Content en cas de succès
  - Retourner 404 si l'invitation n'existe pas
- [x] **10.2** Frontend: Ajouter bouton "Supprimer" sur chaque ligne du tableau
- [x] **10.3** Frontend: Modal de confirmation avant suppression
- [x] **10.4** Frontend: Feedback visuel après suppression (toast/notification)
- [x] **10.5** Frontend: Ajouter fonction `deleteInvitation(id)` dans l'API client

### 11. Sélection multiple et suppression en masse
- [x] **11.1** Backend: Créer endpoint `POST /api/v1/invitations/bulk-delete`
  - Body: `{ "ids": ["id1", "id2", ...] }`
  - Retourner le nombre d'invitations supprimées
- [x] **11.2** Frontend: Ajouter checkbox sur chaque ligne du tableau
- [x] **11.3** Frontend: Ajouter checkbox "Sélectionner tout" dans l'en-tête
- [x] **11.4** Frontend: Afficher le nombre d'éléments sélectionnés
- [x] **11.5** Frontend: Bouton "Supprimer la sélection" (visible si sélection > 0)
- [x] **11.6** Frontend: Modal de confirmation avec récapitulatif
- [x] **11.7** Frontend: Ajouter fonction `bulkDeleteInvitations(ids)` dans l'API client

### 12. Tests Phase 2
- [x] **12.1** Tests backend pour les endpoints de suppression
- [x] **12.2** Tests frontend pour la sélection multiple
- [x] **12.3** Tests frontend pour la suppression

## Nouveaux critères d'acceptation (Phase 2)

- [x] AC-9: Visualisation des invitations acceptées avec date d'activation
- [x] AC-10: Suppression d'une invitation individuelle avec confirmation
- [x] AC-11: Sélection multiple d'invitations
- [x] AC-12: Suppression en masse des invitations sélectionnées

## Notes techniques

- Utiliser React Query pour la gestion du cache et des mutations
- Composants UI avec TailwindCSS (cohérent avec le reste de l'app)
- Gestion des erreurs avec toast/alert
- Format CSV attendu: `email,prenom,nom,type_liste`
- Pour la sélection multiple: utiliser un état local `Set<string>` pour stocker les IDs sélectionnés
- Soft delete vs hard delete: à définir (pour l'instant, hard delete)
