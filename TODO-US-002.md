# TODO US-002 — Déclarer mes articles dans mes listes

**Branch:** `feature/us-002-article-declaration`
**Version cible:** 0.5

## Contexte

Le déposant inscrit à une édition doit pouvoir créer ses listes (max 2) et y ajouter ses articles avec leurs caractéristiques pour préparer son dépôt et obtenir ses étiquettes avant la bourse.

## Critères d'acceptation (résumé)

- [x] AC-1 : Accès à la déclaration d'articles (espace déposant avec infos édition/créneaux)
- [x] AC-2 : Création d'une liste (max 2 par édition)
- [x] AC-3 : Ajout d'un article avec formulaire complet
- [x] AC-4 : Validation des contraintes par catégorie (1 manteau, 1 sac, 2 foulards, etc.)
- [x] AC-5 : Validation prix minimum (1€) et maximum (150€ poussettes)
- [x] AC-6 : Gestion des lots (vêtements enfant ≤36 mois, max 3 articles/lot)
- [x] AC-7 : Tri automatique des articles par catégorie
- [x] AC-8 : Blocage articles refusés (liste noire)
- [x] AC-9 : Déclaration de conformité qualité (case à cocher)
- [x] AC-10 : Limite 12 vêtements avec validation temps réel
- [x] AC-11 : Sauvegarde et modification de liste
- [x] AC-12 : Blocage après date limite
- [ ] AC-13 : Aide contextuelle avec prix indicatifs (FIX-007)
- [x] AC-14 : Récapitulatif avant validation finale (email confirmation non implémenté)
- [x] AC-15 : Indicateurs visuels de progression
- [ ] AC-16 : Aperçu et téléchargement PDF des listes

---

## Backend Tasks

### 0.5.1 Schemas Pydantic pour ItemList
- [x] `ItemListCreate` (list_type)
- [x] `ItemListUpdate` (status)
- [x] `ItemListResponse` (id, number, list_type, label_color, status, article_count, clothing_count, validated_at, etc.)
- [x] `ItemListDetailResponse` (with articles)
- [x] `ItemListValidateRequest` (confirmation_accepted)

### 0.5.2 Schemas Pydantic pour Article
- [x] `ArticleCreate` (category, description, price, size, brand, color, is_lot, lot_quantity, conformity_certified)
- [x] `ArticleUpdate` (all fields optional)
- [x] `ArticleResponse` (id, line_number, category, description, price, size, brand, color, is_lot, lot_quantity, status, conformity_certified)
- [ ] `ArticleBulkCreateResponse` (created, errors)

### 0.5.3 Service ItemList
- [x] `create_list(depositor_id, edition_id, list_type)` - max 2 par édition
- [x] `get_depositor_lists(depositor_id, edition_id)` - listes du déposant pour une édition
- [x] `get_list_detail(list_id)` - avec articles triés par catégorie
- [x] `validate_list(list_id)` - passage en statut "validated" (email confirmation non implémenté)
- [x] `assign_list_number(edition_id, list_type)` - génération du numéro de liste selon le type

### 0.5.4 Service Article
- [x] `add_article(list_id, article_data)` - avec validation contraintes
- [x] `update_article(article_id, article_data)` - si liste non validée
- [x] `delete_article(article_id)` - si liste non validée
- [x] `get_articles(list_id)` - triés par catégorie selon l'ordre défini
- [x] Validation règles métier :
  - [x] Max 24 articles par liste
  - [x] Max 12 vêtements par liste
  - [x] Prix minimum 1€
  - [x] Prix maximum 150€ (poussettes uniquement)
  - [x] Contraintes catégorie (1 manteau, 1 sac, 2 foulards, 1 tour de lit, 1 peluche, 5 livres adultes)
  - [x] Liste noire (sièges-autos, CD/DVD, casques, etc.)
  - [x] Lots : taille ≤36 mois, max 3 articles/lot, bodys/pyjamas uniquement
- [x] `reorder_articles(list_id)` - renumérotation automatique après ajout/suppression

### 0.5.5 Repository ItemList
- [x] `get_by_id(list_id)`
- [x] `get_by_depositor_and_edition(depositor_id, edition_id)`
- [x] `count_by_depositor_and_edition(depositor_id, edition_id)`
- [x] `create(list_data)`
- [x] `update(list_id, list_data)`
- [x] `get_next_list_number(edition_id, list_type)`

### 0.5.6 Repository Article
- [x] `get_by_id(article_id)`
- [x] `get_by_list_id(list_id)` - triés par catégorie/ligne
- [x] `create(article_data)`
- [x] `update(article_id, article_data)`
- [x] `delete(article_id)`
- [x] `count_by_category(list_id, category)`

### 0.5.7 API Endpoints

#### ItemList endpoints
- [x] `GET /api/v1/depositor/editions/{edition_id}/lists` - mes listes pour cette édition
- [x] `POST /api/v1/depositor/editions/{edition_id}/lists` - créer une liste
- [x] `GET /api/v1/depositor/lists/{list_id}` - détail avec articles
- [x] `DELETE /api/v1/depositor/lists/{list_id}` - supprimer (si brouillon)
- [x] `POST /api/v1/depositor/lists/{list_id}/validate` - valider la liste
- [ ] `GET /api/v1/depositor/lists/{list_id}/preview` - aperçu pour PDF

#### Article endpoints
- [x] `POST /api/v1/depositor/lists/{list_id}/articles` - ajouter un article
- [x] `PUT /api/v1/depositor/lists/{list_id}/articles/{article_id}` - modifier
- [x] `DELETE /api/v1/depositor/lists/{list_id}/articles/{article_id}` - supprimer
- [x] `GET /api/v1/depositor/lists/{list_id}/articles` - liste des articles

#### Endpoints annexes
- [x] `GET /api/v1/depositor/editions/{edition_id}/summary` - infos déposant pour l'édition (créneaux, listes)
- [x] `GET /api/v1/config/categories` - catégories, contraintes, liste noire
- [x] `GET /api/v1/config/price-hints` - grille prix indicatifs

### 0.5.8 Tests Backend
- [x] Tests unitaires service ItemList
- [x] Tests unitaires service Article (validation contraintes)
- [x] Tests intégration endpoints listes (18 tests)
- [x] Tests intégration endpoints articles (19 tests)
- [x] Tests validation : max 2 listes, max 24 articles, max 12 vêtements
- [x] Tests validation : contraintes catégorie
- [x] Tests validation : liste noire
- [x] Tests validation : prix min/max
- [x] Tests validation : lots

---

## Frontend Tasks

### 0.5.9 Types TypeScript
- [x] `ItemList`, `ItemListCreate`, `ItemListResponse`, `ItemListStatus`
- [x] `Article`, `ArticleCreate`, `ArticleUpdate`, `ArticleResponse`, `ArticleStatus`
- [x] `ArticleCategory`, `CategoryConstraints`, `BlacklistedCategories`
- [ ] `PriceHints`, `DepositorEditionSummary`

### 0.5.10 API Client
- [x] `itemListsApi.getMyLists(editionId)`
- [x] `itemListsApi.createList(editionId, data)`
- [x] `itemListsApi.getListDetail(listId)`
- [x] `itemListsApi.deleteList(listId)`
- [x] `itemListsApi.validateList(listId)`
- [ ] `itemListsApi.getListPreview(listId)`
- [x] `articlesApi.addArticle(listId, data)`
- [x] `articlesApi.updateArticle(listId, articleId, data)`
- [x] `articlesApi.deleteArticle(listId, articleId)`
- [x] `configApi.getCategories()`
- [ ] `configApi.getPriceHints()` - endpoint existe mais non utilisé dans le frontend

### 0.5.11 Page MyListsPage (`/lists`)
- [x] Récupération éditions actives où je suis inscrit
- [x] Affichage infos édition (nom, dates, créneau réservé)
- [x] Section "Mes listes" avec compteur (X / 2)
- [x] Bouton "Créer ma première liste" si aucune
- [x] Liste des listes existantes avec :
  - Numéro, type, statut
  - Nombre d'articles (X / 24, Y vêtements / 12)
  - Actions : Voir, Supprimer (si brouillon)
- [x] Rappel visible règlement (2 listes max, 24 articles, 12 vêtements)
- [x] Indicateur date limite déclaration
- [x] Mode lecture seule si date limite dépassée

### 0.5.12 Page ListDetailPage (`/lists/:id`)
- [x] Affichage numéro et type de liste
- [x] Compteurs en temps réel :
  - Articles : X / 24
  - Vêtements : Y / 12
  - Barre de progression visuelle
- [x] Tableau des articles triés par catégorie :
  - Colonnes : N° | Catégorie | Détails | Description | Prix | Certifié | Actions
  - Groupement par catégorie
- [x] Bouton "Nouvel article" (ouvre formulaire)
- [x] Actions par article : Modifier, Dupliquer, Supprimer (icônes)
- [x] Bouton "Valider ma liste" en bas
- [x] Indicateurs validation contraintes (✓/✗)
- [x] Message si date limite dépassée (lecture seule)

### 0.5.13 Composant ArticleForm
- [x] Champs :
  - Catégorie (select avec groupes)
  - Sous-catégorie (select dynamique selon catégorie)
  - Genre (si vêtement) : Fille/Garçon/Mixte/Adulte Homme/Adulte Femme/Mixte Adulte
  - Taille (select dynamique selon catégorie)
  - Marque (texte libre) - affiché seulement pour vêtements/chaussures
  - Couleur (texte libre) - affiché seulement pour vêtements/chaussures
  - Description (textarea, max 100 caractères)
  - Prix (input number, validation min 1€)
  - Est un lot (toggle) - affiché seulement pour bodys/pyjamas
  - Si lot : quantité (1-3)
- [x] Case certification conformité obligatoire
- [x] Validation temps réel :
  - Griser "Ajouter" si 12 vêtements atteints et catégorie vêtement
  - Message erreur explicite
  - [ ] Prix indicatifs contextuels (FIX-007)
- [x] Blocage catégories liste noire (erreur backend)
- [x] Modes : création / modification / duplication

### 0.5.14 Composant CategorySelect
- [x] Liste des catégories
- [x] Indication contraintes (ex: "Vêtements (8/12)")
- [x] Désactivation catégories si limite atteinte (manteau, sac, etc.)
- [ ] Tooltip avec règlement

### 0.5.15 Composant ListValidationModal
- [x] Récapitulatif :
  - Nombre total articles
  - Nombre vêtements
  - Total montant
- [x] Rappel consignes dépôt
- [x] Case finale acceptation conditions
- [x] Boutons : Annuler / Valider définitivement

### 0.5.16 Composant ListPreviewModal
- [ ] Aperçu visuel type "bon de commande"
- [ ] Tableau complet des articles
- [ ] Total montant
- [ ] Boutons : Fermer / Télécharger PDF / Imprimer

### 0.5.17 Composant ProgressIndicators
- [x] Compteurs articles (X/24) et vêtements (Y/12) - dans ListDetailPage
- [ ] Barres de progression visuelles
- [ ] Liste contraintes avec ✓/✗

### 0.5.18 Routes et navigation
- [x] Route `/lists` - MyListsPage (ProtectedRoute depositor)
- [x] Route `/lists/:id` - ListDetailPage (ProtectedRoute depositor + owner check)
- [x] Navigation depuis Header (lien "Mes listes")

### 0.5.19 Tests Frontend
- [ ] Tests MyListsPage (affichage listes, création)
- [ ] Tests ListDetailPage (tableau articles, compteurs)
- [ ] Tests ArticleForm (validation, contraintes)
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

---

## Corrections à apporter (écarts spec/implémentation)

### HAUTE PRIORITÉ - ✅ COMPLÉTÉ

#### FIX-001 : Validation des lots incorrecte ✅
- **Spec** : Les lots ne sont autorisés que pour les "bodys" ou "pyjamas" (taille ≤36 mois)
- **Corrigé** : Validation backend et frontend implémentée
- [x] Backend : lot uniquement si subcategory in ['body', 'pajama'] et size ≤36 mois
- [x] Frontend : option lot masquée si conditions non remplies

#### FIX-002 : Prix maximum incorrect ✅
- **Spec** : Pas de limite générale de prix (sauf poussettes 150€ max)
- **Corrigé** : Limite de 100€ supprimée
- [x] Backend : limite de 100€ par défaut retirée
- [x] Frontend : limite max du champ prix retirée (sauf poussettes)

#### FIX-003 : Longueur description incorrecte ✅
- **Spec** : 100 caractères max (doit tenir sur les étiquettes)
- **Corrigé** : Limite à 100 caractères
- [x] Migration DB pour réduire la taille de la colonne description
- [x] Schemas backend mis à jour
- [x] Frontend mis à jour

#### FIX-004 : Fonctionnalité "Dupliquer" manquante ✅
- **Spec** : Bouton pour copier les champs d'un article similaire
- **Corrigé** : Bouton dupliquer avec icône ajouté
- [x] Bouton "Dupliquer" (icône) dans les actions de chaque article
- [x] Formulaire pré-rempli avec les données de l'article (incluant sous-catégorie)

### PRIORITÉ MOYENNE - ✅ COMPLÉTÉ

#### FIX-005 : Lignes 1-12 non réservées aux vêtements ✅
- **Spec** : Les lignes 1-12 sont réservées aux vêtements sur la liste
- **Corrigé** : Logique de réordonnement mise à jour
- [x] Vêtements en lignes 1-12, autres catégories à partir de 13
- [x] Validation si >12 vêtements (impossible normalement)

#### FIX-006 : Pas de modal d'avertissement pour articles interdits
- **Spec** : Afficher proactivement la liste des articles interdits avant soumission
- **Actuel** : Erreur seulement après soumission si article en liste noire
- **Fichiers** :
  - `frontend/src/components/articles/ArticleForm.tsx` : ajouter section info liste noire
- [ ] Ajouter une section d'information avec la liste des articles interdits
- [ ] Ou un lien/bouton "Voir les articles interdits" ouvrant un modal

### PRIORITÉ BASSE (UX)

#### FIX-007 : Indices de prix non affichés
- **Spec** : Afficher des prix indicatifs pour guider le déposant
- **Actuel** : Le backend a l'endpoint, mais le frontend ne l'utilise pas
- **Fichiers** :
  - `frontend/src/components/articles/ArticleForm.tsx`
- [ ] Appeler l'API des prix indicatifs
- [ ] Afficher une aide contextuelle selon la catégorie sélectionnée

#### FIX-008 : Liens d'aide/FAQ manquants
- **Spec** : Aide contextuelle accessible
- **Actuel** : Pas de liens vers FAQ ou règlement
- [ ] Ajouter liens vers règlement/FAQ dans le formulaire
