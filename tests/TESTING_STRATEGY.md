# Strategie de test - Gestionnaire de Bourse ALPE

Campagne de tests E2E concue pour execution via Claude Code + Chrome DevTools MCP.

**URL de l'application** : `http://localhost:5173` (frontend) / `http://localhost:8000` (API backend)

---

## 1. Cartographie des profils utilisateurs

### 1.1 Roles et permissions

| Role | Code | Permissions | Restrictions |
|------|------|-------------|--------------|
| **Visiteur** | (aucun) | Consulter la politique de confidentialite | Aucun acces aux routes protegees ou d'authentification |
| **Deposant** | `depositor` | Connexion, activation de compte, reinitialisation de mot de passe + declarer des articles, valider des listes, telecharger les etiquettes PDF, consulter les resultats de vente, modifier son profil, exporter/supprimer ses donnees personnelles (RGPD) | Pas d'acces aux pages admin, ne peut pas scanner/vendre, ne peut pas gerer les editions |
| **Benevole** | `volunteer` | Toutes les permissions deposant + scanner des articles, enregistrer des ventes, annuler des ventes (sous 5 min), consulter les statistiques en direct, synchronisation hors-ligne | Ne peut pas configurer les editions, ne peut pas gerer les invitations/reversements |
| **Gestionnaire** | `manager` | Toutes les permissions benevole + configurer les editions, importer le CSV Billetweb, gerer les invitations, generer les etiquettes, calculer/enregistrer les reversements, gerer les ventes (annulation sans limite de temps) | Ne peut pas creer/cloturer/archiver les editions, pas d'acces aux journaux d'audit |
| **Administrateur** | `administrator` | Acces complet : toutes les permissions gestionnaire + creer des editions, cloturer des editions, archiver des editions, consulter les journaux d'audit, gerer les roles utilisateurs | Aucune |

### 1.2 Comptes utilisateurs de test

| Profil | Email | Mot de passe | Role | Etat |
|--------|-------|--------------|------|------|
| Admin | `admin@alpe-bourse.fr` | `Admin123!` | administrator | Actif |
| Gestionnaire | `manager@alpe-bourse.fr` | `Manager123!` | manager | Actif |
| Benevole | `volunteer@alpe-bourse.fr` | `Volunteer123!` | volunteer | Actif |
| Deposant (standard) | `deposant@example.com` | `Deposant123!` | depositor | Actif |
| Deposant (liste 1000) | `adherent@alpe-bourse.fr` | `Adherent123!` | depositor | Actif, resident local |
| Deposant (liste 2000) | `ami-adherent@example.com` | `Ami12345!` | depositor | Actif |
| Utilisateur inactif | `inactif@example.com` | (aucun) | depositor | Inactif, invitation en attente |
| Invitation expiree | `expire@example.com` | (aucun) | depositor | Inactif, token expire |

---

## 2. Cartographie des parcours par profil

### 2.1 Visiteur (non authentifie, sans compte)

#### Parcours nominaux
| ID | Parcours | Entree | Etapes | Sortie |
|----|----------|--------|--------|--------|
| V-01 | Consulter la politique de confidentialite | `/privacy` | Naviguer, lire le contenu | Page statique affichee |
| V-02 | Consulter la page d'accueil avec edition active | `/` | Naviguer vers la racine | Presentation ALPE + edition active affichee (nom, dates, lieu) + bouton "Se connecter" |
| V-03 | Consulter la page d'accueil sans edition active | `/` | Naviguer vers la racine (aucune edition active) | Message "Aucune bourse n'est programmee pour le moment." + bouton "Se connecter" |
| V-04 | Cliquer sur "Se connecter" depuis l'accueil | `/` | Cliquer sur le bouton "Se connecter" | Redirection vers `/login` |
| V-05 | Acceder a la politique de confidentialite depuis l'accueil | `/` | Cliquer sur le lien politique de confidentialite | Navigation vers `/privacy` |

#### Parcours d'erreur
| ID | Parcours | Declencheur | Attendu |
|----|----------|-------------|---------|
| V-E01 | Acceder a une route protegee | Naviguer vers `/editions` | Redirection vers `/login` |
| V-E02 | Acceder a la page de connexion | Naviguer vers `/login` | Formulaire de connexion affiche (page auth publique) |
| V-E03 | Acceder a une page admin | Naviguer vers `/admin/invitations` | Redirection vers `/login` |
| V-E04 | Acceder a une page deposant | Naviguer vers `/lists` | Redirection vers `/login` |

---

### 2.2 Authentification (tous roles, pre-connexion / gestion de compte)

#### Parcours nominaux
| ID | Parcours | Entree | Etapes | Sortie |
|----|----------|--------|--------|--------|
| AUTH-01 | Connexion avec identifiants valides | `/login` | Saisir email + mot de passe, valider | Redirection vers `/` |
| AUTH-02 | Activer un compte via lien d'invitation | `/activate?token=xxx` | Token valide, remplir le formulaire, valider | Redirection vers `/login` avec succes |
| AUTH-03 | Demander la reinitialisation du mot de passe | `/forgot-password` | Saisir email, valider | Message de succes affiche |
| AUTH-04 | Reinitialiser le mot de passe avec token valide | `/reset-password?token=xxx` | Saisir nouveau mot de passe + confirmation, valider | Redirection vers `/login` |
| AUTH-05 | Deconnexion | Toute page authentifiee | Cliquer "Deconnexion" | Redirection vers `/login` |

#### Parcours d'erreur
| ID | Parcours | Declencheur | Attendu |
|----|----------|-------------|---------|
| AUTH-E01 | Connexion avec mauvais mot de passe | Mot de passe invalide | Message d'erreur "Identifiants invalides" |
| AUTH-E02 | Connexion avec email inconnu | Email inconnu | Message d'erreur "Identifiants invalides" (pas d'enumeration) |
| AUTH-E03 | Connexion avec champs vides | Valider formulaire vide | Messages de validation |
| AUTH-E04 | Activation avec token expire | Token > 7 jours | Erreur "Lien expire" |
| AUTH-E05 | Activation avec token invalide | Token aleatoire | Erreur "Lien invalide" |
| AUTH-E06 | Activation avec token deja utilise | Revisiter le lien d'activation | Redirection vers login |
| AUTH-E07 | Activation avec mot de passe faible | "123" | Erreur de validation, indicateur de force rouge |
| AUTH-E08 | Activation sans accepter les CGU | Case non cochee | Validation bloquee |
| AUTH-E09 | Activation avec mots de passe differents | mdp != confirmation | Erreur de validation |
| AUTH-E10 | Reinitialisation avec token expire | Token de reinitialisation expire | Message d'erreur |
| AUTH-E11 | Connexion avec compte inactif | Compte non encore active | Message d'erreur |

#### Cas limites
| ID | Parcours | Scenario | Attendu |
|----|----------|----------|---------|
| AUTH-EC01 | Double soumission de connexion | Cliquer valider deux fois rapidement | Pas de requete dupliquee, redirection unique |
| AUTH-EC02 | Mot de passe avec caracteres speciaux | Mot de passe : `P@$$w0rd!#%^` | Accepte |
| AUTH-EC03 | Sensibilite a la casse de l'email | Connexion avec `Admin@ALPE-bourse.FR` | Fonctionne (insensible a la casse) |
| AUTH-EC04 | XSS dans les champs de connexion | `<script>alert(1)</script>` dans email | Assaini, pas de XSS |
| AUTH-EC05 | Injection SQL dans la connexion | `' OR 1=1 --` | Rejete, pas d'injection |
| AUTH-EC06 | Email tres long | Email de 256 caracteres | Erreur de validation |
| AUTH-EC07 | Session expiree en cours d'utilisation | Token JWT expire en pleine session | Redirection vers `/login` |
| AUTH-EC08 | Re-activer un compte deja actif | Visiter l'URL d'activation d'un utilisateur actif | Erreur ou redirection |

---

### 2.3 Deposant

#### Parcours nominaux
| ID | Parcours | Entree | Etapes | Sortie |
|----|----------|--------|--------|--------|
| D-01 | Consulter la page d'accueil en tant que deposant (edition active) | `/` | Se connecter, naviguer vers l'accueil | Page = bourse en cours (details edition) + liens "Mes listes", "Mon profil" |
| D-01b | Consulter la page d'accueil en tant que deposant (pas d'edition) | `/` | Se connecter (aucune edition active) | Message "Aucune bourse n'est en cours actuellement." |
| D-02 | Consulter mes editions | `/lists` | Se connecter, voir la liste des editions | Editions avec inscription active affichees |
| D-03 | Creer une nouvelle liste | `/depositor/editions/:id/lists` | Cliquer "Nouvelle liste" | Liste creee, redirection vers le detail |
| D-04 | Ajouter un article a la liste | `/depositor/lists/:id` | Remplir categorie, description, prix, certifier, valider | Article ajoute, compteurs mis a jour |
| D-05 | Ajouter un article vetement | `/depositor/lists/:id` | Categorie=vetement, remplir taille/marque/genre | Compteur vetements incremente |
| D-06 | Ajouter un lot | `/depositor/lists/:id` | Cocher "lot", selectionner body/pyjama, quantite=3 | Lot cree, compte comme 1 article |
| D-07 | Modifier un article | `/depositor/lists/:id` | Cliquer modifier, changer le prix, sauvegarder | Article mis a jour |
| D-08 | Supprimer un article | `/depositor/lists/:id` | Cliquer supprimer, confirmer | Article supprime, compteurs decrementes |
| D-09 | Valider la liste | `/depositor/lists/:id` | Tous les articles certifies, cliquer "Valider", accepter la checkbox | Liste validee, articles verrouilles |
| D-10 | Telecharger le PDF de la liste | `/depositor/lists/:id` | Cliquer "Telecharger PDF" | PDF telecharge avec etiquettes |
| D-11 | Modifier son profil | `/profile` | Modifier nom/telephone/adresse, sauvegarder | Profil mis a jour |
| D-12 | Exporter ses donnees personnelles (RGPD) | `/profile` | Cliquer "Exporter mes donnees" | Fichier JSON telecharge |
| D-13 | Supprimer son compte (RGPD) | `/profile` | Cliquer supprimer, confirmer | Compte anonymise |
| D-14 | Creer une deuxieme liste | `/depositor/editions/:id/lists` | Cliquer "Nouvelle liste" a nouveau | Deuxieme liste creee (max 2) |

#### Parcours d'erreur
| ID | Parcours | Declencheur | Attendu |
|----|----------|-------------|---------|
| D-E01 | Ajouter un article sous le prix minimum | Prix = 0.50 | Erreur "Prix minimum 1.00 EUR" |
| D-E02 | Ajouter une poussette au-dessus du prix max | Poussette a 200 EUR | Erreur "Prix maximum 150.00 EUR" |
| D-E03 | Ajouter un 25e article | Liste deja a 24 articles | Erreur "Maximum 24 articles" |
| D-E04 | Ajouter un 13e vetement | 12 vetements deja presents | Erreur "Maximum 12 vetements" |
| D-E05 | Ajouter un article interdit | Categorie = siege_auto | Erreur "Article interdit" |
| D-E06 | Ajouter un 2e manteau | Deja 1 manteau | Erreur "Maximum 1 manteau" |
| D-E07 | Ajouter un lot avec mauvaise sous-categorie | Lot de t-shirts | Erreur "Lots uniquement pour bodys/pyjamas" |
| D-E08 | Valider sans certification | Article non certifie | Bouton de validation desactive |
| D-E09 | Creer une 3e liste | A deja 2 listes | Bouton desactive/masque |
| D-E10 | Ajouter un article apres la date limite | Date limite de declaration depassee | Banniere d'erreur, formulaire desactive |
| D-E11 | Modifier une liste validee | Statut de la liste = validee | Boutons de modification masques |
| D-E12 | Acceder a la liste d'un autre deposant | Modifier l'URL avec un ID de liste etranger | 403 Interdit |
| D-E13 | Supprimer une liste non vide | La liste contient des articles | Bouton supprimer masque |

#### Cas limites
| ID | Parcours | Scenario | Attendu |
|----|----------|----------|---------|
| D-EC01 | Description d'article longueur max | Description de 100 caracteres | Acceptee |
| D-EC02 | Description d'article 101 caracteres | | Tronquee/erreur |
| D-EC03 | Prix avec 3 decimales | 5.999 | Arrondi a 6.00 ou rejete |
| D-EC04 | Description vide | "" | Erreur de validation |
| D-EC05 | Quantite de lot = 0 | lot_quantity=0 | Erreur de validation |
| D-EC06 | Caracteres speciaux dans la description | "T-shirt bebe 'Zara' (3 mois)" | Acceptee |
| D-EC07 | Validation concurrente de liste | Soumettre deux fois rapidement | Seule une validation reussit |
| D-EC08 | Navigation pendant la sauvegarde | Fermer l'onglet pendant la sauvegarde | Pas de donnees partielles enregistrees |

---

### 2.4 Benevole

#### Parcours nominaux
| ID | Parcours | Entree | Etapes | Sortie |
|----|----------|--------|--------|--------|
| B-01 | Scanner un QR code d'article | `/editions/:id/sales` | Scanner le code-barres avec la camera | Details de l'article affiches |
| B-02 | Enregistrer une vente en especes | `/editions/:id/sales` | Scanner, selectionner "Especes", confirmer | Vente enregistree, ventes recentes mises a jour |
| B-03 | Enregistrer une vente par carte | `/editions/:id/sales` | Scanner, selectionner "CB", confirmer | Vente enregistree |
| B-04 | Enregistrer une vente par cheque | `/editions/:id/sales` | Scanner, selectionner "Cheque", confirmer | Vente enregistree |
| B-05 | Annuler une vente recente | `/editions/:id/sales` | Cliquer annuler sur une vente recente (< 5 min) | Vente annulee, article remis en vente |
| B-06 | Saisie manuelle du code-barres | `/editions/:id/sales` | Saisir le code-barres dans le champ texte | Article trouve et affiche |
| B-07 | Consulter les statistiques en direct | `/editions/:id/stats` | Naviguer vers la page de stats | Statistiques temps reel avec rafraichissement auto |
| B-08 | Detection de vente privee | `/editions/:id/sales` | Vente le vendredi 17h-18h | Vente marquee comme privee |

#### Parcours d'erreur
| ID | Parcours | Declencheur | Attendu |
|----|----------|-------------|---------|
| B-E01 | Scanner un code-barres inconnu | Code-barres invalide | Erreur "Article non trouve" |
| B-E02 | Scanner un article deja vendu | Statut de l'article = vendu | Erreur "Article deja vendu" |
| B-E03 | Annuler une vente apres 5 min | Vente > 5 min | Bouton annuler masque/desactive |
| B-E04 | Scanner sans edition ouverte | Edition pas en cours | Message d'erreur |
| B-E05 | Format de code-barres invalide | "ABC" au lieu de "012305" | Avertissement "Format invalide" |

#### Cas limites
| ID | Parcours | Scenario | Attendu |
|----|----------|----------|---------|
| B-EC01 | Scans consecutifs rapides | Scanner 5 articles en 10 secondes | Tous traites sequentiellement |
| B-EC02 | Vente hors-ligne | Reseau deconnecte | Vente mise en file d'attente, synchronisee ensuite |
| B-EC03 | Conflit de synchronisation hors-ligne | Vente hors-ligne pour article deja vendu | Conflit signale lors de la synchronisation |
| B-EC04 | Permission camera refusee | Scanner QR refuse | Mode de saisie manuelle affiche |
| B-EC05 | Attribution de numero de caisse | Plusieurs caisses | Chaque vente etiquetee avec le numero de caisse |

---

### 2.5 Gestionnaire

#### Parcours nominaux
| ID | Parcours | Entree | Etapes | Sortie |
|----|----------|--------|--------|--------|
| G-01 | Consulter la liste des editions | `/editions` | Se connecter en tant que gestionnaire | Tableau des editions affiche |
| G-02 | Configurer les dates d'edition | `/editions/:id` | Modifier dates operationnelles, commission, sauvegarder | Edition configuree, statut = configure |
| G-03 | Creer des creneaux de depot | `/editions/:id` | Ajouter des creneaux avec capacite/horaires | Creneaux listes |
| G-04 | Importer le CSV Billetweb | `/editions/:id` | Charger le CSV, previsualiser, confirmer l'import | Deposants importes, invitations envoyees |
| G-05 | Consulter les deposants d'une edition | `/editions/:id/depositors` | Naviguer depuis le detail de l'edition | Liste des deposants avec filtres |
| G-06 | Creer une invitation individuelle | `/admin/invitations` | Cliquer "Nouvelle invitation", remplir le formulaire | Invitation creee, email envoye |
| G-07 | Creer des invitations en masse | `/admin/invitations` | Cliquer "En masse", charger le CSV | Invitations multiples creees |
| G-08 | Relancer une invitation | `/admin/invitations` | Cliquer "Relancer" sur une invitation en attente | Nouveau token genere, email renvoye |
| G-09 | Relancer des invitations en masse | `/admin/invitations` | Selectionner plusieurs, cliquer "Relancer la selection" | Toutes relancees |
| G-10 | Supprimer une invitation | `/admin/invitations` | Cliquer supprimer, confirmer | Invitation supprimee |
| G-11 | Supprimer des invitations en masse | `/admin/invitations` | Selectionner plusieurs, cliquer "Supprimer la selection" | Toutes supprimees |
| G-12 | Exporter les invitations en Excel | `/admin/invitations/stats` | Cliquer "Exporter Excel" | Fichier Excel telecharge |
| G-13 | Generer les etiquettes (par creneau) | `/editions/:id/labels` | Selectionner le mode creneau, choisir le creneau, generer | PDF telecharge |
| G-14 | Generer les etiquettes (toutes) | `/editions/:id/labels` | Selectionner le mode complet, generer | PDF telecharge |
| G-15 | Generer les etiquettes (selection) | `/editions/:id/labels` | Selectionner des deposants, generer | PDF telecharge |
| G-16 | Calculer les reversements | `/editions/:id/payouts` | Cliquer "Calculer les reversements" | Reversements calcules pour tous les deposants |
| G-17 | Enregistrer un paiement (especes) | `/editions/:id/payouts` | Cliquer "Payer" sur un reversement, selectionner especes | Reversement marque comme paye |
| G-18 | Enregistrer un paiement (cheque) | `/editions/:id/payouts` | Cliquer "Payer", selectionner cheque, saisir la reference | Paiement enregistre avec reference |
| G-19 | Telecharger un bordereau de reversement | `/editions/:id/payouts` | Cliquer sur l'icone PDF d'une ligne | Bordereau PDF telecharge |
| G-20 | Telecharger tous les bordereaux | `/editions/:id/payouts` | Cliquer "Tous les bordereaux" | PDF groupe telecharge |
| G-21 | Exporter les reversements en Excel | `/editions/:id/payouts` | Cliquer "Exporter Excel" | Excel telecharge |
| G-22 | Envoyer un rappel de reversement | `/editions/:id/payouts` | Cliquer relancer sur un deposant absent | Email envoye |
| G-23 | Relancer tous les absents | `/editions/:id/payouts` | Cliquer "Relancer tous les absents" | Emails mis en file d'attente |
| G-24 | Consulter le tableau de bord des reversements | `/editions/:id/payouts/dashboard` | Naviguer depuis la page de reversements | Graphiques et statistiques affiches |
| G-25 | Consulter les statistiques d'invitations | `/admin/invitations/stats` | Naviguer depuis la page d'invitations | Page de stats avec graphiques |
| G-26 | Annuler une vente (droit gestionnaire) | `/editions/:id/sales/manage` | Cliquer "Annuler" sur n'importe quelle vente (sans limite de temps) | Vente annulee |
| G-27 | Filtrer les invitations par statut | `/admin/invitations` | Selectionner le filtre "Expirees" | Seules les invitations expirees affichees |
| G-28 | Filtrer les reversements par statut | `/editions/:id/payouts` | Selectionner le filtre "Paye" | Seuls les reversements payes affiches |
| G-29 | Rechercher un reversement par nom | `/editions/:id/payouts` | Saisir le nom du deposant dans la recherche | Resultats filtres |
| G-30 | Envoyer un rappel de date limite | `/editions/:id` | Cliquer "Envoyer un rappel" | Emails mis en file d'attente pour les deposants |

#### Parcours d'erreur
| ID | Parcours | Declencheur | Attendu |
|----|----------|-------------|---------|
| G-E01 | Importer un CSV invalide | Fichier CSV malforme | Apercu affiche les erreurs, import bloque |
| G-E02 | Importer un CSV avec inscriptions non payees | Inscriptions Billetweb sans paiement | Inscriptions ignorees, total affiche |
| G-E03 | Creer une invitation en doublon | Meme email qu'une invitation existante | Erreur "Email deja invite" |
| G-E04 | Configurer des dates invalides | Date de fin avant date de debut | Erreur de validation |
| G-E05 | Creer des creneaux qui se chevauchent | Meme plage horaire qu'un creneau existant | Erreur "Creneaux se chevauchent" |
| G-E06 | Enregistrer un paiement deux fois | Cliquer payer sur un reversement deja paye | Bouton desactive/masque |
| G-E07 | Gestionnaire tente de creer une edition | Naviguer vers la creation d'edition | Bouton masque (admin uniquement) |
| G-E08 | Gestionnaire tente de cloturer une edition | Pas de bouton de cloture visible | Bouton masque (admin uniquement) |
| G-E09 | Gestionnaire tente de voir les journaux d'audit | Naviguer vers `/admin/audit-logs` | 403 ou route non affichee |

#### Cas limites
| ID | Parcours | Scenario | Attendu |
|----|----------|----------|---------|
| G-EC01 | Import d'un CSV de 500 lignes | Grand export Billetweb | Tous traites, progression affichee |
| G-EC02 | Taux de commission a 0% | Commission fixee a 0 | Net = Brut pour tous les reversements |
| G-EC03 | Taux de commission a 100% | Commission fixee a 1 | Net = 0 pour tous les reversements |
| G-EC04 | Recalcul apres annulation de vente | Reversement calcule, puis vente annulee | Le recalcul affiche un montant inferieur |
| G-EC05 | Etiquettes pour deposant sans liste validee | Selectionner le deposant, generer | Ignore ou erreur |
| G-EC06 | Relance en masse avec statuts mixtes | Selectionner activees + en attente | Seules les en attente/expirees sont relancees, les activees sont ignorees |

---

### 2.6 Administrateur

#### Parcours nominaux
| ID | Parcours | Entree | Etapes | Sortie |
|----|----------|--------|--------|--------|
| A-01 | Creer une nouvelle edition | `/editions` | Cliquer "Nouvelle edition", remplir nom/dates, valider | Edition creee, statut = brouillon |
| A-02 | Supprimer une edition brouillon | `/editions` | Cliquer supprimer sur une edition brouillon, confirmer | Edition supprimee |
| A-03 | Cloturer une edition | `/editions/:id` | Verifier les prerequis de cloture, cliquer "Cloturer", confirmer | Edition cloturee, reversements finalises |
| A-04 | Archiver une edition | `/editions` | Cliquer "Archiver" sur une edition cloturee, confirmer | Edition archivee |
| A-05 | Consulter les journaux d'audit | `/admin/audit-logs` | Naviguer vers les journaux d'audit | Piste d'audit complete affichee |
| A-06 | Filtrer les journaux d'audit | `/admin/audit-logs` | Filtrer par action/utilisateur/date | Resultats filtres |
| A-07 | Telecharger le rapport de cloture | `/editions/:id` | Cliquer "Rapport de cloture" sur une edition cloturee | Rapport PDF telecharge |
| A-08 | Consulter la page d'accueil en tant qu'admin (edition active) | `/` | Se connecter en tant qu'admin | Page = bourse en cours + liens gestionnaire + "Cloturer l'edition" |
| A-09 | Consulter la page d'accueil en tant qu'admin (pas d'edition) | `/` | Se connecter (aucune edition active) | Message "Aucune bourse n'est en cours" + lien "Creer une nouvelle edition" |

#### Parcours d'erreur
| ID | Parcours | Declencheur | Attendu |
|----|----------|-------------|---------|
| A-E01 | Cloturer une edition sans reversements | Prerequis manquant | Verification de cloture echoue, raisons listees |
| A-E02 | Supprimer une edition non brouillon | Edition en cours | Bouton supprimer masque |
| A-E03 | Creer une edition avec un nom en doublon | Meme nom qu'une edition existante | Erreur "Nom deja utilise" |
| A-E04 | Archiver une edition non cloturee | Edition en cours | Bouton archiver masque |
| A-E05 | Cloturer avec des reversements non payes | Reversements pas tous payes | Avertissement dans la verification de cloture |
| A-E06 | Activer une 2e edition alors qu'une est deja active | Edition deja active existe | Erreur "Une bourse est deja en cours ([nom]). Cloturez-la avant d'en activer une autre." |

#### Cas limites
| ID | Parcours | Scenario | Attendu |
|----|----------|----------|---------|
| A-EC01 | Archiver une edition cloturee > 1 an | Ancienne edition cloturee | Badge "A archiver" affiche |
| A-EC02 | Consulter une edition archivee | Filtrer par "Archive" | Edition visible, lecture seule |
| A-EC03 | Cloture avec 0 vente | Edition sans aucune vente | Cloture autorisee (0 reversements) |

---

## 3. Parcours de workflows multi-etapes

### W-01 : Cycle de vie complet du deposant
```
Admin cree edition → Gestionnaire configure les dates → Gestionnaire importe Billetweb →
Deposant active son compte → Deposant cree une liste → Deposant ajoute des articles →
Deposant valide la liste → Gestionnaire genere les etiquettes → Benevole scanne/vend →
Gestionnaire calcule les reversements → Gestionnaire enregistre le paiement → Admin cloture l'edition
```

### W-02 : Invitation → Activation → Declaration
```
Gestionnaire cree l'invitation → Email envoye → Deposant clique le lien →
Token valide → Compte active → Connexion → Consultation des editions →
Creation de liste → Ajout d'articles → Validation de la liste → Telechargement du PDF
```

### W-03 : Vente → Annulation → Revente
```
Benevole scanne l'article → Enregistre la vente (especes) → Annule sous 5 min →
Article remis en vente → Benevole re-scanne → Enregistre une nouvelle vente (carte)
```

### W-04 : Calcul des reversements → Paiement
```
Gestionnaire calcule les reversements → Consulte le tableau de bord → Enregistre un paiement especes →
Marque un deposant absent → Envoie un email de rappel → Le deposant revient →
Enregistre un paiement par cheque → Tous les reversements payes → Admin cloture l'edition
```

### W-05 : Import Billetweb → Etiquettes → Ventes
```
Gestionnaire charge le CSV → Apercu de validation → Import confirme →
Deposants invites → Deposants activent + declarent →
Gestionnaire genere les etiquettes (par creneau) → Jour de l'evenement → Benevole scanne/vend
```

### W-06 : Workflow de ventes hors-ligne
```
Reseau deconnecte → Benevole enregistre des ventes hors-ligne →
Reseau retabli → Ventes synchronisees → Conflits resolus →
Statistiques mises a jour en temps reel
```

### W-07 : Cycle RGPD complet
```
Deposant se connecte → Modifie son profil → Exporte toutes ses donnees (telechargement JSON) →
Decide de supprimer → Confirme la suppression → Compte anonymise →
La connexion ne fonctionne plus → Donnees retirees des listes actives
```

---

## 4. Matrice de couverture

### 4.1 Fonctionnalites x Roles

| Fonctionnalite | Visiteur | Auth | Deposant | Benevole | Gestionnaire | Admin |
|----------------|----------|------|----------|----------|--------------|-------|
| Page d'accueil | V-02 a V-05 | - | D-01, D-01b | - | - | A-08, A-09 |
| Consulter la politique de confidentialite | V-01 | - | - | - | - | - |
| Connexion | - | AUTH-01 | - | - | - | - |
| Activation de compte | - | AUTH-02 | - | - | - | - |
| Reinitialisation du mot de passe | - | AUTH-03, AUTH-04 | - | - | - | - |
| Deconnexion | - | AUTH-05 | - | - | - | - |
| Consulter mes editions | - | - | D-02 | - | - | - |
| Creer une liste | - | - | D-03, D-14 | - | - | - |
| Ajouter un article | - | - | D-04 a D-07 | - | - | - |
| Valider une liste | - | - | D-09 | - | - | - |
| Telecharger le PDF | - | - | D-10 | - | - | - |
| Modifier le profil | - | - | D-11 | - | - | - |
| Export RGPD | - | - | D-12 | - | - | - |
| Suppression RGPD | - | - | D-13 | - | - | - |
| Scanner un article | - | - | - | B-01, B-06 | - | - |
| Enregistrer une vente | - | - | - | B-02 a B-04 | - | - |
| Annuler une vente (5 min) | - | - | - | B-05 | - | - |
| Stats en direct | - | - | - | B-07 | - | - |
| Consulter la liste des editions | - | - | - | - | G-01 | G-01 |
| Configurer une edition | - | - | - | - | G-02, G-03 | G-02 |
| Importer Billetweb | - | - | - | - | G-04 | G-04 |
| Gerer les invitations | - | - | - | - | G-06 a G-12 | G-06 |
| Generer les etiquettes | - | - | - | - | G-13 a G-15 | G-13 |
| Calculer les reversements | - | - | - | - | G-16 | G-16 |
| Enregistrer un paiement | - | - | - | - | G-17, G-18 | G-17 |
| Bordereaux de reversement | - | - | - | - | G-19 a G-21 | G-19 |
| Rappels de reversement | - | - | - | - | G-22, G-23 | G-22 |
| Annuler une vente (gestionnaire) | - | - | - | - | G-26 | G-26 |
| Creer une edition | - | - | - | - | - | A-01 |
| Supprimer une edition | - | - | - | - | - | A-02 |
| Cloturer une edition | - | - | - | - | - | A-03 |
| Archiver une edition | - | - | - | - | - | A-04 |
| Consulter les journaux d'audit | - | - | - | - | - | A-05, A-06 |
| Rapport de cloture | - | - | - | - | - | A-07 |
| Contrainte edition unique | - | - | - | - | - | A-E06 |

### 4.2 Couverture par type de test

| Type de test | IDs | Nombre |
|--------------|-----|--------|
| Parcours nominaux | V-01 a V-05, AUTH-01 a AUTH-05, D-01 a A-09 | 76 |
| Parcours d'erreur | V-E01 a V-E04, AUTH-E01 a AUTH-E11, D-E01 a A-E06 | 48 |
| Cas limites | AUTH-EC01 a AUTH-EC08, D-EC01 a A-EC03 | 30 |
| Workflows | W-01 a W-07 | 7 |
| **Total** | | **161** |

### 4.3 Couverture par page

| Page | Nominaux | Erreur | Cas limites | Workflows |
|------|----------|--------|-------------|-----------|
| `/login` | AUTH-01 | AUTH-E01 a E03, E11 | AUTH-EC01 a EC06 | W-02 |
| `/activate` | AUTH-02 | AUTH-E04 a E09 | AUTH-EC08 | W-02 |
| `/forgot-password` | AUTH-03 | - | - | - |
| `/reset-password` | AUTH-04 | AUTH-E10 | - | - |
| `/` | V-02 a V-05, D-01, D-01b, A-08, A-09 | A-E06 | - | - |
| `/privacy` | V-01 | - | - | - |
| `/lists` | D-02 | - | - | W-01, W-02 |
| `/depositor/editions/:id/lists` | D-03, D-14 | D-E09, E10 | - | W-01, W-02 |
| `/depositor/lists/:id` | D-04 a D-10 | D-E01 a E13 | D-EC01 a EC08 | W-01, W-02 |
| `/profile` | D-11 a D-13 | - | - | W-07 |
| `/editions` | G-01 | - | - | W-01 |
| `/editions/:id` | G-02 a G-04, G-30 | G-E04, E05 | - | W-01, W-05 |
| `/editions/:id/depositors` | G-05 | - | - | W-05 |
| `/editions/:id/labels` | G-13 a G-15 | - | G-EC05 | W-05 |
| `/editions/:id/sales` | B-01 a B-08 | B-E01 a E05 | B-EC01 a EC05 | W-03, W-06 |
| `/editions/:id/sales/manage` | G-26 | - | - | - |
| `/editions/:id/stats` | B-07 | - | - | - |
| `/editions/:id/payouts` | G-16 a G-23, G-28, G-29 | G-E06 | G-EC02 a EC04 | W-04 |
| `/editions/:id/payouts/dashboard` | G-24 | - | - | W-04 |
| `/admin/invitations` | G-06 a G-12, G-27 | G-E03 | G-EC06 | W-02 |
| `/admin/invitations/stats` | G-25, G-12 | - | - | - |
| `/admin/audit-logs` | A-05, A-06 | G-E09 | - | - |

---

## 5. Tests de securite

| ID | Test | Attendu |
|----|------|---------|
| S-01 | XSS dans les champs de formulaire | Toutes les saisies assainies, aucune execution de script |
| S-02 | Injection SQL via la connexion | Rejete par les requetes parametrees |
| S-03 | Falsification de token JWT | Token invalide → 401 |
| S-04 | Acces a l'API sans token | 401 Non autorise |
| S-05 | Acces a l'API admin en tant que deposant | 403 Interdit |
| S-06 | Acces aux donnees d'un autre utilisateur | 403 ou 404 |
| S-07 | Validation CORS | Seules les origines autorisees acceptees |
| S-08 | Token JWT expire | 401, redirection vers login |
| S-09 | Rejouer un ancien token d'invitation | Token invalide apres utilisation |
| S-10 | Traversee de chemin dans les endpoints fichier | Bloquee |

---

## 6. Tests de performance et fiabilite

| ID | Test | Critere |
|----|------|---------|
| P-01 | Temps de chargement des pages | < 3 secondes en Fast 3G |
| P-02 | Temps de reponse API | < 500ms pour les requetes standards |
| P-03 | Rendu de grands tableaux | 100+ lignes dans le tableau de reversements, pas de ralentissement |
| P-04 | Rafraichissement automatique (stats en direct) | Mise a jour toutes les 10s sans fuite memoire |
| P-05 | Generation PDF (100 etiquettes) | < 10 secondes |
| P-06 | CSV Billetweb (500 lignes) | Import termine sans timeout |

---

## 7. Tests d'accessibilite (WCAG 2.1 AA)

| ID | Test | Critere |
|----|------|---------|
| ACC-01 | Navigation au clavier | Tous les elements interactifs atteignables via Tab |
| ACC-02 | Lien d'evitement | Present et fonctionnel sur chaque page |
| ACC-03 | Points de repere ARIA | `<nav>`, `<main>`, `<header>` correctement etiquetes |
| ACC-04 | Labels de formulaire | Toutes les saisies ont un `<label>` associe ou un `aria-label` |
| ACC-05 | Contraste des couleurs | 4.5:1 minimum pour le texte normal, 3:1 pour le texte large |
| ACC-06 | Indicateurs de focus | Anneau de focus visible sur tous les elements interactifs |
| ACC-07 | Annonces d'erreur | Erreurs de formulaire annoncees aux lecteurs d'ecran |
| ACC-08 | Piege de focus dans les modales | Focus confine dans les modales ouvertes |
| ACC-09 | En-tetes de tableau | Tous les tableaux de donnees ont des `<th>` avec `scope` |
| ACC-10 | Menu admin au clavier | Navigation FlecheHaut/Bas, Echap pour fermer |
