# TODO - US-007 : Configurer les dates clés d'une édition

**Branche** : `feature/us-007-edition-configuration`
**Statut** : En cours

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
- [ ] Formulaire pour ajouter des créneaux de dépôt
- [ ] Capacité maximum par créneau
- [ ] Option "Réservé Plaisançois"
- [ ] Description optionnelle par créneau

### AC-3 : Erreur - incohérence chronologique
- [x] Message d'erreur explicite pour dates incohérentes
- [x] Blocage de la soumission si dates invalides

### AC-4 : Modification de dates existantes
- [x] Modification possible pour éditions sans inscriptions
- [x] Message de confirmation après modification

### AC-5 : Protection - édition avec inscriptions actives
- [ ] Avertissement si déposants actifs
- [ ] Confirmation explicite requise
- [ ] Notification automatique aux déposants impactés

### AC-6 : Contrôle d'accès
- [x] Accès réservé aux gestionnaires et administrateurs (via ProtectedRoute existant)
- [x] Blocage des modifications pour éditions clôturées

## Tâches techniques

### Backend (existant de US-006)
- [x] Schémas Pydantic avec champs de configuration
- [x] Endpoint PUT /editions/{id} pour mise à jour
- [x] Endpoint PATCH /editions/{id}/status pour transition de statut
- [x] Validation des dates dans le service

### Frontend
- [x] Créer `EditionEditModal.tsx`
- [x] Formulaire avec sections : informations générales + configuration
- [x] Validation côté client de l'ordre des dates
- [x] Champ taux de commission (0-100%)
- [x] Intégration avec `EditionsPageWrapper`
- [x] Appel API updateEdition + updateEditionStatus
- [x] Affichage du statut actuel de l'édition
- [x] Désactivation du formulaire pour éditions clôturées

### Tests
- [x] 16 tests unitaires `EditionEditModal.test.tsx`
  - [x] Affichage du modal avec données
  - [x] Non-affichage si fermé ou edition null
  - [x] Valeur par défaut du taux de commission (20%)
  - [x] Validation taux de commission requis
  - [x] Validation ordre chronologique des dates
  - [x] Soumission avec données valides
  - [x] Transition brouillon → configurée
  - [x] Avertissement éditions clôturées
  - [x] Erreur conflit de nom
  - [x] Boutons annuler/fermer

## Fichiers modifiés/créés

- `frontend/src/components/editions/EditionEditModal.tsx` (nouveau)
- `frontend/src/components/editions/EditionEditModal.test.tsx` (nouveau)
- `frontend/src/components/editions/index.ts` (modifié)
- `frontend/src/pages/admin/EditionsPageWrapper.tsx` (modifié)

## Fonctionnalités reportées (hors scope v0.3)

Les éléments suivants sont mentionnés dans la spécification mais reportés :

1. **Créneaux de dépôt avec capacités (AC-2bis)** : Nécessite un modèle de données supplémentaire pour les créneaux
2. **Catégories d'articles autorisées** : Nécessite un modèle Category
3. **Notification des déposants (AC-5)** : Nécessite l'import des inscriptions (US-008)
4. **Dates inscriptions Billetweb** : Informatif seulement, peut être ajouté ultérieurement

## Résultat des tests

- Frontend : 108 tests passent (dont 16 nouveaux pour EditionEditModal)
- Backend : 82 tests passent (2 échecs préexistants non liés à cette US)
