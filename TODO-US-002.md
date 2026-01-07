# TODO US-002 — Déclarer mes articles dans mes listes

**Branch:** `feature/us-002-article-declaration`
**Version cible:** 0.5

## Contexte

Le déposant inscrit à une édition doit pouvoir créer ses listes (max 2) et y ajouter ses articles avec leurs caractéristiques pour préparer son dépôt et obtenir ses étiquettes avant la bourse.

## Critères d'acceptation (résumé)

- [ ] AC-1 : Accès à la déclaration d'articles (espace déposant avec infos édition/créneaux)
- [ ] AC-2 : Création d'une liste (max 2 par édition)
- [ ] AC-3 : Ajout d'un article avec formulaire complet
- [ ] AC-4 : Validation des contraintes par catégorie (1 manteau, 1 sac, 2 foulards, etc.)
- [ ] AC-5 : Validation prix minimum (1€) et maximum (150€ poussettes)
- [ ] AC-6 : Gestion des lots (vêtements enfant ≤36 mois, max 3 articles/lot)
- [ ] AC-7 : Tri automatique des articles par catégorie
- [ ] AC-8 : Blocage articles refusés (liste noire)
- [ ] AC-9 : Déclaration de conformité qualité (case à cocher)
- [ ] AC-10 : Limite 12 vêtements avec validation temps réel
- [ ] AC-11 : Sauvegarde et modification de liste
- [ ] AC-12 : Blocage après date limite
- [ ] AC-13 : Aide contextuelle avec prix indicatifs
- [ ] AC-14 : Récapitulatif avant validation finale + email confirmation
- [ ] AC-15 : Indicateurs visuels de progression
- [ ] AC-16 : Aperçu et téléchargement PDF des listes

---

## Backend Tasks

### 0.5.1 Schemas Pydantic pour ItemList
- [ ] `ItemListCreate` (list_type)
- [ ] `ItemListUpdate` (status)
- [ ] `ItemListResponse` (id, number, list_type, label_color, status, article_count, clothing_count, validated_at, etc.)
- [ ] `ItemListDetailResponse` (with articles)
- [ ] `ItemListValidateRequest` (confirmation_accepted)

### 0.5.2 Schemas Pydantic pour Article
- [ ] `ArticleCreate` (category, description, price, size, brand, color, is_lot, lot_quantity, conformity_certified)
- [ ] `ArticleUpdate` (all fields optional)
- [ ] `ArticleResponse` (id, line_number, category, description, price, size, brand, color, is_lot, lot_quantity, status, conformity_certified)
- [ ] `ArticleBulkCreateResponse` (created, errors)

### 0.5.3 Service ItemList
- [ ] `create_list(depositor_id, edition_id, list_type)` - max 2 par édition
- [ ] `get_depositor_lists(depositor_id, edition_id)` - listes du déposant pour une édition
- [ ] `get_list_detail(list_id)` - avec articles triés par catégorie
- [ ] `validate_list(list_id)` - passage en statut "validated", envoi email confirmation
- [ ] `assign_list_number(edition_id, list_type)` - génération du numéro de liste selon le type

### 0.5.4 Service Article
- [ ] `add_article(list_id, article_data)` - avec validation contraintes
- [ ] `update_article(article_id, article_data)` - si liste non validée
- [ ] `delete_article(article_id)` - si liste non validée
- [ ] `get_articles(list_id)` - triés par catégorie selon l'ordre défini
- [ ] Validation règles métier :
  - [ ] Max 24 articles par liste
  - [ ] Max 12 vêtements par liste
  - [ ] Prix minimum 1€
  - [ ] Prix maximum 150€ (poussettes uniquement)
  - [ ] Contraintes catégorie (1 manteau, 1 sac, 2 foulards, 1 tour de lit, 1 peluche, 5 livres adultes)
  - [ ] Liste noire (sièges-autos, CD/DVD, casques, etc.)
  - [ ] Lots : taille ≤36 mois, max 3 articles/lot
- [ ] `reorder_articles(list_id)` - renumérotation automatique après ajout/suppression

### 0.5.5 Repository ItemList
- [ ] `get_by_id(list_id)`
- [ ] `get_by_depositor_and_edition(depositor_id, edition_id)`
- [ ] `count_by_depositor_and_edition(depositor_id, edition_id)`
- [ ] `create(list_data)`
- [ ] `update(list_id, list_data)`
- [ ] `get_next_list_number(edition_id, list_type)`

### 0.5.6 Repository Article
- [ ] `get_by_id(article_id)`
- [ ] `get_by_list_id(list_id)` - triés par catégorie/ligne
- [ ] `create(article_data)`
- [ ] `update(article_id, article_data)`
- [ ] `delete(article_id)`
- [ ] `count_by_category(list_id, category)`

### 0.5.7 API Endpoints

#### ItemList endpoints
- [ ] `GET /api/v1/depositor/editions/{edition_id}/lists` - mes listes pour cette édition
- [ ] `POST /api/v1/depositor/editions/{edition_id}/lists` - créer une liste
- [ ] `GET /api/v1/depositor/lists/{list_id}` - détail avec articles
- [ ] `DELETE /api/v1/depositor/lists/{list_id}` - supprimer (si brouillon)
- [ ] `POST /api/v1/depositor/lists/{list_id}/validate` - valider la liste
- [ ] `GET /api/v1/depositor/lists/{list_id}/preview` - aperçu pour PDF

#### Article endpoints
- [ ] `POST /api/v1/depositor/lists/{list_id}/articles` - ajouter un article
- [ ] `PUT /api/v1/depositor/lists/{list_id}/articles/{article_id}` - modifier
- [ ] `DELETE /api/v1/depositor/lists/{list_id}/articles/{article_id}` - supprimer
- [ ] `GET /api/v1/depositor/lists/{list_id}/articles` - liste des articles

#### Endpoints annexes
- [ ] `GET /api/v1/depositor/editions/{edition_id}/summary` - infos déposant pour l'édition (créneaux, listes)
- [ ] `GET /api/v1/config/categories` - catégories, contraintes, liste noire
- [ ] `GET /api/v1/config/price-hints` - grille prix indicatifs

### 0.5.8 Tests Backend
- [ ] Tests unitaires service ItemList
- [ ] Tests unitaires service Article (validation contraintes)
- [ ] Tests intégration endpoints listes
- [ ] Tests intégration endpoints articles
- [ ] Tests validation : max 2 listes, max 24 articles, max 12 vêtements
- [ ] Tests validation : contraintes catégorie
- [ ] Tests validation : liste noire
- [ ] Tests validation : prix min/max
- [ ] Tests validation : lots

---

## Frontend Tasks

### 0.5.9 Types TypeScript
- [ ] `ItemList`, `ItemListCreate`, `ItemListResponse`, `ItemListStatus`
- [ ] `Article`, `ArticleCreate`, `ArticleUpdate`, `ArticleResponse`, `ArticleStatus`
- [ ] `ArticleCategory`, `CategoryConstraints`, `BlacklistedCategories`
- [ ] `PriceHints`, `DepositorEditionSummary`

### 0.5.10 API Client
- [ ] `itemListsApi.getMyLists(editionId)`
- [ ] `itemListsApi.createList(editionId, data)`
- [ ] `itemListsApi.getListDetail(listId)`
- [ ] `itemListsApi.deleteList(listId)`
- [ ] `itemListsApi.validateList(listId)`
- [ ] `itemListsApi.getListPreview(listId)`
- [ ] `articlesApi.addArticle(listId, data)`
- [ ] `articlesApi.updateArticle(listId, articleId, data)`
- [ ] `articlesApi.deleteArticle(listId, articleId)`
- [ ] `configApi.getCategories()`
- [ ] `configApi.getPriceHints()`

### 0.5.11 Page MyListsPage (`/lists`)
- [ ] Récupération éditions actives où je suis inscrit
- [ ] Affichage infos édition (nom, dates, créneau réservé)
- [ ] Section "Mes listes" avec compteur (X / 2)
- [ ] Bouton "Créer ma première liste" si aucune
- [ ] Liste des listes existantes avec :
  - Numéro, type, statut
  - Nombre d'articles (X / 24, Y vêtements / 12)
  - Actions : Voir, Supprimer (si brouillon)
- [ ] Rappel visible règlement (2 listes max, 24 articles, 12 vêtements)
- [ ] Indicateur date limite déclaration
- [ ] Mode lecture seule si date limite dépassée

### 0.5.12 Page ListDetailPage (`/lists/:id`)
- [ ] Affichage numéro et type de liste
- [ ] Compteurs en temps réel :
  - Articles : X / 24
  - Vêtements : Y / 12
  - Barre de progression visuelle
- [ ] Tableau des articles triés par catégorie :
  - Colonnes : N° | Catégorie | Genre | Taille | Description | Prix | Actions
  - Groupement par catégorie avec headers visuels
- [ ] Bouton "Nouvel article" (ouvre modal)
- [ ] Actions par article : Modifier, Supprimer
- [ ] Bouton "Valider ma liste" en bas
- [ ] Indicateurs validation contraintes (✓/✗)
- [ ] Message si date limite dépassée (lecture seule)

### 0.5.13 Composant ArticleFormModal
- [ ] Champs :
  - Catégorie (select avec groupes)
  - Genre (si vêtement) : Fille/Garçon/Mixte/Adulte Homme/Adulte Femme/Mixte Adulte
  - Taille (select dynamique selon catégorie)
  - Marque (texte libre)
  - Description (textarea)
  - Prix (input number, validation min 1€)
  - Est un lot (toggle)
  - Si lot : quantité (1-3), marque obligatoire
- [ ] Case certification conformité obligatoire
- [ ] Validation temps réel :
  - Griser "Ajouter" si 12 vêtements atteints et catégorie vêtement
  - Message erreur explicite
  - Prix indicatifs contextuels
- [ ] Blocage catégories liste noire (modal explicative)
- [ ] Modes : création / modification

### 0.5.14 Composant CategorySelect
- [ ] Liste des catégories avec icônes
- [ ] Indication contraintes (ex: "Vêtements (8/12)")
- [ ] Désactivation catégories si limite atteinte (manteau, sac, etc.)
- [ ] Tooltip avec règlement

### 0.5.15 Composant ListValidationModal
- [ ] Récapitulatif :
  - Nombre total articles
  - Nombre vêtements
  - Répartition par catégorie
- [ ] Rappel consignes dépôt
- [ ] Case finale acceptation conditions
- [ ] Boutons : Annuler / Valider définitivement

### 0.5.16 Composant ListPreviewModal
- [ ] Aperçu visuel type "bon de commande"
- [ ] Tableau complet des articles
- [ ] Total montant
- [ ] Boutons : Fermer / Télécharger PDF / Imprimer

### 0.5.17 Composant ProgressIndicators
- [ ] Barre progression articles (X/24)
- [ ] Barre progression vêtements (Y/12)
- [ ] Liste contraintes avec ✓/✗ :
  - Max 2 listes
  - Prix minimum respecté
  - Contraintes catégorie

### 0.5.18 Routes et navigation
- [ ] Route `/lists` - MyListsPage (ProtectedRoute depositor)
- [ ] Route `/lists/:id` - ListDetailPage (ProtectedRoute depositor + owner check)
- [ ] Navigation depuis Header (lien "Mes listes")

### 0.5.19 Tests Frontend
- [ ] Tests MyListsPage (affichage listes, création)
- [ ] Tests ListDetailPage (tableau articles, compteurs)
- [ ] Tests ArticleFormModal (validation, contraintes)
- [ ] Tests CategorySelect (limites, liste noire)
- [ ] Tests ListValidationModal
- [ ] Tests ProgressIndicators

---

## Règles métier à implémenter

### Catégories et ordre de tri
1. Vêtements (max 12)
2. Chaussures
3. Puériculture
4. Jeux et jouets
5. Livres
6. Accessoires
7. Autres

### Contraintes par catégorie
- Manteau/Blouson : 1 max par liste
- Sac à main : 1 max par liste
- Foulards : 2 max par liste
- Tour de lit : 1 max par liste
- Peluche : 1 max par liste
- Livres adultes : 5 max par liste

### Liste noire (articles refusés)
- Sièges-autos / rehausseurs
- Biberons, pots, vaisselle bébé
- CD/DVD/Vinyles
- Casques (vélo, ski, équitation)
- Consoles de jeu, jeux PC/Mac
- Meubles, luminaires, décoration
- Literie (matelas, oreillers)
- Livres jaunis/abîmés, encyclopédies
- Vêtements adultes > 14 ans (pyjamas, chemises de nuit, peignoirs)
- Sous-vêtements adultes / enfants > 2 ans
- Chaussettes (sauf ski), collants, chaussons enfants
- Costumes hommes, cravates, kimono

### Lots
- Autorisés : vêtements enfant (bodys/pyjamas)
- Taille : ≤36 mois
- Quantité : max 3 articles par lot
- Un lot = 1 article dans le compteur

### Prix
- Minimum : 1€ pour tout article
- Maximum : 150€ pour poussettes/landaus uniquement

---

## Fichiers à créer

### Backend
- [ ] `backend/app/schemas/item_list.py`
- [ ] `backend/app/schemas/article.py`
- [ ] `backend/app/services/item_list_service.py`
- [ ] `backend/app/services/article_service.py`
- [ ] `backend/app/repositories/item_list_repository.py`
- [ ] `backend/app/repositories/article_repository.py`
- [ ] `backend/app/api/v1/endpoints/depositor_lists.py`
- [ ] `backend/app/api/v1/endpoints/depositor_articles.py`
- [ ] `backend/tests/test_item_list_service.py`
- [ ] `backend/tests/test_article_service.py`
- [ ] `backend/tests/test_depositor_lists_api.py`
- [ ] `backend/tests/test_depositor_articles_api.py`

### Frontend
- [ ] `frontend/src/types/item-list.ts`
- [ ] `frontend/src/types/article.ts`
- [ ] `frontend/src/api/item-lists.ts`
- [ ] `frontend/src/api/articles.ts`
- [ ] `frontend/src/pages/depositor/MyListsPage.tsx`
- [ ] `frontend/src/pages/depositor/ListDetailPage.tsx`
- [ ] `frontend/src/components/lists/ArticleFormModal.tsx`
- [ ] `frontend/src/components/lists/CategorySelect.tsx`
- [ ] `frontend/src/components/lists/ListValidationModal.tsx`
- [ ] `frontend/src/components/lists/ListPreviewModal.tsx`
- [ ] `frontend/src/components/lists/ProgressIndicators.tsx`
- [ ] `frontend/src/components/lists/ArticleTable.tsx`

### Fichiers à modifier
- [ ] `backend/app/api/v1/__init__.py` - ajouter routes
- [ ] `frontend/src/routes.tsx` - ajouter routes /lists
- [ ] `frontend/src/api/index.ts` - exports
- [ ] `frontend/src/types/index.ts` - exports
- [ ] `frontend/src/components/layout/Header.tsx` - lien "Mes listes"

---

## Notes techniques

### Modèles existants
Les modèles `ItemList` et `Article` existent déjà dans `backend/app/models/`:
- `ItemList` : number, list_type, label_color, status, is_validated, depositor_id, edition_id
- `Article` : description, category, size, brand, color, price, line_number, is_lot, lot_quantity, status, conformity_certified, barcode, item_list_id

### Migrations
- Vérifier si une migration est nécessaire pour ajouter des champs (genre pour vêtements)
- Possibilité d'ajouter un champ `gender` sur Article

### Email confirmation
- Template email récapitulatif liste validée à créer
- Inclure : numéro liste, nombre articles, rappel créneau dépôt

---

## Ordre d'implémentation suggéré

1. **Backend schemas** (0.5.1, 0.5.2)
2. **Backend repositories** (0.5.5, 0.5.6)
3. **Backend services** avec validations (0.5.3, 0.5.4)
4. **Backend API endpoints** (0.5.7)
5. **Backend tests** (0.5.8)
6. **Frontend types et API** (0.5.9, 0.5.10)
7. **Frontend composants** (0.5.13-0.5.17)
8. **Frontend pages** (0.5.11, 0.5.12)
9. **Frontend routing** (0.5.18)
10. **Frontend tests** (0.5.19)
