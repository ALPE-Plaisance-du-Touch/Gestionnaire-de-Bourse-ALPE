# Scenarios Visiteur (V-01 a V-E04)

Tous testables via MCP : **oui**

## V-01 : Consulter la politique de confidentialite

```
1. navigate_page(url="http://localhost:5173/privacy")
2. take_snapshot()
3. ASSERT: texte "Politique de confidentialite" present
4. ASSERT: contenu statique affiche (mentions legales, RGPD)
```

## V-02 : Consulter la page d'accueil avec edition active

**Pre-requis** : une edition avec status `in_progress` existe en BDD.

```
1. navigate_page(url="http://localhost:5173/")
2. take_snapshot()
3. ASSERT: texte "ALPE" ou "Association" present (presentation)
4. ASSERT: nom de l'edition active affiche (ex: "Bourse Printemps 2026")
5. ASSERT: dates de vente affichees
6. ASSERT: lieu affiche
7. ASSERT: bouton "Se connecter" visible
```

## V-03 : Consulter la page d'accueil sans edition active

**Pre-requis** : aucune edition avec status actif en BDD (toutes en brouillon/cloturee/archivee).

```
1. navigate_page(url="http://localhost:5173/")
2. take_snapshot()
3. ASSERT: texte "Aucune bourse" present
4. ASSERT: bouton "Se connecter" visible
5. ASSERT: pas de dates de vente affichees
```

## V-04 : Cliquer sur "Se connecter" depuis l'accueil

```
1. navigate_page(url="http://localhost:5173/")
2. take_snapshot()
3. Trouver uid du bouton "Se connecter"
4. click(uid=login_button)
5. wait_for("Connexion")
6. evaluate_script(() => location.pathname)
7. ASSERT: pathname === "/login"
```

## V-05 : Acceder a la politique de confidentialite depuis l'accueil

```
1. navigate_page(url="http://localhost:5173/")
2. take_snapshot()
3. Trouver uid du lien "Politique de confidentialite" (footer ou body)
4. click(uid=privacy_link)
5. wait_for("Politique de confidentialite")
6. evaluate_script(() => location.pathname)
7. ASSERT: pathname === "/privacy"
```

---

## V-E01 : Acceder a une route protegee

```
1. navigate_page(url="http://localhost:5173/editions")
2. wait_for("Connexion")
3. evaluate_script(() => location.pathname)
4. ASSERT: pathname === "/login"
```

## V-E02 : Acceder a la page de connexion

```
1. navigate_page(url="http://localhost:5173/login")
2. take_snapshot()
3. ASSERT: formulaire de connexion present (champs email, password, bouton)
4. ASSERT: pas de redirection (on reste sur /login)
```

## V-E03 : Acceder a une page admin

```
1. navigate_page(url="http://localhost:5173/admin/invitations")
2. wait_for("Connexion")
3. evaluate_script(() => location.pathname)
4. ASSERT: pathname === "/login"
```

## V-E04 : Acceder a une page deposant

```
1. navigate_page(url="http://localhost:5173/lists")
2. wait_for("Connexion")
3. evaluate_script(() => location.pathname)
4. ASSERT: pathname === "/login"
```
