# Scenarios Benevole (B-01 a B-EC05)

**Pre-requis pour tous** : connecte en tant que benevole (`volunteer@alpe-bourse.fr` / `Volunteer123!`).
Utiliser la procedure `LOGIN` de `tests/helpers/mcp-actions.md`.

**Donnees** : `tests/data/users/accounts.json` → `volunteer`

---

## B-01 : Scanner un QR code d'article (MCP: non)

> Non testable via MCP : necessite une camera physique.
> Utiliser B-06 (saisie manuelle) comme alternative pour les tests.

## B-02 : Enregistrer une vente en especes (MCP: partiel)

**Pre-requis** : edition en cours, articles disponibles a la vente.

**Donnees** : `tests/data/valid/sales.json` → `sale_cash`, `manual_barcode_lookup`

```
1. # Se connecter en tant que benevole
2. navigate_page(url="http://localhost:5173/editions/{edition_id}/sales")
3. take_snapshot()
4. # Saisir le code-barres manuellement (remplace le scan camera)
5. fill(uid=barcode_input, value="EDI-001-L100-A01")
6. click(uid=search_barcode_button)  # ou press_key("Enter")
7. take_snapshot()
8. ASSERT: details de l'article affiches (description, prix)
9. # Selectionner le moyen de paiement
10. click(uid=payment_cash_button)
11. click(uid=confirm_sale_button)
12. take_snapshot()
13. ASSERT: vente enregistree
14. ASSERT: article apparait dans les ventes recentes
```

## B-03 : Enregistrer une vente par carte (MCP: partiel)

**Donnees** : `tests/data/valid/sales.json` → `sale_card`

```
1. # Se connecter + naviguer vers page ventes
2. fill(uid=barcode_input, value="EDI-001-L100-A02")
3. click(uid=search_barcode_button)
4. take_snapshot()
5. ASSERT: article affiche
6. click(uid=payment_card_button)
7. click(uid=confirm_sale_button)
8. take_snapshot()
9. ASSERT: vente par carte enregistree
```

## B-04 : Enregistrer une vente par cheque (MCP: partiel)

**Donnees** : `tests/data/valid/sales.json` → `sale_check`

```
1. # Se connecter + naviguer vers page ventes
2. fill(uid=barcode_input, value="EDI-001-L100-A03")
3. click(uid=search_barcode_button)
4. take_snapshot()
5. ASSERT: article affiche
6. click(uid=payment_check_button)
7. click(uid=confirm_sale_button)
8. take_snapshot()
9. ASSERT: vente par cheque enregistree
```

## B-05 : Annuler une vente recente

**Pre-requis** : vente enregistree il y a moins de 5 minutes.

```
1. # Apres avoir enregistre une vente (B-02)
2. take_snapshot()
3. Trouver uid du bouton "Annuler" sur la vente recente
4. click(uid=cancel_sale_button)
5. take_snapshot()
6. ASSERT: modal de confirmation visible
7. click(uid=confirm_cancel_button)
8. take_snapshot()
9. ASSERT: vente annulee
10. ASSERT: article remis en vente (disponible pour nouveau scan)
```

## B-06 : Saisie manuelle du code-barres

**Donnees** : `tests/data/valid/sales.json` → `manual_barcode_lookup`

```
1. # Se connecter + naviguer vers page ventes
2. take_snapshot()
3. Trouver uid du champ de saisie manuelle du code-barres
4. fill(uid=barcode_input, value="EDI-001-L100-A01")
5. press_key("Enter")
6. take_snapshot()
7. ASSERT: article trouve et affiche (description, prix, deposant)
```

## B-07 : Consulter les statistiques en direct

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/editions/{edition_id}/stats")
3. take_snapshot()
4. ASSERT: statistiques affichees (nombre de ventes, CA, etc.)
5. ASSERT: rafraichissement automatique visible (indicateur ou timer)
```

## B-08 : Detection de vente privee (MCP: non)

> Non testable via MCP : necessite que l'horloge systeme soit un vendredi entre 17h et 18h.
> Alternative : test unitaire backend pour la logique de detection.

---

## B-E01 : Scanner un code-barres inconnu

**Donnees** : `tests/data/valid/sales.json` → `unknown_barcode`

```
1. # Se connecter + naviguer vers page ventes
2. fill(uid=barcode_input, value="EDI-999-L999-A99")
3. press_key("Enter")
4. take_snapshot()
5. ASSERT: erreur "Article non trouve"
```

## B-E02 : Scanner un article deja vendu

**Pre-requis** : article deja vendu (via B-02).

```
1. # Se connecter + naviguer vers page ventes
2. fill(uid=barcode_input, value="EDI-001-L100-A01")  # article deja vendu
3. press_key("Enter")
4. take_snapshot()
5. ASSERT: erreur "Article deja vendu"
```

## B-E03 : Annuler une vente apres 5 min (MCP: non)

> Non testable via MCP : necessite d'attendre 5+ minutes apres une vente.
> Alternative : test backend avec manipulation de timestamp.

## B-E04 : Scanner sans edition ouverte

**Pre-requis** : aucune edition `in_progress`.

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/editions/{closed_edition_id}/sales")
3. take_snapshot()
4. ASSERT: message d'erreur (edition pas en cours)
```

## B-E05 : Format de code-barres invalide

**Donnees** : `tests/data/valid/sales.json` → `invalid_barcode_format`

```
1. # Se connecter + naviguer vers page ventes
2. fill(uid=barcode_input, value="ABC")
3. press_key("Enter")
4. take_snapshot()
5. ASSERT: avertissement "Format invalide"
```

---

## B-EC01 : Scans consecutifs rapides (MCP: partiel)

```
1. # Se connecter + naviguer vers page ventes
2. fill(uid=barcode_input, value="EDI-001-L100-A01")
3. press_key("Enter")
4. # Immediatement enchainer avec un autre
5. fill(uid=barcode_input, value="EDI-001-L100-A02")
6. press_key("Enter")
7. fill(uid=barcode_input, value="EDI-001-L100-A03")
8. press_key("Enter")
9. take_snapshot()
10. ASSERT: tous les articles traites sequentiellement, pas de perte
```

## B-EC02 : Vente hors-ligne

```
1. # Se connecter + naviguer vers page ventes
2. emulate(networkConditions="Offline")
3. fill(uid=barcode_input, value="EDI-001-L100-A04")
4. press_key("Enter")
5. take_snapshot()
6. ASSERT: indication de mode hors-ligne
7. click(uid=payment_cash_button)
8. click(uid=confirm_sale_button)
9. take_snapshot()
10. ASSERT: vente mise en file d'attente locale
11. # Retablir le reseau
12. emulate(networkConditions="No emulation")
13. take_snapshot()
14. ASSERT: vente synchronisee avec le serveur
```

## B-EC03 : Conflit de synchronisation hors-ligne (MCP: non)

> Non testable via MCP : necessite 2 sessions simultanees vendant le meme article.
> Alternative : test backend avec requetes concurrentes.

## B-EC04 : Permission camera refusee (MCP: non)

> Non testable via MCP : ne peut pas simuler le refus de permission camera.
> Alternative : verifier manuellement que le mode saisie manuelle s'affiche.

## B-EC05 : Attribution de numero de caisse (MCP: non)

> Non testable via MCP : necessite plusieurs sessions simultanees.
> Alternative : test backend pour la logique d'attribution de caisse.
