# MCP Chrome DevTools - Actions reutilisables

Sequences d'actions MCP reutilisables dans les scenarios de test E2E.

## Conventions

- `snapshot` = `take_snapshot()` suivi de lecture de l'arbre a11y
- `assert_text(text)` = verifier que `text` apparait dans le snapshot
- `assert_no_text(text)` = verifier que `text` n'apparait PAS dans le snapshot
- `assert_url(path)` = verifier l'URL courante via `evaluate_script(() => location.pathname)`

---

## AUTH: Connexion

```
Action: login(email, password)
1. navigate_page(url="http://localhost:5173/login")
2. snapshot → trouver les uid des champs email, password, bouton submit
3. fill(uid=email_field, value=email)
4. fill(uid=password_field, value=password)
5. click(uid=submit_button)
6. wait_for("Deconnexion") ou wait_for(texte attendu)
7. assert_url("/")
```

## AUTH: Deconnexion

```
Action: logout()
1. snapshot → trouver le bouton/lien "Deconnexion"
2. click(uid=logout_button)
3. wait_for("Connexion")
4. assert_url("/login")
```

## AUTH: Verifier le role connecte

```
Action: verify_role(expected_role)
1. snapshot → chercher indicateur de role dans le header
2. assert_text(expected_role) ou verifier les liens visibles selon le role
```

---

## EDITION: Creer une edition (admin)

```
Action: create_edition(name, location)
Pre-requis: connecte en tant qu'admin
1. navigate_page(url="http://localhost:5173/editions")
2. snapshot → trouver le bouton "Nouvelle edition"
3. click(uid=new_edition_button)
4. wait_for("Creer une edition") ou formulaire affiche
5. snapshot → trouver les champs nom, lieu
6. fill(uid=name_field, value=name)
7. fill(uid=location_field, value=location)
8. click(uid=submit_button)
9. wait_for(name) dans la liste des editions
```

## EDITION: Configurer les dates (manager/admin)

```
Action: configure_edition(edition_id, dates, commission_rate)
Pre-requis: connecte en tant que manager ou admin
1. navigate_page(url="http://localhost:5173/editions/{edition_id}")
2. snapshot → trouver les champs de dates
3. fill chaque champ de date
4. fill(uid=commission_field, value=commission_rate)
5. click(uid=save_button)
6. wait_for("Configure") ou succes
```

---

## INVITATION: Creer une invitation

```
Action: create_invitation(email, first_name, last_name, list_type)
Pre-requis: connecte en tant que manager ou admin
1. navigate_page(url="http://localhost:5173/admin/invitations")
2. snapshot → trouver le bouton "Nouvelle invitation"
3. click(uid=new_invitation_button)
4. wait_for formulaire modal
5. snapshot → trouver les champs
6. fill(uid=email_field, value=email)
7. fill(uid=first_name_field, value=first_name)
8. fill(uid=last_name_field, value=last_name)
9. fill(uid=list_type_select, value=list_type)
10. click(uid=submit_button)
11. wait_for("Invitation envoyee") ou succes
```

## INVITATION: Recuperer un token via MailHog

```
Action: get_activation_token(email)
Pre-requis: invitation envoyee pour cet email
1. new_page(url="http://localhost:8025") → ouvrir MailHog
2. wait_for(email) dans la liste des messages
3. snapshot → trouver le message
4. click sur le message
5. snapshot → chercher le lien d'activation contenant "?token="
6. evaluate_script pour extraire le token de l'URL
7. close_page → revenir a l'application
8. Retourner le token
```

---

## DEPOSANT: Creer une liste

```
Action: create_list(edition_id)
Pre-requis: connecte en tant que deposant
1. navigate_page(url="http://localhost:5173/depositor/editions/{edition_id}/lists")
2. snapshot → trouver le bouton "Nouvelle liste"
3. click(uid=new_list_button)
4. wait_for redirection vers le detail de la liste
5. Retourner l'URL/ID de la liste creee
```

## DEPOSANT: Ajouter un article

```
Action: add_article(list_id, article_data)
Pre-requis: connecte, sur la page de la liste
1. navigate_page(url="http://localhost:5173/depositor/lists/{list_id}") si pas deja dessus
2. snapshot → trouver le bouton "Nouvel article"
3. click(uid=new_article_button)
4. wait_for formulaire
5. snapshot → trouver les champs
6. fill(uid=category_select, value=article_data.category)
7. fill(uid=description_field, value=article_data.description)
8. fill(uid=price_field, value=article_data.price)
9. Si article_data.size: fill(uid=size_field, value=article_data.size)
10. Si article_data.brand: fill(uid=brand_field, value=article_data.brand)
11. Si article_data.is_lot: click(uid=lot_checkbox), fill quantity
12. click(uid=certify_checkbox)
13. click(uid=submit_button)
14. wait_for article dans la liste ou message de succes
```

---

## BENEVOLE: Saisie manuelle + vente

```
Action: manual_sale(barcode, payment_method)
Pre-requis: connecte en tant que benevole, edition en cours
1. navigate_page(url="http://localhost:5173/editions/{edition_id}/sales")
2. snapshot → trouver le champ de saisie manuelle
3. fill(uid=barcode_input, value=barcode)
4. press_key("Enter") ou click(uid=search_button)
5. wait_for details de l'article
6. snapshot → verifier description, prix
7. click(uid=payment_method_button) selon payment_method
8. click(uid=confirm_button)
9. wait_for("Vente enregistree") ou succes
```

---

## VERIFICATION: Contenu de page

```
Action: assert_page_content(expected_texts, forbidden_texts)
1. snapshot ou take_screenshot
2. Pour chaque text dans expected_texts: assert_text(text)
3. Pour chaque text dans forbidden_texts: assert_no_text(text)
```

## VERIFICATION: Message d'erreur

```
Action: assert_error(expected_message)
1. snapshot
2. Chercher un element avec role=alert ou classe error/red
3. assert_text(expected_message)
```

## VERIFICATION: Redirection

```
Action: assert_redirect(expected_path)
1. Attendre stabilisation de l'URL
2. evaluate_script(() => location.pathname)
3. Verifier que le resultat contient expected_path
```

---

## MAILHOG: Verifier l'envoi d'email

```
Action: verify_email_sent(recipient_email)
1. new_page(url="http://localhost:8025")
2. wait_for(recipient_email) dans la liste
3. snapshot → verifier la presence du message
4. close_page
```

## PERFORMANCE: Mesurer le chargement

```
Action: measure_page_load(url)
1. emulate(networkConditions="Fast 3G") si test reseau
2. performance_start_trace(reload=false, autoStop=false)
3. navigate_page(url=url)
4. wait_for contenu principal
5. performance_stop_trace()
6. Analyser les resultats (CWV, LCP, etc.)
```

## ACCESSIBILITE: Verifier les landmarks

```
Action: check_a11y(page_url)
1. navigate_page(url=page_url)
2. take_snapshot(verbose=true)
3. Verifier: nav, main, header presents
4. Verifier: tous les inputs ont des labels
5. press_key("Tab") x N → verifier focus visible
```
