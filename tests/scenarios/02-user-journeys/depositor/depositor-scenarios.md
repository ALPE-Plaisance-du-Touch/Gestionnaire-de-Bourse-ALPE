# Scenarios Deposant (D-01 a D-EC08)

**Pre-requis pour tous** : connecte en tant que deposant (`deposant@example.com` / `Deposant123!`).
Utiliser la procedure `LOGIN` de `tests/helpers/mcp-actions.md`.

**Donnees** : `tests/data/users/accounts.json` → `deposant_standard`

---

## D-01 : Consulter la page d'accueil (edition active)

**Pre-requis** : une edition avec status `in_progress` existe en BDD.

```
1. # Se connecter (procedure LOGIN avec deposant@example.com)
2. navigate_page(url="http://localhost:5173/")
3. take_snapshot()
4. ASSERT: page = details de l'edition en cours (nom, dates, lieu)
5. ASSERT: lien "Mes listes" visible
6. ASSERT: lien "Mon profil" visible
7. ASSERT: PAS de liens admin/gestionnaire visibles
```

## D-01b : Consulter la page d'accueil (pas d'edition active)

**Pre-requis** : aucune edition `in_progress` en BDD.

```
1. # Se connecter (procedure LOGIN)
2. navigate_page(url="http://localhost:5173/")
3. take_snapshot()
4. ASSERT: message "Aucune bourse n'est en cours actuellement."
5. ASSERT: lien "Mes listes" visible
```

## D-02 : Consulter mes editions

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/lists")
3. take_snapshot()
4. ASSERT: tableau/liste des editions affiche
5. ASSERT: editions avec inscription active visibles
```

## D-03 : Creer une nouvelle liste

**Pre-requis** : edition active avec deposant inscrit.

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/lists")
3. take_snapshot()
4. Trouver uid du bouton "Nouvelle liste" ou lien vers l'edition
5. click(uid=new_list_button)
6. take_snapshot()
7. ASSERT: liste creee, redirection vers le detail de la liste
8. evaluate_script(() => location.pathname)
9. ASSERT: pathname contient "/lists/"
```

## D-04 : Ajouter un article a la liste

**Donnees** : `tests/data/valid/articles.json` → `toy_item`

```
1. # Se connecter + naviguer vers une liste existante
2. take_snapshot()
3. Trouver le formulaire d'ajout d'article
4. fill(uid=category_select, value="toys")
5. fill(uid=description_field, value="Puzzle 50 pieces animaux de la ferme")
6. fill(uid=brand_field, value="Ravensburger")
7. fill(uid=price_field, value="3.00")
8. click(uid=conformity_checkbox)  # certifier conformite
9. click(uid=add_article_button)
10. take_snapshot()
11. ASSERT: article ajoute dans la liste
12. ASSERT: compteur d'articles incremente
```

## D-05 : Ajouter un article vetement

**Donnees** : `tests/data/valid/articles.json` → `clothing_item`

```
1. # Sur la page d'une liste
2. fill(uid=category_select, value="clothing")
3. take_snapshot()
4. ASSERT: champs taille/marque/genre deviennent visibles
5. fill(uid=description_field, value="Pull bleu marine rayures - 4 ans")
6. fill(uid=size_field, value="4 ans")
7. fill(uid=brand_field, value="Petit Bateau")
8. fill(uid=gender_select, value="mixed")
9. fill(uid=price_field, value="5.00")
10. click(uid=conformity_checkbox)
11. click(uid=add_article_button)
12. take_snapshot()
13. ASSERT: article vetement ajoute
14. ASSERT: compteur vetements incremente
```

## D-06 : Ajouter un lot

**Donnees** : `tests/data/valid/articles.json` → `lot_bodys`

```
1. # Sur la page d'une liste
2. fill(uid=category_select, value="clothing")
3. click(uid=is_lot_checkbox)  # cocher "C'est un lot"
4. take_snapshot()
5. ASSERT: champs lot visibles (sous-categorie, quantite)
6. fill(uid=subcategory_select, value="bodys")
7. fill(uid=lot_quantity_field, value="3")
8. fill(uid=description_field, value="Lot 3 bodys manches courtes 18 mois")
9. fill(uid=size_field, value="18 mois")
10. fill(uid=brand_field, value="Petit Bateau")
11. fill(uid=price_field, value="4.00")
12. click(uid=conformity_checkbox)
13. click(uid=add_article_button)
14. take_snapshot()
15. ASSERT: lot cree, compte comme 1 article dans le total
```

## D-07 : Modifier un article

```
1. # Sur la page d'une liste avec au moins 1 article
2. take_snapshot()
3. Trouver uid du bouton "Modifier" sur un article
4. click(uid=edit_article_button)
5. take_snapshot()
6. fill(uid=price_field, value="7.00")  # modifier le prix
7. click(uid=save_article_button)
8. take_snapshot()
9. ASSERT: article mis a jour avec le nouveau prix
```

## D-08 : Supprimer un article

```
1. # Sur la page d'une liste avec au moins 1 article
2. take_snapshot()
3. Trouver uid du bouton "Supprimer" sur un article
4. click(uid=delete_article_button)
5. # Modal de confirmation
6. take_snapshot()
7. click(uid=confirm_delete_button)
8. take_snapshot()
9. ASSERT: article supprime
10. ASSERT: compteurs decrementes
```

## D-09 : Valider la liste

**Pre-requis** : liste avec au moins 1 article, tous certifies conformes.

```
1. # Sur la page d'une liste prete a valider
2. take_snapshot()
3. Trouver uid du bouton "Valider la liste"
4. click(uid=validate_list_button)
5. take_snapshot()
6. ASSERT: checkbox d'acceptation apparait
7. click(uid=accept_validation_checkbox)
8. click(uid=confirm_validation_button)
9. take_snapshot()
10. ASSERT: liste validee
11. ASSERT: articles verrouilles (boutons modifier/supprimer masques)
```

## D-10 : Telecharger le PDF de la liste (MCP: partiel)

**Pre-requis** : liste validee.

```
1. # Sur la page d'une liste validee
2. take_snapshot()
3. Trouver uid du bouton "Telecharger PDF"
4. click(uid=download_pdf_button)
5. # Le clic declenche le telechargement
6. ASSERT: pas d'erreur affichee
7. # Note: le contenu du PDF ne peut pas etre verifie via MCP
```

## D-11 : Modifier son profil

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/profile")
3. take_snapshot()
4. fill(uid=phone_field, value="0699887766")
5. fill(uid=address_field, value="15 Rue des Roses")
6. click(uid=save_profile_button)
7. take_snapshot()
8. ASSERT: message de succes visible
9. ASSERT: profil mis a jour avec les nouvelles valeurs
```

## D-12 : Exporter ses donnees personnelles RGPD (MCP: partiel)

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/profile")
3. take_snapshot()
4. Trouver uid du bouton "Exporter mes donnees"
5. click(uid=export_data_button)
6. ASSERT: pas d'erreur affichee
7. # Note: le contenu du fichier JSON ne peut pas etre verifie via MCP
```

## D-13 : Supprimer son compte RGPD

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/profile")
3. take_snapshot()
4. Trouver uid du bouton "Supprimer mon compte"
5. click(uid=delete_account_button)
6. take_snapshot()
7. ASSERT: modal de confirmation visible
8. click(uid=confirm_delete_account_button)
9. wait_for("Connexion")
10. evaluate_script(() => location.pathname)
11. ASSERT: pathname === "/login"
12. ASSERT: compte anonymise (la reconnexion doit echouer)
```

## D-14 : Creer une deuxieme liste

**Pre-requis** : deposant avec 1 liste existante.

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/lists")
3. take_snapshot()
4. ASSERT: 1 liste deja visible
5. Trouver uid du bouton "Nouvelle liste"
6. click(uid=new_list_button)
7. take_snapshot()
8. ASSERT: deuxieme liste creee (max 2 listes)
```

---

## D-E01 : Ajouter un article sous le prix minimum

**Donnees** : `tests/data/invalid/articles.json` → `price_below_min`

```
1. # Sur la page d'une liste
2. fill(uid=category_select, value="accessories")
3. fill(uid=description_field, value="Barrette")
4. fill(uid=price_field, value="0.50")
5. click(uid=conformity_checkbox)
6. click(uid=add_article_button)
7. take_snapshot()
8. ASSERT: erreur "Prix minimum 1.00 EUR"
```

## D-E02 : Ajouter une poussette au-dessus du prix max

**Donnees** : `tests/data/invalid/articles.json` → `stroller_above_max`

```
1. # Sur la page d'une liste
2. fill(uid=category_select, value="childcare")
3. fill(uid=subcategory_select, value="stroller")
4. fill(uid=description_field, value="Poussette luxe")
5. fill(uid=price_field, value="200.00")
6. click(uid=conformity_checkbox)
7. click(uid=add_article_button)
8. take_snapshot()
9. ASSERT: erreur "Prix maximum 150.00 EUR"
```

## D-E03 : Ajouter un 25e article

**Pre-requis** : liste avec 24 articles.

```
1. # Sur la page d'une liste pleine (24 articles)
2. take_snapshot()
3. ASSERT: compteur affiche "24/24"
4. # Tenter d'ajouter un 25e
5. fill(uid=description_field, value="Article de trop")
6. fill(uid=price_field, value="5.00")
7. click(uid=add_article_button)
8. take_snapshot()
9. ASSERT: erreur "Maximum 24 articles" ou bouton d'ajout desactive
```

## D-E04 : Ajouter un 13e vetement

**Pre-requis** : liste avec 12 vetements.

```
1. # Sur la page d'une liste avec 12 vetements
2. fill(uid=category_select, value="clothing")
3. fill(uid=description_field, value="13e vetement")
4. fill(uid=size_field, value="6 ans")
5. fill(uid=price_field, value="5.00")
6. click(uid=conformity_checkbox)
7. click(uid=add_article_button)
8. take_snapshot()
9. ASSERT: erreur "Maximum 12 vetements"
```

## D-E05 : Ajouter un article interdit

**Donnees** : `tests/data/invalid/articles.json` → `forbidden_car_seat`

```
1. # Sur la page d'une liste
2. fill(uid=category_select, value="childcare")
3. fill(uid=subcategory_select, value="car_seat")
4. take_snapshot()
5. ASSERT: erreur "Article interdit" ou sous-categorie non disponible
```

## D-E06 : Ajouter un 2e manteau

**Pre-requis** : liste avec deja 1 manteau.

**Donnees** : `tests/data/invalid/articles.json` → `second_coat`

```
1. # Sur la page d'une liste avec 1 manteau
2. fill(uid=category_select, value="clothing")
3. fill(uid=subcategory_select, value="coat")
4. fill(uid=description_field, value="Doudoune hiver - 8 ans")
5. fill(uid=size_field, value="8 ans")
6. fill(uid=price_field, value="12.00")
7. click(uid=conformity_checkbox)
8. click(uid=add_article_button)
9. take_snapshot()
10. ASSERT: erreur "Maximum 1 manteau"
```

## D-E07 : Ajouter un lot avec mauvaise sous-categorie

**Donnees** : `tests/data/invalid/articles.json` → `invalid_lot_subcategory`

```
1. # Sur la page d'une liste
2. fill(uid=category_select, value="clothing")
3. click(uid=is_lot_checkbox)
4. fill(uid=subcategory_select, value="t-shirts")
5. take_snapshot()
6. ASSERT: erreur "Lots uniquement pour bodys/pyjamas" ou option non disponible
```

## D-E08 : Valider sans certification

```
1. # Sur la page d'une liste avec un article NON certifie
2. take_snapshot()
3. ASSERT: bouton "Valider la liste" desactive ou absent
4. # OU si le bouton est cliquable :
5. click(uid=validate_list_button)
6. take_snapshot()
7. ASSERT: erreur de validation
```

## D-E09 : Creer une 3e liste

**Pre-requis** : deposant avec deja 2 listes.

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/lists")
3. take_snapshot()
4. ASSERT: 2 listes affichees
5. ASSERT: bouton "Nouvelle liste" desactive ou masque
```

## D-E10 : Ajouter un article apres la date limite (MCP: partiel)

**Pre-requis** : edition avec date limite de declaration depassee (fixture).

```
1. # Se connecter + naviguer vers la liste
2. take_snapshot()
3. ASSERT: banniere d'erreur "Date limite de declaration depassee"
4. ASSERT: formulaire d'ajout desactive
```

## D-E11 : Modifier une liste validee

**Pre-requis** : liste avec statut "validee".

```
1. # Se connecter + naviguer vers la liste validee
2. take_snapshot()
3. ASSERT: boutons "Modifier" et "Supprimer" masques sur les articles
4. ASSERT: formulaire d'ajout d'article absent/desactive
```

## D-E12 : Acceder a la liste d'un autre deposant

```
1. # Se connecter en tant que deposant@example.com
2. # Naviguer vers une liste qui ne lui appartient pas
3. navigate_page(url="http://localhost:5173/depositor/lists/99999")
4. take_snapshot()
5. ASSERT: erreur 403 ou redirection
```

## D-E13 : Supprimer une liste non vide

**Pre-requis** : liste contenant des articles.

```
1. # Se connecter + naviguer vers la liste avec articles
2. take_snapshot()
3. ASSERT: bouton "Supprimer la liste" masque ou absent
```

---

## D-EC01 : Description d'article longueur max

**Donnees** : `tests/data/invalid/articles.json` → `description_101_chars` (utiliser les 100 premiers caracteres)

```
1. # Sur la page d'une liste
2. fill(uid=description_field, value="A".repeat(100))  # 100 caracteres exactement
3. fill(uid=category_select, value="toys")
4. fill(uid=price_field, value="5.00")
5. click(uid=conformity_checkbox)
6. click(uid=add_article_button)
7. take_snapshot()
8. ASSERT: article accepte (100 = max autorise)
```

## D-EC02 : Description d'article 101 caracteres

**Donnees** : `tests/data/invalid/articles.json` → `description_101_chars`

```
1. # Sur la page d'une liste
2. fill(uid=description_field, value="A".repeat(101))  # 101 caracteres
3. take_snapshot()
4. ASSERT: tronquee a 100 caracteres ou erreur de validation
```

## D-EC03 : Prix avec 3 decimales

**Donnees** : `tests/data/invalid/articles.json` → `price_3_decimals`

```
1. # Sur la page d'une liste
2. fill(uid=price_field, value="5.999")
3. fill(uid=category_select, value="toys")
4. fill(uid=description_field, value="Article test")
5. click(uid=conformity_checkbox)
6. click(uid=add_article_button)
7. take_snapshot()
8. ASSERT: arrondi a 6.00 ou erreur de validation
```

## D-EC04 : Description vide

**Donnees** : `tests/data/invalid/articles.json` → `description_empty`

```
1. # Sur la page d'une liste
2. fill(uid=category_select, value="toys")
3. fill(uid=description_field, value="")
4. fill(uid=price_field, value="5.00")
5. click(uid=add_article_button)
6. take_snapshot()
7. ASSERT: erreur de validation "Description requise"
```

## D-EC05 : Quantite de lot = 0

**Donnees** : `tests/data/invalid/articles.json` → `lot_quantity_zero`

```
1. # Sur la page d'une liste
2. fill(uid=category_select, value="clothing")
3. click(uid=is_lot_checkbox)
4. fill(uid=subcategory_select, value="bodys")
5. fill(uid=lot_quantity_field, value="0")
6. fill(uid=description_field, value="Lot vide")
7. fill(uid=price_field, value="3.00")
8. click(uid=add_article_button)
9. take_snapshot()
10. ASSERT: erreur de validation "Quantite minimale 1"
```

## D-EC06 : Caracteres speciaux dans la description

**Donnees** : `tests/data/invalid/articles.json` → `description_special_chars`

```
1. # Sur la page d'une liste
2. fill(uid=description_field, value="T-shirt bebe 'Zara' (3 mois)")
3. fill(uid=category_select, value="clothing")
4. fill(uid=size_field, value="3 mois")
5. fill(uid=price_field, value="4.00")
6. click(uid=conformity_checkbox)
7. click(uid=add_article_button)
8. take_snapshot()
9. ASSERT: article accepte avec description intacte (pas d'echappement visible)
```

## D-EC07 : Validation concurrente de liste

```
1. # Sur la page d'une liste prete a valider
2. take_snapshot()
3. click(uid=validate_list_button)
4. click(uid=validate_list_button)  # double clic rapide
5. take_snapshot()
6. ASSERT: une seule validation reussit, pas d'erreur
7. list_network_requests(resourceTypes=["fetch"])
8. ASSERT: pas de requete de validation dupliquee (ou deuxieme ignoree)
```

## D-EC08 : Navigation pendant la sauvegarde (MCP: non)

> Non testable via MCP : necessite de fermer l'onglet pendant une requete en cours.
> Alternative : test unitaire backend pour verifier l'atomicite des transactions.
