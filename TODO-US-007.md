# TODO - US-007 : Configurer les dates clés d'une édition

**Branche** : `feature/us-007-edition-configuration`
**Statut** : Terminé

## Critères d'acceptation

### AC-1 : Accès à la configuration
- [x] Formulaire accessible pour gestionnaire/administrateur
- [x] Champs pour date limite de déclaration
- [x] Champs pour dates de dépôt (début/fin)
- [x] Champs pour dates de vente (début/fin)
- [x] Champs pour dates de récupération (début/fin)
- [x] Taux de commission configurable (défaut 20%)
- [x] Note informative sur les frais Billetweb
- [ ] Dates de début/fin des inscriptions (optionnel, informatif)
- [ ] Catégories d'articles autorisées (multi-sélection)

### AC-2 : Saisie et validation des dates
- [x] Validation de l'ordre chronologique des dates
- [x] Enregistrement des dates et du taux de commission
- [x] Passage automatique du statut "Brouillon" → "Configurée"
- [x] Message de confirmation après enregistrement

### AC-2bis : Configuration des créneaux de dépôt avec capacités
- [x] Formulaire pour ajouter des créneaux de dépôt
- [x] Capacité maximum par créneau
- [x] Option "Réservé Plaisançois"
- [x] Description optionnelle par créneau
- [x] Validation chevauchement des créneaux
- [x] Suppression de créneaux

### AC-3 : Erreur - incohérence chronologique
- [x] Message d'erreur explicite pour dates incohérentes
- [x] Blocage de la soumission si dates invalides

### AC-4 : Modification de dates existantes
- [x] Modification possible pour éditions sans inscriptions
- [x] Message de confirmation après modification

### AC-5 : Protection - édition avec inscriptions actives
- [ ] Avertissement si déposants actifs (nécessite US-008)
- [ ] Confirmation explicite requise
- [ ] Notification automatique aux déposants impactés

### AC-6 : Contrôle d'accès
- [x] Accès réservé aux gestionnaires et administrateurs (via ProtectedRoute existant)
- [x] Blocage des modifications pour éditions clôturées

## Tâches techniques

### Backend
- [x] Schémas Pydantic avec champs de configuration
- [x] Endpoint PUT /editions/{id} pour mise à jour
- [x] Endpoint PATCH /editions/{id}/status pour transition de statut
- [x] Validation des dates dans le service
- [x] Modèle DepositSlot avec migration Alembic
- [x] Repository pour les créneaux de dépôt
- [x] Endpoints CRUD pour /editions/{id}/deposit-slots

### Frontend
- [x] Créer `EditionEditModal.tsx`
- [x] Formulaire avec sections : informations générales + configuration
- [x] Validation côté client de l'ordre des dates
- [x] Champ taux de commission (0-100%)
- [x] Intégration avec `EditionsPageWrapper`
- [x] Appel API updateEdition + updateEditionStatus
- [x] Affichage du statut actuel de l'édition
- [x] Désactivation du formulaire pour éditions clôturées
- [x] Composant `DepositSlotsEditor` pour gestion des créneaux
- [x] API client pour deposit-slots

### Tests
- [x] 16 tests unitaires `EditionEditModal.test.tsx`
- [x] 20 tests backend pour editions API

## Fichiers créés/modifiés

### Backend
- `backend/app/models/deposit_slot.py` (nouveau)
- `backend/app/models/__init__.py` (modifié)
- `backend/app/models/edition.py` (modifié - relation deposit_slots)
- `backend/app/schemas/deposit_slot.py` (nouveau)
- `backend/app/schemas/__init__.py` (modifié)
- `backend/app/repositories/deposit_slot.py` (nouveau)
- `backend/app/repositories/__init__.py` (modifié)
- `backend/app/api/v1/endpoints/deposit_slots.py` (nouveau)
- `backend/app/api/v1/__init__.py` (modifié)
- `backend/migrations/versions/..._add_deposit_slots_table.py` (nouveau)

### Frontend
- `frontend/src/components/editions/EditionEditModal.tsx` (nouveau)
- `frontend/src/components/editions/EditionEditModal.test.tsx` (nouveau)
- `frontend/src/components/editions/DepositSlotsEditor.tsx` (nouveau)
- `frontend/src/components/editions/index.ts` (modifié)
- `frontend/src/pages/admin/EditionsPageWrapper.tsx` (modifié)
- `frontend/src/types/deposit-slot.ts` (nouveau)
- `frontend/src/types/index.ts` (modifié)
- `frontend/src/api/deposit-slots.ts` (nouveau)
- `frontend/src/api/index.ts` (modifié)

## Fonctionnalités reportées

1. **Catégories d'articles autorisées** : Nécessite un modèle Category
2. **Notification des déposants (AC-5)** : Nécessite l'import des inscriptions (US-008)
3. **Dates inscriptions Billetweb** : Informatif seulement, peut être ajouté ultérieurement

## Résultat des tests

- Frontend : 108 tests passent
- Backend : 20 tests editions passent
