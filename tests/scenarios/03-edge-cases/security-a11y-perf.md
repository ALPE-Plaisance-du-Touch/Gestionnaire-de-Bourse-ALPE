# Scenarios Securite, Performance et Accessibilite

---

## 5. Tests de securite (S-01 a S-10)

### S-01 : XSS dans les champs de formulaire (MCP: oui)

**Donnees** : `tests/data/invalid/auth.json` → `xss_email`

```
1. navigate_page(url="http://localhost:5173/login")
2. fill(uid=email_field, value="<script>alert('xss')</script>")
3. fill(uid=password_field, value="Test1234!")
4. click(uid=submit_button)
5. take_snapshot()
6. ASSERT: pas d'execution de script
7. evaluate_script(() => document.querySelector('script:not([src])') === null)
8. ASSERT: retourne true (aucun script inline injecte)
9. # Tester aussi dans les formulaires d'articles
10. # Se connecter en deposant, naviguer vers une liste
11. fill(uid=description_field, value="<img src=x onerror=alert(1)>")
12. click(uid=add_article_button)
13. take_snapshot()
14. ASSERT: HTML assaini, pas d'execution
```

### S-02 : Injection SQL via la connexion (MCP: oui)

**Donnees** : `tests/data/invalid/auth.json` → `sql_injection_email`

```
1. navigate_page(url="http://localhost:5173/login")
2. fill(uid=email_field, value="' OR 1=1 --")
3. fill(uid=password_field, value="Test1234!")
4. click(uid=submit_button)
5. take_snapshot()
6. ASSERT: erreur normale (identifiants invalides)
7. ASSERT: pas d'acces non autorise
8. ASSERT: pas de message d'erreur SQL visible dans la page
```

### S-03 : Falsification de token JWT (MCP: partiel)

```
1. # Se connecter normalement
2. navigate_page(url="http://localhost:5173/login")
3. fill(uid=email_field, value="admin@alpe-bourse.fr")
4. fill(uid=password_field, value="Admin123!")
5. click(uid=submit_button)
6. wait_for("Deconnexion")
7. # Modifier le token dans localStorage
8. evaluate_script(() => {
     localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.FALSIFIED.signature');
     return true;
   })
9. navigate_page(type="reload")
10. take_snapshot()
11. ASSERT: deconnecte, redirection vers /login
12. evaluate_script(() => location.pathname)
13. ASSERT: pathname === "/login"
```

### S-04 : Acces a l'API sans token (MCP: partiel)

```
1. # Pas connecte, appeler une API protegee via evaluate_script
2. navigate_page(url="http://localhost:5173/login")
3. evaluate_script(async () => {
     const res = await fetch('http://localhost:8000/api/v1/editions', {
       headers: { 'Authorization': '' }
     });
     return res.status;
   })
4. ASSERT: retourne 401
```

### S-05 : Acces a l'API admin en tant que deposant (MCP: oui)

```
1. # Se connecter en tant que deposant
2. navigate_page(url="http://localhost:5173/login")
3. fill(uid=email_field, value="deposant@example.com")
4. fill(uid=password_field, value="Deposant123!")
5. click(uid=submit_button)
6. wait_for("Deconnexion")
7. # Tenter d'acceder a une page admin
8. navigate_page(url="http://localhost:5173/admin/invitations")
9. take_snapshot()
10. evaluate_script(() => location.pathname)
11. ASSERT: redirection vers /login ou /
12. ASSERT: page admin non accessible
```

### S-06 : Acces aux donnees d'un autre utilisateur (MCP: oui)

```
1. # Se connecter en tant que deposant
2. # Tenter d'acceder a la liste d'un autre deposant
3. navigate_page(url="http://localhost:5173/depositor/lists/99999")
4. take_snapshot()
5. ASSERT: erreur 403 ou 404
6. ASSERT: pas de donnees d'un autre utilisateur visibles
```

### S-07 : Validation CORS (MCP: non)

> Non testable via MCP : necessite une requete depuis une autre origine.
> Alternative : test via curl ou script Python depuis un domaine different.

### S-08 : Token JWT expire (MCP: non)

> Non testable via MCP : necessite d'attendre l'expiration du JWT (8-24h).
> Alternative : test unitaire backend avec token forge expire.

### S-09 : Rejouer un ancien token d'invitation (MCP: partiel)

**Pre-requis** : token d'invitation deja utilise en fixture.

```
1. navigate_page(url="http://localhost:5173/activate?token={used_token}")
2. take_snapshot()
3. ASSERT: erreur ou redirection vers /login
4. ASSERT: token invalide apres utilisation
```

### S-10 : Traversee de chemin dans les endpoints fichier (MCP: non)

> Non testable via MCP : test API pur, mieux adapte a curl/pytest.
> Alternative : `curl http://localhost:8000/api/v1/labels/../../etc/passwd`

---

## 6. Tests de performance et fiabilite (P-01 a P-06)

### P-01 : Temps de chargement des pages (MCP: oui)

```
1. emulate(networkConditions="Fast 3G")
2. navigate_page(url="http://localhost:5173/login")
3. performance_start_trace(reload=true, autoStop=true)
4. # Attendre le resultat
5. ASSERT: temps de chargement < 3 secondes
6. # Tester aussi la page editions
7. navigate_page(url="http://localhost:5173/editions")
8. performance_start_trace(reload=true, autoStop=true)
9. ASSERT: temps de chargement < 3 secondes
10. emulate(networkConditions="No emulation")  # reset
```

### P-02 : Temps de reponse API (MCP: oui)

```
1. # Se connecter
2. navigate_page(url="http://localhost:5173/editions")
3. list_network_requests(resourceTypes=["fetch"])
4. # Pour chaque requete API
5. get_network_request(reqid={editions_request_id})
6. ASSERT: temps de reponse < 500ms
```

### P-03 : Rendu de grands tableaux (MCP: oui)

**Pre-requis** : edition avec 100+ reversements.

```
1. # Se connecter en tant que gestionnaire
2. navigate_page(url="http://localhost:5173/editions/{edition_id}/payouts")
3. performance_start_trace(reload=true, autoStop=true)
4. take_snapshot()
5. ASSERT: tableau affiche sans ralentissement
6. ASSERT: pas de "Long Task" superieure a 200ms dans la trace
```

### P-04 : Rafraichissement automatique des stats (MCP: partiel)

```
1. # Se connecter en tant que benevole
2. navigate_page(url="http://localhost:5173/editions/{edition_id}/stats")
3. take_snapshot()
4. # Attendre 15 secondes pour observer un rafraichissement
5. evaluate_script(() => new Promise(r => setTimeout(r, 15000)))
6. list_network_requests(resourceTypes=["fetch"])
7. ASSERT: au moins 2 requetes vers l'endpoint stats (rafraichissement auto)
8. # Note: fuite memoire non mesurable via MCP
```

### P-05 : Generation PDF 100 etiquettes (MCP: partiel)

**Pre-requis** : edition avec 100 articles valides.

```
1. # Se connecter en tant que gestionnaire
2. navigate_page(url="http://localhost:5173/editions/{edition_id}/labels")
3. click(uid=mode_all_radio)
4. click(uid=generate_labels_button)
5. # Mesurer le temps de reponse
6. list_network_requests(resourceTypes=["fetch"])
7. ASSERT: requete de generation terminee en < 10 secondes
8. ASSERT: pas d'erreur affichee
```

### P-06 : CSV Billetweb 500 lignes (MCP: oui)

```
1. # Se connecter en tant que gestionnaire
2. navigate_page(url="http://localhost:5173/editions/{edition_id}")
3. upload_file(uid=csv_upload_input, filePath="tests/data/valid/billetweb_500.csv")
4. click(uid=confirm_import_button)
5. wait_for("Import termine")
6. take_snapshot()
7. ASSERT: import termine sans timeout
8. list_network_requests(resourceTypes=["fetch"])
9. ASSERT: pas d'erreur 504/timeout
```

---

## 7. Tests d'accessibilite WCAG 2.1 AA (ACC-01 a ACC-10)

### ACC-01 : Navigation au clavier (MCP: oui)

```
1. navigate_page(url="http://localhost:5173/login")
2. # Naviguer avec Tab a travers tous les elements
3. press_key("Tab")
4. take_snapshot()
5. ASSERT: premier element interactif a le focus (email ou skip-link)
6. press_key("Tab")
7. take_snapshot()
8. ASSERT: element suivant a le focus
9. # Continuer Tab jusqu'a couvrir tous les champs
10. press_key("Tab")
11. press_key("Tab")
12. press_key("Tab")
13. take_snapshot()
14. ASSERT: bouton de soumission atteint par Tab
```

### ACC-02 : Lien d'evitement (MCP: oui)

```
1. navigate_page(url="http://localhost:5173/")
2. take_snapshot(verbose=true)
3. ASSERT: lien "Aller au contenu principal" present dans l'arbre a11y
4. press_key("Tab")
5. take_snapshot()
6. ASSERT: lien d'evitement visible au focus
7. press_key("Enter")
8. take_snapshot()
9. ASSERT: focus deplace vers le contenu principal
```

### ACC-03 : Points de repere ARIA (MCP: oui)

```
1. navigate_page(url="http://localhost:5173/")
2. take_snapshot(verbose=true)
3. ASSERT: <nav> present (navigation)
4. ASSERT: <main> present (contenu principal)
5. ASSERT: <header> present (en-tete)
6. # Verifier aussi sur la page de connexion
7. navigate_page(url="http://localhost:5173/login")
8. take_snapshot(verbose=true)
9. ASSERT: landmarks ARIA corrects
```

### ACC-04 : Labels de formulaire (MCP: oui)

```
1. navigate_page(url="http://localhost:5173/login")
2. take_snapshot(verbose=true)
3. ASSERT: champ email a un label ou aria-label
4. ASSERT: champ mot de passe a un label ou aria-label
5. # Verifier aussi sur le formulaire d'invitation
6. # Se connecter en tant que gestionnaire
7. navigate_page(url="http://localhost:5173/admin/invitations")
8. click(uid=new_invitation_button)
9. take_snapshot(verbose=true)
10. ASSERT: tous les champs ont un label associe
```

### ACC-05 : Contraste des couleurs (MCP: non)

> Non testable via MCP : ne peut pas mesurer les ratios de contraste.
> Alternative : utiliser un outil comme axe-core ou Lighthouse en audit manuel.

### ACC-06 : Indicateurs de focus (MCP: partiel)

```
1. navigate_page(url="http://localhost:5173/login")
2. press_key("Tab")
3. take_screenshot()
4. ASSERT: anneau de focus visible sur l'element actif
5. press_key("Tab")
6. take_screenshot()
7. ASSERT: focus visible se deplace correctement
8. # Note: la verification visuelle du style focus est limitee via screenshot
```

### ACC-07 : Annonces d'erreur (MCP: oui)

```
1. navigate_page(url="http://localhost:5173/login")
2. click(uid=submit_button)  # soumettre le formulaire vide
3. take_snapshot(verbose=true)
4. ASSERT: erreurs de formulaire presentes
5. ASSERT: attributs aria-live ou role="alert" sur les messages d'erreur
6. evaluate_script(() => {
     const alerts = document.querySelectorAll('[role="alert"], [aria-live]');
     return alerts.length > 0;
   })
7. ASSERT: retourne true
```

### ACC-08 : Piege de focus dans les modales (MCP: oui)

```
1. # Se connecter en tant qu'admin
2. navigate_page(url="http://localhost:5173/editions")
3. take_snapshot()
4. # Ouvrir une modale (ex: suppression d'edition)
5. click(uid=delete_edition_button)
6. take_snapshot()
7. ASSERT: modale ouverte
8. # Naviguer avec Tab dans la modale
9. press_key("Tab")
10. press_key("Tab")
11. press_key("Tab")
12. press_key("Tab")
13. press_key("Tab")
14. take_snapshot()
15. ASSERT: focus reste confine dans la modale (ne sort pas)
16. # Fermer avec Echap
17. press_key("Escape")
18. take_snapshot()
19. ASSERT: modale fermee, focus revient au declencheur
```

### ACC-09 : En-tetes de tableau (MCP: oui)

```
1. # Se connecter en tant que gestionnaire
2. navigate_page(url="http://localhost:5173/editions")
3. evaluate_script(() => {
     const tables = document.querySelectorAll('table');
     let allHaveHeaders = true;
     tables.forEach(table => {
       const ths = table.querySelectorAll('th');
       if (ths.length === 0) allHaveHeaders = false;
       ths.forEach(th => {
         if (!th.hasAttribute('scope')) allHaveHeaders = false;
       });
     });
     return { tableCount: tables.length, allHaveHeaders };
   })
4. ASSERT: allHaveHeaders === true
5. ASSERT: tableCount > 0
```

### ACC-10 : Menu admin au clavier (MCP: oui)

```
1. # Se connecter en tant qu'admin
2. take_snapshot()
3. # Ouvrir le menu admin via clavier
4. Trouver uid du bouton menu admin
5. click(uid=admin_menu_button)
6. take_snapshot()
7. ASSERT: menu ouvert
8. press_key("ArrowDown")
9. take_snapshot()
10. ASSERT: premier item du menu a le focus
11. press_key("ArrowDown")
12. take_snapshot()
13. ASSERT: deuxieme item du menu a le focus
14. press_key("Escape")
15. take_snapshot()
16. ASSERT: menu ferme
```
