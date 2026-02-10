# Scenarios Authentification (AUTH-01 a AUTH-EC08)

## AUTH-01 : Connexion avec identifiants valides (MCP: oui)

**Donnees** : `tests/data/users/accounts.json` → `admin`

```
1. navigate_page(url="http://localhost:5173/login")
2. take_snapshot()
3. fill(uid=email_field, value="admin@alpe-bourse.fr")
4. fill(uid=password_field, value="Admin123!")
5. click(uid=submit_button)
6. wait_for("Deconnexion")
7. evaluate_script(() => location.pathname)
8. ASSERT: pathname === "/"
9. take_snapshot()
10. ASSERT: nom de l'utilisateur ou indicateur de connexion visible
```

## AUTH-02 : Activer un compte via lien d'invitation (MCP: partiel)

**Pre-requis** : invitation creee pour `inactif@example.com`, token recupere via MailHog.

```
1. # Recuperer le token via MailHog
   new_page(url="http://localhost:8025")
   take_snapshot()
   Trouver le message pour inactif@example.com
   click sur le message
   take_snapshot()
   Extraire le token du lien d'activation
   close_page()

2. navigate_page(url="http://localhost:5173/activate?token={token}")
3. take_snapshot()
4. fill(uid=password_field, value="NouveauMdp1!")
5. fill(uid=confirm_password_field, value="NouveauMdp1!")
6. click(uid=accept_cgu_checkbox)
7. click(uid=submit_button)
8. wait_for("Connexion")
9. evaluate_script(() => location.pathname)
10. ASSERT: pathname === "/login"
11. ASSERT: message de succes visible
```

## AUTH-03 : Demander la reinitialisation du mot de passe (MCP: oui)

```
1. navigate_page(url="http://localhost:5173/forgot-password")
2. take_snapshot()
3. fill(uid=email_field, value="deposant@example.com")
4. click(uid=submit_button)
5. take_snapshot()
6. ASSERT: message de succes ("email envoye" ou similaire)
```

## AUTH-04 : Reinitialiser le mot de passe avec token valide (MCP: partiel)

**Pre-requis** : token de reinitialisation recupere via MailHog.

```
1. # Recuperer le token via MailHog (meme procedure que AUTH-02 step 1)
2. navigate_page(url="http://localhost:5173/reset-password?token={token}")
3. take_snapshot()
4. fill(uid=new_password_field, value="NewPassword1!")
5. fill(uid=confirm_password_field, value="NewPassword1!")
6. click(uid=submit_button)
7. wait_for("Connexion")
8. ASSERT: pathname === "/login"
```

## AUTH-05 : Deconnexion (MCP: oui)

**Pre-requis** : connecte en tant qu'admin.

```
1. # Se connecter d'abord (AUTH-01)
2. take_snapshot()
3. Trouver uid du bouton/lien "Deconnexion"
4. click(uid=logout_button)
5. wait_for("Connexion")
6. evaluate_script(() => location.pathname)
7. ASSERT: pathname === "/login"
```

---

## AUTH-E01 : Connexion avec mauvais mot de passe (MCP: oui)

**Donnees** : `tests/data/invalid/auth.json` → `wrong_password`

```
1. navigate_page(url="http://localhost:5173/login")
2. take_snapshot()
3. fill(uid=email_field, value="admin@alpe-bourse.fr")
4. fill(uid=password_field, value="WrongPassword!")
5. click(uid=submit_button)
6. take_snapshot()
7. ASSERT: message "Identifiants invalides" visible
8. ASSERT: on reste sur /login
```

## AUTH-E02 : Connexion avec email inconnu (MCP: oui)

**Donnees** : `tests/data/invalid/auth.json` → `unknown_email`

```
1. navigate_page(url="http://localhost:5173/login")
2. fill(uid=email_field, value="inconnu@example.com")
3. fill(uid=password_field, value="SomePassword1!")
4. click(uid=submit_button)
5. take_snapshot()
6. ASSERT: message "Identifiants invalides" (meme message que E01, pas d'enumeration)
```

## AUTH-E03 : Connexion avec champs vides (MCP: oui)

```
1. navigate_page(url="http://localhost:5173/login")
2. take_snapshot()
3. click(uid=submit_button)  # soumettre sans remplir
4. take_snapshot()
5. ASSERT: messages de validation visibles (champs requis)
```

## AUTH-E04 : Activation avec token expire (MCP: partiel)

**Pre-requis** : fixture en BDD avec token expire (> 7 jours).

```
1. navigate_page(url="http://localhost:5173/activate?token={expired_token}")
2. take_snapshot()
3. ASSERT: message "Lien expire" ou "Ce lien d'invitation a expire"
```

## AUTH-E05 : Activation avec token invalide (MCP: oui)

**Donnees** : `tests/data/invalid/auth.json` → `invalid_token`

```
1. navigate_page(url="http://localhost:5173/activate?token=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
2. take_snapshot()
3. ASSERT: message "Lien invalide" visible
```

## AUTH-E06 : Activation avec token deja utilise (MCP: partiel)

**Pre-requis** : token d'un compte deja active.

```
1. navigate_page(url="http://localhost:5173/activate?token={used_token}")
2. take_snapshot()
3. ASSERT: redirection vers /login ou message d'erreur
```

## AUTH-E07 : Activation avec mot de passe faible (MCP: partiel)

**Pre-requis** : token valide d'invitation en attente.

```
1. navigate_page(url="http://localhost:5173/activate?token={valid_token}")
2. take_snapshot()
3. fill(uid=password_field, value="123")
4. take_snapshot()
5. ASSERT: indicateur de force rouge visible
6. ASSERT: message d'erreur de validation (trop court, manque chiffre/symbole)
```

## AUTH-E08 : Activation sans accepter les CGU (MCP: partiel)

**Pre-requis** : token valide.

```
1. navigate_page(url="http://localhost:5173/activate?token={valid_token}")
2. fill(uid=password_field, value="StrongPass1!")
3. fill(uid=confirm_password_field, value="StrongPass1!")
4. # NE PAS cocher la case CGU
5. click(uid=submit_button)
6. take_snapshot()
7. ASSERT: validation bloquee, message sur les CGU
```

## AUTH-E09 : Activation avec mots de passe differents (MCP: partiel)

**Donnees** : `tests/data/invalid/auth.json` → `mismatched_passwords`

```
1. navigate_page(url="http://localhost:5173/activate?token={valid_token}")
2. fill(uid=password_field, value="StrongPass1!")
3. fill(uid=confirm_password_field, value="DifferentPass1!")
4. click(uid=submit_button)
5. take_snapshot()
6. ASSERT: erreur "Les mots de passe ne correspondent pas"
```

## AUTH-E10 : Reinitialisation avec token expire (MCP: partiel)

```
1. navigate_page(url="http://localhost:5173/reset-password?token={expired_reset_token}")
2. take_snapshot()
3. ASSERT: message d'erreur (token expire)
```

## AUTH-E11 : Connexion avec compte inactif (MCP: oui)

**Donnees** : `tests/data/users/accounts.json` → `inactive_user`

```
1. navigate_page(url="http://localhost:5173/login")
2. fill(uid=email_field, value="inactif@example.com")
3. fill(uid=password_field, value="AnyPassword1!")
4. click(uid=submit_button)
5. take_snapshot()
6. ASSERT: message d'erreur (compte non active ou identifiants invalides)
```

---

## AUTH-EC01 : Double soumission de connexion (MCP: oui)

```
1. navigate_page(url="http://localhost:5173/login")
2. fill(uid=email_field, value="admin@alpe-bourse.fr")
3. fill(uid=password_field, value="Admin123!")
4. click(uid=submit_button)
5. click(uid=submit_button)  # double clic rapide
6. wait_for("Deconnexion")
7. ASSERT: une seule redirection, pas d'erreur
8. list_network_requests(resourceTypes=["fetch"])
9. ASSERT: pas de requete POST /login dupliquee (ou deuxieme ignoree)
```

## AUTH-EC02 : Mot de passe avec caracteres speciaux (MCP: oui)

**Donnees** : `tests/data/invalid/auth.json` → `special_chars_password`

```
1. # Pre-requis: creer un compte avec ce mot de passe via API
2. navigate_page(url="http://localhost:5173/login")
3. fill(uid=email_field, value="test-special@example.com")
4. fill(uid=password_field, value="P@$$w0rd!#%^")
5. click(uid=submit_button)
6. ASSERT: connexion reussie (pas d'erreur d'encodage)
```

## AUTH-EC03 : Sensibilite a la casse de l'email (MCP: oui)

**Donnees** : `tests/data/invalid/auth.json` → `case_insensitive_email`

```
1. navigate_page(url="http://localhost:5173/login")
2. fill(uid=email_field, value="Admin@ALPE-bourse.FR")
3. fill(uid=password_field, value="Admin123!")
4. click(uid=submit_button)
5. wait_for("Deconnexion")
6. ASSERT: connexion reussie
```

## AUTH-EC04 : XSS dans les champs de connexion (MCP: oui)

**Donnees** : `tests/data/invalid/auth.json` → `xss_email`

```
1. navigate_page(url="http://localhost:5173/login")
2. fill(uid=email_field, value="<script>alert(1)</script>")
3. fill(uid=password_field, value="Test1234!")
4. click(uid=submit_button)
5. take_snapshot()
6. ASSERT: pas d'execution de script (verifier via evaluate_script)
7. evaluate_script(() => document.querySelector('script:not([src])') === null)
8. ASSERT: message d'erreur normal (identifiants invalides ou email invalide)
```

## AUTH-EC05 : Injection SQL dans la connexion (MCP: oui)

**Donnees** : `tests/data/invalid/auth.json` → `sql_injection_email`

```
1. navigate_page(url="http://localhost:5173/login")
2. fill(uid=email_field, value="' OR 1=1 --")
3. fill(uid=password_field, value="Test1234!")
4. click(uid=submit_button)
5. take_snapshot()
6. ASSERT: erreur normale, pas d'acces non autorise
7. ASSERT: pas de message d'erreur SQL visible
```

## AUTH-EC06 : Email tres long (MCP: oui)

**Donnees** : `tests/data/invalid/auth.json` → `long_email`

```
1. navigate_page(url="http://localhost:5173/login")
2. fill(uid=email_field, value="aaa...@example.com")  # 256 chars
3. fill(uid=password_field, value="Test1234!")
4. click(uid=submit_button)
5. take_snapshot()
6. ASSERT: erreur de validation (email trop long ou invalide)
```

## AUTH-EC07 : Session expiree (MCP: non)

> Non testable via MCP : necessite attente de 8-24h pour expiration du JWT.
> Alternative : test unitaire backend ou manipulation du localStorage via evaluate_script.

## AUTH-EC08 : Re-activer un compte deja actif (MCP: partiel)

```
1. # Recuperer un token d'activation d'un utilisateur deja actif (fixture)
2. navigate_page(url="http://localhost:5173/activate?token={active_user_token}")
3. take_snapshot()
4. ASSERT: erreur ou redirection vers /login
```
