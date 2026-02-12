# Scenarios Gestionnaire (G-01 a G-EC06)

**Pre-requis pour tous** : connecte en tant que gestionnaire (`manager@alpe-bourse.fr` / `Manager123!`).
Utiliser la procedure `LOGIN` de `tests/helpers/mcp-actions.md`.

**Donnees** : `tests/data/users/accounts.json` → `manager`

---

## G-01 : Consulter la liste des editions

```
1. # Se connecter en tant que gestionnaire
2. navigate_page(url="http://localhost:5173/editions")
3. take_snapshot()
4. ASSERT: tableau des editions affiche
5. ASSERT: colonnes visibles (nom, statut, dates, actions)
```

## G-02 : Configurer les dates d'edition

**Pre-requis** : edition en statut brouillon existante.

**Donnees** : `tests/data/valid/editions.json` → `active_edition`

```
1. # Se connecter + naviguer vers le detail d'une edition brouillon
2. navigate_page(url="http://localhost:5173/editions/{draft_edition_id}")
3. take_snapshot()
4. Trouver le formulaire de configuration
5. fill(uid=start_date_field, value="2026-03-11T09:00")
6. fill(uid=end_date_field, value="2026-03-14T18:00")
7. fill(uid=commission_rate_field, value="0.20")
8. click(uid=save_config_button)
9. take_snapshot()
10. ASSERT: edition configuree, statut = "configure"
11. ASSERT: message de succes visible
```

## G-03 : Creer des creneaux de depot

**Pre-requis** : edition configuree.

**Donnees** : `tests/data/valid/deposit_slots.json`

```
1. # Se connecter + naviguer vers le detail de l'edition
2. take_snapshot()
3. Trouver la section "Creneaux de depot"
4. click(uid=add_slot_button)
5. take_snapshot()
6. fill(uid=slot_start_field, value="2026-03-11T09:30")
7. fill(uid=slot_end_field, value="2026-03-11T11:30")
8. fill(uid=slot_capacity_field, value="20")
9. click(uid=save_slot_button)
10. take_snapshot()
11. ASSERT: creneau cree et affiche dans la liste
12. ASSERT: capacite et horaires corrects
```

## G-04 : Importer le CSV Billetweb

**Donnees** : `tests/data/valid/billetweb_e2e.csv`

```
1. # Se connecter + naviguer vers le detail de l'edition
2. take_snapshot()
3. Trouver uid du bouton/zone d'import CSV
4. upload_file(uid=csv_upload_input, filePath="tests/data/valid/billetweb_e2e.csv")
5. take_snapshot()
6. ASSERT: apercu des donnees affiche (5 lignes)
7. ASSERT: colonnes Nom, Prenom, Email, Creneau visibles
8. click(uid=confirm_import_button)
9. wait_for("Import termine")
10. take_snapshot()
11. ASSERT: deposants importes (5)
12. ASSERT: invitations envoyees
```

## G-05 : Consulter les deposants d'une edition

```
1. # Se connecter + naviguer vers les deposants
2. navigate_page(url="http://localhost:5173/editions/{edition_id}/depositors")
3. take_snapshot()
4. ASSERT: liste des deposants affichee
5. ASSERT: filtres disponibles
```

## G-06 : Creer une invitation individuelle

**Donnees** : `tests/data/valid/invitations.json` → `single_invitation`

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/admin/invitations")
3. take_snapshot()
4. click(uid=new_invitation_button)
5. take_snapshot()
6. fill(uid=invite_email_field, value="nouveau@example.com")
7. fill(uid=invite_first_name_field, value="Marie")
8. fill(uid=invite_last_name_field, value="Martin")
9. click(uid=send_invitation_button)
10. take_snapshot()
11. ASSERT: invitation creee avec succes
12. ASSERT: email apparait dans la liste
```

## G-07 : Creer des invitations en masse

**Donnees** : `tests/data/valid/invitations.json` → `bulk_csv_content`

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/admin/invitations")
3. take_snapshot()
4. click(uid=bulk_invite_button)
5. take_snapshot()
6. # Charger un fichier CSV
7. upload_file(uid=csv_invite_input, filePath="tests/data/valid/billetweb_e2e.csv")
8. take_snapshot()
9. ASSERT: apercu des invitations affiche
10. click(uid=confirm_bulk_button)
11. take_snapshot()
12. ASSERT: invitations multiples creees
```

## G-08 : Relancer une invitation

**Pre-requis** : invitation en statut `pending`.

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/admin/invitations")
3. take_snapshot()
4. Trouver uid du bouton "Relancer" sur une invitation en attente
5. click(uid=resend_invitation_button)
6. take_snapshot()
7. ASSERT: message de succes "Invitation relancee"
8. ASSERT: nouveau token genere (date mise a jour)
```

## G-09 : Relancer des invitations en masse

**Pre-requis** : plusieurs invitations en statut `pending`.

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/admin/invitations")
3. take_snapshot()
4. # Selectionner plusieurs invitations
5. click(uid=select_all_checkbox)
6. take_snapshot()
7. ASSERT: barre d'actions en masse visible
8. click(uid=bulk_resend_button)
9. take_snapshot()
10. ASSERT: modal de confirmation
11. click(uid=confirm_bulk_resend_button)
12. take_snapshot()
13. ASSERT: invitations relancees avec succes
```

## G-10 : Supprimer une invitation

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/admin/invitations")
3. take_snapshot()
4. Trouver uid du bouton "Supprimer" sur une invitation
5. click(uid=delete_invitation_button)
6. take_snapshot()
7. ASSERT: modal de confirmation
8. click(uid=confirm_delete_button)
9. take_snapshot()
10. ASSERT: invitation supprimee de la liste
```

## G-11 : Supprimer des invitations en masse

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/admin/invitations")
3. take_snapshot()
4. click(uid=select_all_checkbox)
5. click(uid=bulk_delete_button)
6. take_snapshot()
7. ASSERT: modal de confirmation
8. click(uid=confirm_bulk_delete_button)
9. take_snapshot()
10. ASSERT: toutes les invitations selectionnees supprimees
```

## G-12 : Exporter les invitations en Excel (MCP: partiel)

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/admin/invitations/stats")
3. take_snapshot()
4. Trouver uid du bouton "Exporter Excel"
5. click(uid=export_excel_button)
6. ASSERT: pas d'erreur affichee
7. # Note: contenu du fichier Excel non verifiable via MCP
```

## G-13 : Generer les etiquettes par creneau (MCP: partiel)

**Pre-requis** : edition avec listes validees.

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/editions/{edition_id}/labels")
3. take_snapshot()
4. # Selectionner mode "Par creneau"
5. click(uid=mode_slot_radio)
6. fill(uid=slot_select, value="Mercredi 11 mars 9h30-11h30")
7. click(uid=generate_labels_button)
8. ASSERT: pas d'erreur affichee
9. # Note: contenu PDF non verifiable via MCP
```

## G-14 : Generer les etiquettes (toutes) (MCP: partiel)

```
1. # Se connecter + naviguer vers page etiquettes
2. take_snapshot()
3. click(uid=mode_all_radio)
4. click(uid=generate_labels_button)
5. ASSERT: pas d'erreur affichee
```

## G-15 : Generer les etiquettes par selection (MCP: partiel)

```
1. # Se connecter + naviguer vers page etiquettes
2. take_snapshot()
3. click(uid=mode_selection_radio)
4. # Selectionner des deposants
5. click(uid=depositor_checkbox_1)
6. click(uid=depositor_checkbox_2)
7. click(uid=generate_labels_button)
8. ASSERT: pas d'erreur affichee
```

## G-16 : Calculer les reversements

**Pre-requis** : edition avec ventes enregistrees.

**Donnees** : `tests/data/valid/payouts.json` → `expected_calculation`

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/editions/{edition_id}/payouts")
3. take_snapshot()
4. click(uid=calculate_payouts_button)
5. take_snapshot()
6. ASSERT: reversements calcules pour tous les deposants
7. ASSERT: montants affiches (brut, commission, net)
8. # Verifier un calcul specifique
9. ASSERT: deposant avec 59 EUR brut → 47.20 EUR net (commission 20%)
```

## G-17 : Enregistrer un paiement (especes)

**Donnees** : `tests/data/valid/payouts.json` → `payment_cash`

```
1. # Se connecter + naviguer vers les reversements
2. take_snapshot()
3. Trouver uid du bouton "Payer" sur un reversement
4. click(uid=pay_payout_button)
5. take_snapshot()
6. ASSERT: modal de paiement visible
7. click(uid=payment_method_cash)
8. click(uid=confirm_payment_button)
9. take_snapshot()
10. ASSERT: reversement marque comme "Paye"
11. ASSERT: badge de statut mis a jour
```

## G-18 : Enregistrer un paiement (cheque)

**Donnees** : `tests/data/valid/payouts.json` → `payment_check`

```
1. # Se connecter + naviguer vers les reversements
2. take_snapshot()
3. click(uid=pay_payout_button)
4. take_snapshot()
5. click(uid=payment_method_check)
6. fill(uid=payment_reference_field, value="CHQ-12345")
7. fill(uid=payment_notes_field, value="Cheque n.12345 Banque Populaire")
8. click(uid=confirm_payment_button)
9. take_snapshot()
10. ASSERT: reversement marque "Paye" avec reference "CHQ-12345"
```

## G-19 : Telecharger un bordereau de reversement (MCP: partiel)

```
1. # Se connecter + naviguer vers les reversements
2. take_snapshot()
3. Trouver uid de l'icone PDF sur une ligne
4. click(uid=download_payout_pdf_button)
5. ASSERT: pas d'erreur affichee
```

## G-20 : Telecharger tous les bordereaux (MCP: partiel)

```
1. # Se connecter + naviguer vers les reversements
2. take_snapshot()
3. click(uid=download_all_payouts_button)
4. ASSERT: pas d'erreur affichee
```

## G-21 : Exporter les reversements en Excel (MCP: partiel)

```
1. # Se connecter + naviguer vers les reversements
2. take_snapshot()
3. click(uid=export_payouts_excel_button)
4. ASSERT: pas d'erreur affichee
```

## G-22 : Envoyer un rappel de reversement (MCP: partiel)

**Pre-requis** : deposant marque comme absent.

```
1. # Se connecter + naviguer vers les reversements
2. take_snapshot()
3. Trouver uid du bouton "Relancer" sur un deposant absent
4. click(uid=remind_payout_button)
5. take_snapshot()
6. ASSERT: message de succes "Rappel envoye"
7. # Verifier via MailHog
8. new_page(url="http://localhost:8025")
9. take_snapshot()
10. ASSERT: email de rappel visible dans la boite de reception
11. close_page()
```

## G-23 : Relancer tous les absents (MCP: partiel)

```
1. # Se connecter + naviguer vers les reversements
2. take_snapshot()
3. click(uid=remind_all_absent_button)
4. take_snapshot()
5. ASSERT: modal de confirmation
6. click(uid=confirm_remind_all_button)
7. take_snapshot()
8. ASSERT: emails mis en file d'attente
```

## G-24 : Consulter le tableau de bord des reversements

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/editions/{edition_id}/payouts/dashboard")
3. take_snapshot()
4. ASSERT: graphiques et statistiques affiches
5. ASSERT: total brut, total net, nombre de reversements visibles
```

## G-25 : Consulter les statistiques d'invitations

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/admin/invitations/stats")
3. take_snapshot()
4. ASSERT: page de statistiques affichee
5. ASSERT: graphiques visibles (par statut, par date)
```

## G-26 : Annuler une vente (droit gestionnaire)

**Pre-requis** : vente enregistree (pas de limite de temps pour le gestionnaire).

```
1. # Se connecter en tant que gestionnaire
2. navigate_page(url="http://localhost:5173/editions/{edition_id}/sales/manage")
3. take_snapshot()
4. ASSERT: tableau des ventes affiche
5. Trouver uid du bouton "Annuler" sur une vente
6. click(uid=cancel_sale_button)
7. take_snapshot()
8. ASSERT: modal de confirmation
9. click(uid=confirm_cancel_button)
10. take_snapshot()
11. ASSERT: vente annulee (pas de restriction 5 min)
```

## G-27 : Filtrer les invitations par statut

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/admin/invitations")
3. take_snapshot()
4. Trouver uid du filtre de statut
5. fill(uid=status_filter, value="expired")
6. take_snapshot()
7. ASSERT: seules les invitations expirees affichees
```

## G-28 : Filtrer les reversements par statut

```
1. # Se connecter + naviguer vers les reversements
2. take_snapshot()
3. fill(uid=payout_status_filter, value="paid")
4. take_snapshot()
5. ASSERT: seuls les reversements payes affiches
```

## G-29 : Rechercher un reversement par nom

```
1. # Se connecter + naviguer vers les reversements
2. take_snapshot()
3. fill(uid=payout_search_field, value="Durand")
4. take_snapshot()
5. ASSERT: resultats filtres par le nom "Durand"
```

## G-30 : Envoyer un rappel de date limite (MCP: partiel)

```
1. # Se connecter + naviguer vers le detail de l'edition
2. take_snapshot()
3. Trouver uid du bouton "Envoyer un rappel"
4. click(uid=send_deadline_reminder_button)
5. take_snapshot()
6. ASSERT: message de succes "Rappels envoyes"
7. # Verifier via MailHog
8. new_page(url="http://localhost:8025")
9. take_snapshot()
10. ASSERT: emails de rappel visibles
11. close_page()
```

---

## G-E01 : Importer un CSV invalide

**Donnees** : `tests/data/invalid/billetweb_malformed.csv`

```
1. # Se connecter + naviguer vers le detail de l'edition
2. take_snapshot()
3. upload_file(uid=csv_upload_input, filePath="tests/data/invalid/billetweb_malformed.csv")
4. take_snapshot()
5. ASSERT: apercu affiche les erreurs (colonnes manquantes, emails invalides)
6. ASSERT: bouton "Confirmer" desactive ou absent
```

## G-E02 : Importer un CSV avec inscriptions non payees

```
1. # Se connecter + charger un CSV avec des inscriptions "Non paye"
2. upload_file(uid=csv_upload_input, filePath="tests/data/valid/billetweb_e2e_unpaid.csv")
3. take_snapshot()
4. ASSERT: inscriptions non payees ignorees
5. ASSERT: total affiche indique les lignes ignorees
```

## G-E03 : Creer une invitation en doublon

**Donnees** : `tests/data/valid/invitations.json` → `duplicate_email`

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/admin/invitations")
3. click(uid=new_invitation_button)
4. fill(uid=invite_email_field, value="deposant@example.com")  # email deja existant
5. fill(uid=invite_first_name_field, value="Test")
6. fill(uid=invite_last_name_field, value="Doublon")
7. click(uid=send_invitation_button)
8. take_snapshot()
9. ASSERT: erreur "Email deja invite" ou "Cet utilisateur existe deja"
```

## G-E04 : Configurer des dates invalides

**Donnees** : `tests/data/invalid/editions.json` → `invalid_dates`

```
1. # Se connecter + naviguer vers une edition brouillon
2. take_snapshot()
3. fill(uid=start_date_field, value="2026-03-15T09:00")
4. fill(uid=end_date_field, value="2026-03-14T18:00")  # fin AVANT debut
5. click(uid=save_config_button)
6. take_snapshot()
7. ASSERT: erreur "Date de fin avant date de debut"
```

## G-E05 : Creer des creneaux qui se chevauchent

**Donnees** : `tests/data/invalid/editions.json` → `overlapping_slot`

**Pre-requis** : creneau existant mercredi 9h30-11h30.

```
1. # Se connecter + naviguer vers l'edition
2. take_snapshot()
3. click(uid=add_slot_button)
4. fill(uid=slot_start_field, value="2026-03-11T10:00")  # chevauche 9h30-11h30
5. fill(uid=slot_end_field, value="2026-03-11T11:00")
6. fill(uid=slot_capacity_field, value="10")
7. click(uid=save_slot_button)
8. take_snapshot()
9. ASSERT: erreur "Creneaux se chevauchent"
```

## G-E06 : Enregistrer un paiement deux fois

**Pre-requis** : reversement deja paye.

```
1. # Se connecter + naviguer vers les reversements
2. take_snapshot()
3. Trouver un reversement avec statut "Paye"
4. ASSERT: bouton "Payer" desactive ou masque sur ce reversement
```

## G-E07 : Gestionnaire tente de creer une edition

```
1. # Se connecter en tant que gestionnaire
2. navigate_page(url="http://localhost:5173/editions")
3. take_snapshot()
4. ASSERT: bouton "Nouvelle edition" absent (admin uniquement)
```

## G-E08 : Gestionnaire tente de cloturer une edition

```
1. # Se connecter en tant que gestionnaire
2. navigate_page(url="http://localhost:5173/editions/{edition_id}")
3. take_snapshot()
4. ASSERT: bouton "Cloturer" absent (admin uniquement)
```

## G-E09 : Gestionnaire tente de voir les journaux d'audit

```
1. # Se connecter en tant que gestionnaire
2. navigate_page(url="http://localhost:5173/admin/audit-logs")
3. take_snapshot()
4. ASSERT: 403 ou redirection (route non accessible)
```

---

## G-EC01 : Import d'un CSV de 500 lignes

```
1. # Se connecter + naviguer vers le detail de l'edition
2. # Utiliser un fichier CSV de 500 lignes (a generer)
3. upload_file(uid=csv_upload_input, filePath="tests/data/valid/billetweb_500.csv")
4. take_snapshot()
5. ASSERT: apercu affiche (pagination si necessaire)
6. click(uid=confirm_import_button)
7. # Attendre la fin du traitement
8. wait_for("Import termine")
9. take_snapshot()
10. ASSERT: 500 deposants importes, progression affichee
```

## G-EC02 : Taux de commission a 0%

**Donnees** : `tests/data/invalid/editions.json` → `commission_0_percent`

```
1. # Se connecter + configurer une edition avec commission 0%
2. fill(uid=commission_rate_field, value="0")
3. click(uid=save_config_button)
4. take_snapshot()
5. ASSERT: commission sauvegardee a 0%
6. # Calculer les reversements
7. click(uid=calculate_payouts_button)
8. take_snapshot()
9. ASSERT: net = brut pour tous les deposants (pas de commission)
```

## G-EC03 : Taux de commission a 100%

**Donnees** : `tests/data/invalid/editions.json` → `commission_100_percent`

```
1. # Se connecter + configurer une edition avec commission 100%
2. fill(uid=commission_rate_field, value="1")
3. click(uid=save_config_button)
4. take_snapshot()
5. ASSERT: commission sauvegardee a 100%
6. # Calculer les reversements
7. click(uid=calculate_payouts_button)
8. take_snapshot()
9. ASSERT: net = 0 pour tous les deposants
```

## G-EC04 : Recalcul apres annulation de vente

**Pre-requis** : reversements calcules, puis une vente annulee.

```
1. # Se connecter + naviguer vers les reversements
2. take_snapshot()
3. ASSERT: montant actuel note (ex: 47.20 EUR)
4. # Aller annuler une vente
5. navigate_page(url="http://localhost:5173/editions/{edition_id}/sales/manage")
6. click(uid=cancel_sale_button)
7. click(uid=confirm_cancel_button)
8. # Revenir aux reversements et recalculer
9. navigate_page(url="http://localhost:5173/editions/{edition_id}/payouts")
10. click(uid=calculate_payouts_button)
11. take_snapshot()
12. ASSERT: montant inferieur au precedent
```

## G-EC05 : Etiquettes pour deposant sans liste validee

```
1. # Se connecter + naviguer vers les etiquettes
2. take_snapshot()
3. click(uid=mode_selection_radio)
4. # Selectionner un deposant sans liste validee
5. click(uid=depositor_no_list_checkbox)
6. click(uid=generate_labels_button)
7. take_snapshot()
8. ASSERT: ignore ou message d'erreur
```

## G-EC06 : Relance en masse avec statuts mixtes

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/admin/invitations")
3. take_snapshot()
4. # Selectionner des invitations avec des statuts differents (activees + en attente)
5. click(uid=select_all_checkbox)
6. click(uid=bulk_resend_button)
7. take_snapshot()
8. ASSERT: modal indique combien seront relancees (seulement pending/expired)
9. click(uid=confirm_bulk_resend_button)
10. take_snapshot()
11. ASSERT: seules les invitations pending/expired sont relancees
12. ASSERT: les invitations activees sont ignorees
```
