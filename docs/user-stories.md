---
id: DOC-030-US
title: User Stories
status: draft
version: 0.2.0
updated: 2025-11-05
owner: ALPE Plaisance du Touch
links: []
---

# Gabarit d’une user story

```yaml
id: US-001
title: Déposer des articles
actor: deposant | benevole | admin
benefit: "…pour …"
as_a: "En tant que …"
i_want: "Je veux …"
so_that: "Afin de …"
acceptance_criteria:
  - GIVEN … WHEN … THEN …
dependencies: [US-xxx]
links:
  - rel: requirement
    id: REQ-F-001
``` 

## US-001 — Activer un compte déposant invité

```yaml
id: US-001
title: Activer un compte déposant invité
actor: deposant
benefit: "...pour préparer et suivre mes dépôts sans monopoliser les bénévoles"
as_a: "En tant que particulier invité par l'équipe ALPE"
i_want: "Je veux activer le compte lié à mon invitation et définir mes accès"
so_that: "Afin de déclarer mes articles, obtenir mes étiquettes et suivre mes ventes"

# Contexte métier
notes: |
  - L'invitation est émise par un bénévole autorisé (voir US-XXX à créer)
  - L'email d'invitation contient un lien unique avec token sécurisé
  - Le lien est valide 7 jours calendaires après émission
  - L'email d'invitation devient l'identifiant de connexion du déposant

acceptance_criteria:
  # AC-1 : Affichage du formulaire d'activation
  - GIVEN j'ai reçu un email d'invitation contenant un lien unique avec token valide (< 7 jours)
    WHEN je clique sur le lien d'activation
    THEN le système affiche un formulaire d'activation contenant :
      • Champ "Mot de passe" avec indicateur visuel de force (faible/moyen/fort)
      • Champ "Confirmation du mot de passe"
      • Champs "Nom" et "Prénom" (pré-remplis si disponibles dans l'invitation)
      • Champ "Téléphone" (format français avec validation)
      • Case à cocher "J'accepte les Conditions Générales d'Utilisation" (avec lien vers CGU)
      • Case à cocher "Je consens au traitement de mes données personnelles conformément au RGPD" (avec lien vers politique de confidentialité)
      • Bouton "Activer mon compte"
    AND le formulaire est responsive et accessible (WCAG 2.1 AA)

  # AC-2 : Validation du mot de passe conforme
  - GIVEN je saisis un mot de passe respectant le format requis :
      • Au moins 8 caractères
      • Au moins une lettre minuscule ou majuscule [a-zA-Z]
      • Au moins un chiffre [0-9]
      • Au moins un symbole parmi !@#$%^&*_-
    AND je saisis la même valeur dans "Confirmation du mot de passe"
    WHEN je quitte le champ mot de passe
    THEN l'indicateur de force affiche "Fort" en vert
    AND aucun message d'erreur n'est affiché

  # AC-3 : Erreur - mot de passe non conforme
  - GIVEN je saisis un mot de passe ne respectant PAS le format requis (ex: moins de 8 caractères, absence de chiffre)
    WHEN je quitte le champ ou tente de soumettre le formulaire
    THEN le système affiche sous le champ un message d'erreur rouge et explicite :
      "Votre mot de passe doit contenir au moins 8 caractères, une lettre, un chiffre et un symbole (!@#$%^&*_-)"
    AND le bouton "Activer mon compte" reste actif mais la soumission est bloquée
    AND le champ mot de passe est mis en évidence (bordure rouge)

  # AC-4 : Erreur - confirmation mot de passe différente
  - GIVEN je saisis un mot de passe valide
    AND je saisis une valeur différente dans "Confirmation du mot de passe"
    WHEN je quitte le champ de confirmation
    THEN le système affiche un message d'erreur : "Les deux mots de passe ne correspondent pas"
    AND la soumission est bloquée jusqu'à correction

  # AC-5 : Activation réussie du compte
  - GIVEN j'ai saisi un mot de passe valide et confirmé
    AND j'ai rempli tous les champs obligatoires (nom, prénom, téléphone valide)
    AND j'ai coché les deux cases CGU et RGPD
    WHEN je clique sur "Activer mon compte"
    THEN le système :
      • Active mon compte déposant dans la base de données (statut = "actif")
      • Invalide définitivement le token d'invitation (usage unique)
      • Me connecte automatiquement (session créée)
      • Me redirige vers mon espace déposant avec un message de bienvenue :
        "Bienvenue [Prénom] ! Votre compte est activé. Vous pouvez maintenant déclarer vos articles."
    AND le traitement complet s'effectue en moins de 3 secondes (conforme REQ-NF-002)

  # AC-6 : Confirmation par email
  - GIVEN mon compte vient d'être activé avec succès
    WHEN le système a terminé l'activation
    THEN je reçois dans les 5 minutes un email de confirmation contenant :
      • Confirmation de l'activation du compte
      • Rappel de mon identifiant de connexion (email)
      • Lien vers mon espace déposant
      • Lien vers la FAQ et contact support bénévoles

  # AC-7 : Erreur - champs obligatoires manquants
  - GIVEN je n'ai pas rempli un ou plusieurs champs obligatoires (nom, prénom, téléphone)
    OR je n'ai pas coché les cases CGU/RGPD
    WHEN je tente de soumettre le formulaire
    THEN le système affiche des messages d'erreur sous chaque champ incomplet : "Ce champ est obligatoire"
    AND le formulaire reste affiché avec les données déjà saisies
    AND la page défile automatiquement vers le premier champ en erreur

  # AC-8 : Erreur - téléphone invalide
  - GIVEN je saisis un numéro de téléphone ne respectant pas le format français (ex: lettres, trop court)
    WHEN je quitte le champ ou tente de soumettre
    THEN le système affiche : "Veuillez saisir un numéro de téléphone valide (ex: 06 12 34 56 78)"
    AND le champ est mis en évidence

  # AC-9 : Erreur - lien d'invitation expiré
  - GIVEN mon lien d'invitation a été généré il y a plus de 7 jours
    WHEN j'essaie d'accéder au lien d'activation
    THEN le système affiche une page d'erreur dédiée avec :
      • Message principal : "Ce lien d'invitation a expiré"
      • Explication : "Les liens d'activation sont valides 7 jours"
      • Instructions : "Contactez les bénévoles ALPE pour recevoir une nouvelle invitation"
      • Email de contact visible : benevoles@alpe-plaisance.org
      • Bouton "Retour à l'accueil"
    AND le système log cette tentative avec timestamp et token pour audit

  # AC-10 : Erreur - lien d'invitation déjà utilisé
  - GIVEN mon lien d'invitation a déjà été utilisé pour activer un compte
    WHEN j'essaie d'accéder au lien d'activation
    THEN le système affiche une page d'erreur dédiée avec :
      • Message principal : "Ce lien a déjà été utilisé"
      • Instructions : "Si vous avez oublié votre mot de passe, utilisez la fonction 'Mot de passe oublié'"
      • Lien vers la page de connexion
      • Email de contact pour assistance : benevoles@alpe-plaisance.org
    AND le système log cette tentative avec timestamp et token pour audit

  # AC-11 : Erreur - lien d'invitation invalide (token corrompu)
  - GIVEN je tente d'accéder à un lien avec un token invalide (modifié, corrompu, inexistant)
    WHEN j'essaie d'y accéder
    THEN le système affiche une page d'erreur 404 avec :
      • Message : "Ce lien d'invitation n'est pas valide"
      • Instructions : "Vérifiez que vous avez copié le lien complet depuis votre email d'invitation"
      • Email de contact pour assistance
    AND le système log cette tentative pour sécurité (détection d'attaque potentielle)

  # AC-12 : Erreur - problème serveur/réseau
  - GIVEN je soumets le formulaire d'activation valide
    AND le serveur rencontre une erreur technique (base de données indisponible, timeout)
    WHEN la requête échoue
    THEN le système affiche un message d'erreur générique :
      "Une erreur technique est survenue. Veuillez réessayer dans quelques instants."
    AND le formulaire reste affiché avec mes données pré-remplies
    AND un bouton "Réessayer" est disponible
    AND l'erreur est loggée côté serveur avec détails techniques pour investigation

  # AC-13 : Sécurité - rate limiting
  - GIVEN j'ai effectué 5 tentatives d'activation échouées sur le même lien en moins de 10 minutes
    WHEN je tente une 6ème soumission
    THEN le système bloque temporairement l'accès pendant 15 minutes
    AND affiche : "Trop de tentatives. Veuillez réessayer dans 15 minutes ou contacter les bénévoles."

  # AC-14 : Accessibilité
  - GIVEN je navigue au clavier (touches Tab/Entrée) ou avec un lecteur d'écran
    WHEN j'utilise le formulaire d'activation
    THEN tous les champs sont accessibles dans un ordre logique
    AND les messages d'erreur sont annoncés par le lecteur d'écran
    AND les labels sont correctement associés aux champs (attributs aria-label, role)
    AND le contraste des textes respecte WCAG 2.1 AA (ratio ≥ 4.5:1)

dependencies:
  - US-XXX  # À créer : "Émettre une invitation déposant" (bénévole)

links:
  - rel: requirement
    id: REQ-F-001  # Création de compte déposant
  - rel: requirement
    id: REQ-NF-003  # Conformité RGPD
  - rel: requirement
    id: REQ-NF-004  # Accessibilité WCAG 2.1 AA
  - rel: requirement
    id: REQ-F-00X  # TODO : créer exigence pour émission d'invitations

# Règles métier complémentaires
business_rules:
  - Un token d'invitation est à usage unique et ne peut être réutilisé
  - La durée de validité d'une invitation est de 7 jours calendaires
  - L'email d'invitation devient l'identifiant unique de connexion
  - Le mot de passe est hashé avec bcrypt (coût factor 12) avant stockage
  - Les tentatives d'activation sont limitées à 5 par tranche de 10 minutes par IP

# Critères de performance
performance:
  - Affichage du formulaire : < 2 secondes
  - Validation côté client (mot de passe) : instantanée (< 100ms)
  - Traitement activation complet : < 3 secondes (conforme REQ-NF-002)
  - Envoi email confirmation : < 5 minutes

# Données collectées (RGPD)
data_collected:
  - Email (depuis invitation, devient identifiant)
  - Mot de passe (hashé)
  - Nom, Prénom
  - Téléphone
  - Date/heure d'activation
  - IP de connexion (audit sécurité, conservée 6 mois)
  - Consentement CGU et RGPD (horodaté)

# Cas de test suggérés
test_scenarios:
  - T-US001-01 : Activation nominale complète avec tous champs valides
  - T-US001-02 : Mot de passe trop court (< 8 caractères)
  - T-US001-03 : Mot de passe sans chiffre
  - T-US001-04 : Mot de passe sans symbole
  - T-US001-05 : Confirmation mot de passe différente
  - T-US001-06 : Téléphone invalide (lettres, format incorrect)
  - T-US001-07 : Champs obligatoires vides
  - T-US001-08 : Cases CGU/RGPD non cochées
  - T-US001-09 : Lien expiré (> 7 jours)
  - T-US001-10 : Lien déjà utilisé
  - T-US001-11 : Token invalide/corrompu
  - T-US001-12 : Rate limiting (6 tentatives rapides)
  - T-US001-13 : Navigation clavier complète
  - T-US001-14 : Test avec lecteur d'écran (NVDA/JAWS)
  - T-US001-15 : Performance : activation en < 3s
  - T-US001-16 : Réception email confirmation < 5min
```

# Exemples initiaux (à détailler)

- US-002 — En tant que déposant, je veux enregistrer mes articles avec prix proposé.
- US-003 — En tant que déposant, je veux obtenir/imprimer des étiquettes pour chaque article.
- US-004 — En tant que bénévole, je veux scanner un article et enregistrer la vente.
- US-005 — En tant que bénévole, je veux clôturer la bourse et générer les reversements.
