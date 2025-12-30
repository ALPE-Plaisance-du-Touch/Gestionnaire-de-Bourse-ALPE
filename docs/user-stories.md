---
id: DOC-030-US
title: User Stories
status: validated
version: 1.0.0
updated: 2025-12-28
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

# Liste des User stories

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

## US-002 — Déclarer mes articles dans mes listes

```yaml
id: US-002
title: Déclarer mes articles dans mes listes
actor: deposant
benefit: "...pour préparer mon dépôt et obtenir mes étiquettes avant la bourse"
as_a: "En tant que déposant inscrit à une édition"
i_want: "Je veux créer mes listes (max 2) et y ajouter mes articles avec leurs caractéristiques"
so_that: "Afin de respecter le règlement (24 articles max dont 12 vêtements) et valider ma participation à l'édition"

# Contexte métier
notes: |
  - Cette US s'appuie sur le Règlement déposant (docs/Reglement_deposant.md) et le Règlement intérieur
  - Le déposant doit compléter ses listes AVANT la date limite de déclaration
  - **Date limite recommandée : 3 semaines avant le début de la collecte** pour permettre l'impression des étiquettes par ALPE
  - Anciennement fait via Google Forms, maintenant intégré dans l'application
  - Les frais d'inscription (5€) sont payés via Billetweb pour réserver le créneau
  - Les bénévoles vérifieront physiquement les articles lors du dépôt
  - **Un déposant ne peut effectuer qu'un seul dépôt par semaine de collecte** (vérification par pièce d'identité lors du dépôt physique)

acceptance_criteria:
  # AC-1 : Accès à la déclaration d'articles
  - GIVEN je suis connecté en tant que déposant
    AND je suis inscrit à une édition active (statut "Inscriptions ouvertes" ou "En cours")
    AND la date limite de déclaration n'est pas dépassée
    WHEN j'accède à mon espace déposant
    THEN je vois :
      • Le nom de l'édition et mes informations (créneau de dépôt réservé via Billetweb)
      • Un encart "Mes listes" avec bouton "Créer ma première liste" (si aucune liste)
      • La liste de mes listes existantes avec nombre d'articles saisis / 24
      • Un rappel visible : "Vous avez droit à 2 listes maximum de 24 articles chacune (dont 12 vêtements max)"
      • Un compteur : "Listes créées : X / 2"

  # AC-2 : Création d'une liste
  - GIVEN je n'ai pas encore atteint la limite de 2 listes pour cette édition
    WHEN je clique sur "Créer une nouvelle liste"
    THEN le système crée une liste vide numérotée (ex: "Liste 1", "Liste 2")
    AND m'affiche l'interface de gestion de liste avec :
      • Un bouton "Nouvel article" en haut
      • Une zone d'affichage des articles déjà ajoutés (vide initialement)
      • Les articles seront automatiquement triés par catégorie selon l'ordre :
        1. Vêtements (max 12)
        2. Chaussures
        3. Puériculture
        4. Jeux et jouets
        5. Livres
        6. Accessoires
        7. Autres
      • Colonnes : N° ligne | Catégorie | Genre (opt.) | Taille (opt.) | Description | Prix (€) | Actions
      • Un bouton "Sauvegarder la liste" en bas

  # AC-3 : Ajout d'un article - cas nominal vêtement
  - GIVEN je suis dans une de mes listes (< 24 articles)
    AND j'ai moins de 12 vêtements déjà saisis
    WHEN je clique sur "Nouvel article"
    THEN un formulaire s'ouvre avec les champs :
      • Catégorie : menu déroulant (Vêtements/Chaussures/Puériculture/Jeux et jouets/Livres/Accessoires/Autres)
    AND je sélectionne "Vêtements"
    AND je remplis :
      • Genre : "Garçon" (menu déroulant : Fille/Garçon/Mixte/Adulte Homme/Adulte Femme/Mixte Adulte)
      • Taille : "4 ans" (menu déroulant avec tailles standard)
      • Description : "Pull rayé bleu marine"
      • Prix : "5"
    AND je clique sur "Ajouter l'article"
    THEN le système :
      • Enregistre l'article
      • L'insère automatiquement dans la section "Vêtements" de la liste (au bon endroit selon le tri)
      • Met à jour le compteur "Articles : X / 24 (Y vêtements / 12)"
      • Affiche un message de confirmation vert : "Article ajouté"
      • Renumérotе automatiquement toutes les lignes pour garder l'ordre 1 à X

  # AC-4 : Validation des contraintes par catégorie
  - GIVEN j'ai déjà saisi 1 manteau dans ma liste
    AND je tente d'ajouter un 2ème article de catégorie "Manteau/Blouson"
    WHEN je clique sur "Ajouter l'article"
    THEN le système affiche une erreur : "Vous avez déjà 1 manteau/blouson dans cette liste. Maximum autorisé : 1 par liste (selon règlement)"
    AND bloque l'ajout
    # Règles similaires pour :
    # - 1 sac à main max
    # - 2 foulards max
    # - 1 tour de lit max
    # - 1 peluche max
    # - 5 livres adultes max

  # AC-5 : Validation prix minimum et maximum
  - GIVEN je saisis un article avec un prix < 1€ (ex: 0.50)
    WHEN je quitte le champ prix ou tente d'ajouter l'article
    THEN le système affiche : "Prix minimum : 1€ (selon règlement)"
    AND bloque l'ajout

  - GIVEN je saisis un article catégorie "Puériculture > Poussette/Landau" avec prix > 150€
    WHEN je tente d'ajouter l'article
    THEN le système affiche : "Prix maximum pour les poussettes/landaus : 150€ (selon règlement)"
    AND bloque l'ajout

  # AC-6 : Gestion des lots (vêtements enfant)
  - GIVEN je sélectionne "Créer un lot" dans la ligne
    WHEN le formulaire s'adapte :
      • Catégorie : "Vêtements enfant (lot)" (obligatoire)
      • Type : "Bodys" ou "Pyjamas/Grenouillères" (menu déroulant)
      • Taille : "18 mois" (jusqu'à 36 mois max)
      • Marque : "Petit Bateau" (texte libre)
      • Nombre d'articles : "3" (slider 1-3)
      • Description : "3 bodys blancs à manches courtes"
      • Prix : "4" (prix du lot complet)
    AND je valide
    THEN le système :
      • Enregistre le lot comme 1 article dans le compteur
      • Vérifie taille ≤ 36 mois
      • Vérifie nombre articles lot ≤ 3
      • Affiche dans la liste : "LOT x3 - Bodys 18 mois Petit Bateau - 4€"

  # AC-7 : Tri automatique des articles par catégorie
  - GIVEN j'ai ajouté plusieurs articles de catégories différentes dans ma liste :
      • 2 vêtements (ligne 1-2)
      • 1 livre (ligne 3)
      • 1 jouet (ligne 4)
    WHEN j'ajoute un nouveau vêtement
    THEN le système l'insère automatiquement après les vêtements existants (ligne 3)
    AND décale automatiquement les autres articles (livre devient ligne 4, jouet devient ligne 5)
    AND maintient l'ordre de tri :
      1. Vêtements (tous groupés)
      2. Chaussures (tous groupés)
      3. Puériculture
      4. Jeux et jouets
      5. Livres
      6. Accessoires
      7. Autres
    AND renumérotе toutes les lignes de 1 à N pour refléter l'ordre final

  # AC-8 : Blocage articles refusés (liste noire)
  - GIVEN je tente d'ajouter un article avec catégorie dans la liste noire :
      • Sièges-autos / rehausseurs
      • Biberons, pots, vaisselle bébé
      • CD/DVD/Vinyles
      • Casques (vélo, ski, équitation)
      • Consoles de jeu, jeux PC/Mac
      • Meubles, luminaires, décoration
      • Literie (matelas, oreillers)
      • Livres jaunis/abîmés, encyclopédies
      • Vêtements adultes > 14 ans (pyjamas, chemises de nuit, peignoirs)
      • Sous-vêtements adultes / enfants > 2 ans
      • Chaussettes (sauf ski), collants, chaussons enfants
      • Costumes hommes, cravates, kimono
    WHEN je sélectionne cette catégorie
    THEN le système affiche une modale explicative :
      "Cette catégorie est refusée selon le règlement de la bourse. Consultez la liste complète des articles refusés dans le règlement."
    AND propose un lien vers le règlement complet
    AND empêche la sélection

  # AC-9 : Déclaration de conformité qualité
  - GIVEN je viens d'ajouter un article
    WHEN le formulaire affiche une case à cocher obligatoire :
      "☑ Je certifie que cet article est propre, en bon état, complet et conforme aux critères du règlement déposant"
    AND je dois cocher avant de pouvoir sauvegarder la liste
    THEN si je ne coche pas, le système affiche :
      "Vous devez certifier la conformité de vos articles pour pouvoir sauvegarder votre liste"

  # AC-10 : Limite 12 vêtements atteinte - validation en temps réel
  - GIVEN j'ai déjà saisi 12 articles de catégorie "Vêtements" dans ma liste
    AND je clique sur "Nouvel article" pour en ajouter un nouveau
    WHEN dans le formulaire je sélectionne la catégorie "Vêtements"
    THEN le système :
      • Grise immédiatement le bouton "Ajouter l'article" (non cliquable)
      • Affiche un message d'erreur en rouge : "Vous avez déjà ajouté vos 12 vêtements sur cette liste"
      • Affiche une suggestion : "Vous pouvez créer une 2ème liste si nécessaire (2 listes max par déposant)"
      • Empêche la validation tant que la catégorie "Vêtements" reste sélectionnée
    AND si je change la catégorie vers une autre valeur (ex: "Chaussures")
    THEN le bouton "Ajouter l'article" redevient cliquable
    AND le message d'erreur disparaît

  # AC-11 : Sauvegarde et modification de liste
  - GIVEN j'ai saisi des articles dans ma liste
    AND la date limite de déclaration n'est pas dépassée
    WHEN je clique sur "Sauvegarder la liste"
    THEN le système :
      • Enregistre tous les articles saisis
      • M'affiche un résumé : "Liste 1 : [X] articles saisis (Y vêtements)"
      • Me permet de revenir modifier tant que la date limite n'est pas atteinte
      • Affiche un statut : "Brouillon" (si 0 article) ou "Complète" (si ≥ 1 article)

  # AC-12 : Blocage après date limite
  - GIVEN la date limite de déclaration est dépassée
    WHEN j'accède à mes listes
    THEN le système :
      • Affiche mes listes en lecture seule
      • Désactive les boutons "Ajouter" et "Modifier"
      • Affiche un bandeau rouge : "Date limite dépassée. Vous ne pouvez plus modifier vos listes."
      • Si mes listes sont vides (0 article), affiche :
        "Vos listes sont vides. Votre dépôt ne sera pas pris en compte. Contactez les bénévoles si nécessaire."

  # AC-13 : Aide contextuelle avec prix indicatifs
  - GIVEN je remplis le champ prix
    WHEN le système détecte la catégorie sélectionnée
    THEN il affiche une bulle d'aide avec les prix indicatifs du règlement :
      Exemple pour "Vêtements > Robe enfant" :
      "💡 Prix indicatif : 3€ à 13€ selon état et marque (voir grille complète dans le règlement)"

  # AC-14 : Récapitulatif avant validation finale
  - GIVEN j'ai complété mes listes (1 ou 2)
    AND je clique sur "Valider mes listes pour cette édition"
    WHEN le système affiche un récapitulatif modal :
      • "Vous avez déclaré [X] articles répartis sur [Y] liste(s)"
      • "Liste 1 : [N1] articles (dont [V1] vêtements)"
      • "Liste 2 : [N2] articles (dont [V2] vêtements)" (si applicable)
      • "Rappel : apportez vos articles propres, repassés et dans l'ordre de la liste le jour de votre créneau"
      • Case à cocher finale : "J'ai lu et j'accepte les conditions de dépôt (pièce d'identité, enveloppe timbrée, articles conformes)"
    AND je confirme
    THEN le système :
      • Passe le statut des listes à "Validée"
      • M'envoie un email de confirmation avec récapitulatif PDF de mes listes
      • Affiche un message de succès : "Listes validées avec succès ! Vous recevrez un rappel 2 jours avant votre créneau de dépôt."

  # AC-15 : Indicateurs visuels de progression
  - GIVEN je suis en train de remplir mes listes
    WHEN j'ajoute/modifie des articles
    THEN le système affiche en permanence :
      • Barre de progression : "Articles : 15 / 24 (8 vêtements / 12)" avec barre visuelle
      • Icônes de validation ✓/✗ pour chaque contrainte respectée/non respectée :
        ✓ Maximum 2 listes respecté
        ✓ Prix minimum 1€ respecté
        ✓ Maximum 12 vêtements respecté (liste 1)
        ✗ 1 manteau max (vous en avez 2 dans liste 2)
      • Bouton "Valider" grisé tant que toutes les contraintes ne sont pas respectées

  # AC-16 : Aperçu de mes listes pour consultation
  - GIVEN j'ai validé mes listes
    WHEN j'accède à mon espace déposant
    THEN je vois un bouton "Consulter l'aperçu de mes listes" pour chaque liste validée
    AND je clique sur ce bouton
    THEN le système :
      • Affiche un aperçu visuel de ma liste dans une modale ou nouvelle page
      • Contenu de l'aperçu :
        - Titre : "Aperçu Liste [NUMERO] - [MON_NOM]"
        - Tableau des articles triés par catégorie avec : N° | Catégorie | Description | Taille | Prix
        - Total : "[N] articles - [MONTANT]€"
        - Note informative : "ℹ️ Les étiquettes et une copie de cette liste vous seront remises dans une pochette transparente lors de votre créneau de dépôt. Impression et découpage effectués par ALPE."
      • Propose un bouton "Télécharger en PDF" pour avoir une copie personnelle (sans étiquettes)
      • Propose un bouton "Imprimer" pour impression personnelle (optionnel)
    AND cette fonctionnalité reste accessible même après validation, jusqu'au jour du dépôt

dependencies:
  - US-001  # Activation compte déposant
  - US-008  # Import Billetweb (pour inscription à édition)

links:
  - rel: requirement
    id: REQ-F-002  # Enregistrement articles
  - rel: requirement
    id: REQ-F-002-BIS  # Validation qualité
  - rel: requirement
    id: REQ-F-011  # Date limite déclaration
  - rel: source
    href: docs/Reglement_deposant.md
    title: Règlement déposant ALPE

# Règles métier complémentaires
business_rules:
  - Maximum 2 listes par déposant par édition
  - Maximum 24 articles par liste dont 12 vêtements max
  - Articles automatiquement triés par catégorie : Vêtements, Chaussures, Puériculture, Jeux/jouets, Livres, Accessoires, Autres
  - Prix minimum 1€ pour tout article
  - Prix maximum 150€ uniquement pour poussettes/landaus
  - Lots autorisés : vêtements enfant (bodys/pyjamas) jusqu'à 36 mois, lot de 3 max, taille et marque identiques
  - Un lot compte comme 1 article dans la limite des 24
  - Contraintes par catégorie strictement appliquées (1 manteau, 1 sac, 2 foulards, 1 tour de lit, 1 peluche, 5 livres adultes max)
  - Articles de la liste noire bloqués automatiquement
  - Modification possible jusqu'à la date limite de déclaration
  - Certification de conformité obligatoire pour chaque article
  - Validation finale irréversible après date limite

# Catégories principales
categories:
  Vêtements:
    - Jupe, Tee-shirt, Robe, Ensemble, Pantalon, Chemise, Bermuda/Short, Jogging, Sweat/Pull, Imperméable, Veste/Blouson, Manteau/Anorak, Layette
    - Contraintes : 12 max par liste
    - Position : toujours en premier dans la liste (tri automatique)
  Chaussures:
    - Chaussures sport (crampons, randonnée, ski, danse), Bottes pluie, Bottes neige
    - Position : 2ème dans la liste (après vêtements)
    - Exclusions : Chaussons enfants, Chaussures > pointure 25, Chaussettes (sauf ski)
  Puériculture:
    - Poussettes, Landaus, Tour de lit (1 max), Articles bébé très propres
    - Position : 3ème dans la liste (après chaussures)
    - Exclusions : Sièges-autos, Biberons, Pots, Vaisselle, Matelas, Baignoires
  "Jeux et jouets":
    - Jouets complets, Jeux de société, Disquettes/CD jeux (avec boîte), Peluches (1 max)
    - Position : 4ème dans la liste (après puériculture)
    - Exclusions : Consoles, Jeux PC/Mac, Circuits électriques, Jouets gonflables piscine
  Livres:
    - Livres enfants, Livres adultes (5 max), Magazines enfants en lot
    - Position : 5ème dans la liste (après jeux et jouets)
    - Exclusions : Livres jaunis/abîmés, Encyclopédies, Annales > 5 ans, Magazines adultes
  Accessoires:
    - Sacs à main (1 max), Foulards (2 max), Gants ski, Bonnets
    - Position : 6ème dans la liste (après livres)
    - Exclusions : Sacs de voyage, Cravates, Gants de ville
  Autres:
    - Tous les articles ne rentrant pas dans les catégories précédentes
    - Position : en dernier dans la liste

# Grille de prix indicatifs (selon règlement)
prix_indicatifs:
  Adultes:
    - Jupe : 3-10€
    - Tee-shirt : 3-8€
    - Robe : 5-23€
    - Pantalon : 4-13€
    - Manteau : 8-31€
  Enfants:
    - Jupe : 2-8€
    - Tee-shirt : 1-7€
    - Robe : 3-13€
    - Pantalon : 3-10€
    - Manteau : 3-13€
    - Layette : 1-8€
  Spécial:
    - Poussettes/Landaus : max 150€

# Cas de test suggérés
test_scenarios:
  - T-US002-01 : Création de la première liste et ajout de 5 vêtements enfants
  - T-US002-02 : Ajout de 24 articles (12 vêtements + 12 autres catégories)
  - T-US002-03 : Tentative d'ajouter un 13ème vêtement (bloqué)
  - T-US002-04 : Tentative d'ajouter un 2ème manteau dans la même liste (bloqué)
  - T-US002-05 : Création d'un lot de 3 bodys 18 mois (OK)
  - T-US002-06 : Tentative de lot > 36 mois (bloqué)
  - T-US002-07 : Ajout article avec prix 0.50€ (bloqué, min 1€)
  - T-US002-08 : Ajout poussette à 160€ (bloqué, max 150€)
  - T-US002-09 : Tri automatique : ajout vêtement après 2 livres existants (vêtement s'insère en premier)
  - T-US002-09bis : Validation temps réel : sélection catégorie "Vêtements" avec 12 déjà saisis (bouton grisé + message)
  - T-US002-10 : Tentative d'ajouter siège-auto (bloqué, liste noire)
  - T-US002-11 : Tentative d'ajouter CD/DVD (bloqué, liste noire)
  - T-US002-12 : Validation d'une liste avec 15 articles (OK)
  - T-US002-13 : Création de 2 listes complètes (OK)
  - T-US002-14 : Tentative de créer une 3ème liste (bloqué, max 2)
  - T-US002-15 : Modification d'article avant date limite (OK)
  - T-US002-16 : Tentative de modification après date limite (bloqué, lecture seule)
  - T-US002-17 : Validation finale avec récapitulatif et email de confirmation
  - T-US002-18 : Affichage prix indicatifs selon catégorie
  - T-US002-19 : Case certification conformité non cochée (bloqué)
  - T-US002-20 : Compteur visuel progression 24 articles et 12 vêtements
```

## US-003 — Générer et imprimer les étiquettes des déposants

```yaml
id: US-003
title: Générer et imprimer les étiquettes des déposants
actor: gestionnaire
benefit: "...pour préparer les pochettes de dépôt et permettre le scannage en caisse"
as_a: "En tant que gestionnaire responsable de l'impression"
i_want: "Je veux générer et imprimer en masse les étiquettes et listes de tous les déposants"
so_that: "Afin de préparer les pochettes transparentes qui seront remises aux déposants lors de leur créneau (règlement intérieur : impression et découpage à la charge d'ALPE)"

# Contexte métier
notes: |
  - Cette US s'appuie sur la US-002 (déclaration des articles validée par les déposants)
  - **Selon le règlement intérieur** : "L'impression de la liste et des étiquettes ainsi que le découpage auront été faits en amont par ALPE"
  - Les déposants doivent valider leurs listes **3 semaines avant le début de la collecte** pour permettre l'impression par ALPE
  - Le gestionnaire génère les étiquettes pour tous les déposants d'un créneau ou d'une édition complète
  - Chaque étiquette contient un code unique scannable (QR code)
  - La couleur de l'étiquette dépend du numéro de liste (règlement intérieur) :
    • Liste 100 : étiquette bleu ciel
    • Liste 200 : étiquette jaune soleil
    • Liste 300 : étiquette fushia
    • Liste 400 : étiquette lilas
    • Liste 500 : étiquette vert menthe
    • Liste 600 : étiquette clémentine
    • Liste 1000 : étiquette blanche
    • Liste 2000 : étiquette groseille
  - Le jour du dépôt, chaque déposant reçoit une pochette transparente contenant :
    • Un exemplaire de sa liste imprimée
    • Ses étiquettes imprimées et découpées
  - Les bénévoles utilisent ces étiquettes pour étiqueter les articles à la table d'enregistrement

acceptance_criteria:
  # AC-1 : Accès à la génération en masse
  - GIVEN je suis connecté en tant que gestionnaire
    AND une édition est en statut "Inscriptions ouvertes" ou "En cours"
    WHEN j'accède à la section "Gestion des étiquettes"
    THEN je vois :
      • Un tableau listant tous les déposants avec leurs listes validées
      • Pour chaque déposant : nom, créneau de dépôt, nombre de listes, nombre total d'articles, statut étiquettes
      • Des filtres : par créneau, par statut étiquettes (non générées / générées / imprimées)
      • Un bouton "Générer toutes les étiquettes" (pour tous les déposants)
      • Un bouton "Générer par créneau" (pour un créneau spécifique)
      • Un compteur global : "245 listes à générer - 1823 étiquettes au total"

  # AC-2 : Génération en masse par créneau - cas nominal
  - GIVEN j'ai sélectionné le créneau "Mercredi 9h30-11h30" qui contient 20 déposants avec 35 listes
    WHEN je clique sur "Générer étiquettes pour ce créneau"
    THEN le système :
      • Génère un code unique par article pour tous les déposants du créneau (format : EDI-[ID_EDITION]-L[NUMERO_LISTE]-A[NUMERO_ARTICLE])
      • Crée un QR code scannable pour chaque article
      • Produit un fichier PDF nommé "Etiquettes_Creneau_Mercredi_9h30_[DATE].pdf" contenant :
        - Page de garde avec liste des déposants et créneau
        - Pour chaque déposant : une page de séparation avec nom + numéro(s) de liste(s)
        - Les étiquettes de toutes ses listes
        - Une copie de sa liste d'articles (pour pochette transparente)
      • Lance automatiquement le téléchargement du PDF
      • Affiche un message : "PDF généré avec succès ! 35 listes - 287 étiquettes pour 20 déposants"
      • Marque toutes les listes comme "Étiquettes générées" avec date/heure

  # AC-3 : Contenu d'une étiquette
  - GIVEN une étiquette générée pour un article
    WHEN je consulte le PDF téléchargé
    THEN chaque étiquette contient :
      • QR code scannable (taille 25x25mm minimum)
      • Numéro de liste (ex: "Liste 245") en gros caractères
      • Numéro d'article dans la liste (ex: "Article 3/15")
      • Prix de vente en gros (ex: "5.00€")
      • Description courte de l'article tronquée à 50 caractères max (ex: "Pull rayé bleu marine - 4 ans")
      • Catégorie (icône + texte : "Vêtements", "Jouets", etc.)
      • Indication couleur : fond de l'étiquette dans la couleur correspondant au numéro de liste
      • Code unique en texte petit en bas (ex: "EDI-2024-11-L245-A03")

  # AC-4 : Format d'impression optimisé
  - GIVEN je consulte le PDF généré
    THEN le document est optimisé pour impression :
      • Format A4 portrait
      • 12 étiquettes par page (3 colonnes × 4 lignes)
      • Dimension étiquette : 70mm × 74mm
      • Lignes pointillées pour découpe entre chaque étiquette
      • Marges de 10mm tout autour
      • Police lisible (Arial ou équivalent, taille 10-14pt selon l'élément)
      • Compatible impression couleur ou noir & blanc (la couleur de fond reste visible en noir & blanc)

  # AC-5 : Page de garde par déposant dans le PDF
  - GIVEN je génère les étiquettes d'un créneau
    THEN pour chaque déposant le PDF contient une page de séparation avec :
      • Nom complet du déposant en gros caractères
      • Numéro(s) de liste(s) (ex: "Liste 245 - Liste 246")
      • Créneau de dépôt : "Mercredi 9h30-11h30"
      • Nombre total d'articles : "30 articles (dont 18 vêtements)"
      • Instructions pour les bénévoles :
        "📋 Pochette transparente à remettre au déposant contenant :"
        "1. Cette liste d'articles imprimée"
        "2. Les étiquettes découpées ci-après"
        "3. Diriger vers la table d'enregistrement"
      • Case à cocher : "☐ Pochette préparée par : ________ le __/__/____"

  # AC-6 : Régénération possible avec avertissement
  - GIVEN j'ai déjà généré les étiquettes du créneau "Mercredi 9h30-11h30" le 05/11/2024
    WHEN je clique à nouveau sur "Générer étiquettes pour ce créneau"
    THEN le système :
      • Affiche une modale de confirmation :
        "⚠️ Les étiquettes de ce créneau ont déjà été générées le 05/11/2024 à 14h23."
        "Voulez-vous régénérer ? Les codes QR resteront identiques."
        "Si des déposants ont modifié leurs listes depuis, les nouvelles informations seront prises en compte."
      • Propose deux boutons : "Annuler" et "Régénérer"
    AND si je confirme
    THEN génère un nouveau PDF avec les informations à jour
    AND enregistre cette régénération dans l'historique

  # AC-7 : Génération individuelle pour un déposant
  - GIVEN je veux générer les étiquettes d'un seul déposant (ex: Marie Dupont)
    WHEN je coche la case à côté de son nom dans le tableau
    AND je clique sur "Générer pour la sélection"
    THEN le système :
      • Génère un PDF contenant uniquement les étiquettes et listes de Marie Dupont
      • Nom de fichier : "Etiquettes_Marie_Dupont_[DATE].pdf"
      • Marque ses listes comme "Étiquettes générées"

  # AC-8 : Statut d'impression et traçabilité
  - GIVEN j'ai généré les étiquettes d'un créneau
    WHEN je reviens sur la page "Gestion des étiquettes"
    THEN je vois pour chaque déposant :
      • Statut : "Étiquettes générées le 05/11/2024 à 14h23 par Sophie Martin"
      • Un bouton "Marquer comme imprimé" qui change le statut en "Imprimé le [DATE] par [NOM]"
      • Un bouton "Télécharger à nouveau" pour récupérer le PDF déjà généré
    AND dans l'historique de l'édition :
      • "05/11/2024 14h23 - Sophie Martin : Génération 35 listes (287 étiquettes) pour créneau Mercredi 9h30"
      • "05/11/2024 16h45 - Jean Durand : Marqué comme imprimé - créneau Mercredi 9h30"

  # AC-9 : Vérification de cohérence en masse
  - GIVEN je génère les étiquettes pour un créneau de 20 déposants
    WHEN le système crée le PDF
    THEN il effectue les vérifications suivantes pour chaque déposant :
      • Chaque article de chaque liste a bien une étiquette correspondante
      • Les numéros d'articles sont séquentiels (1, 2, 3... jusqu'à N) pour chaque liste
      • Aucun code unique n'est dupliqué au sein de l'édition (vérification sur les 1823 codes)
      • Les prix affichés correspondent bien aux prix saisis
      • La couleur de fond correspond bien au numéro de liste
    AND si une incohérence est détectée pour un déposant
    THEN affiche un rapport d'erreur :
      "⚠️ Erreurs détectées sur 2 déposants :"
      "- Marie Dupont (Liste 245) : Code dupliqué détecté"
      "- Jean Martin (Liste 387) : Article 15 manquant"
      "Les autres déposants (18/20) peuvent être générés. Voulez-vous continuer ?"

  # AC-10 : Génération de la liste d'articles imprimable
  - GIVEN je génère les étiquettes pour un déposant
    THEN le PDF contient également une copie de sa liste d'articles formatée pour impression :
      • En-tête : "Liste des articles - [NOM DEPOSANT] - Liste [NUMERO]"
      • Tableau avec colonnes : N° | Catégorie | Description | Taille | Prix
      • Articles triés automatiquement par catégorie (Vêtements, Chaussures, etc.)
      • Total en bas : "Total : [N] articles - [MONTANT]€"
      • Note en bas : "À remettre au déposant dans la pochette transparente"
    AND cette liste est insérée juste avant les étiquettes du déposant dans le PDF

  # AC-11 : Aperçu et instructions d'impression
  - GIVEN je viens de générer un PDF de 287 étiquettes pour un créneau
    WHEN le téléchargement démarre
    THEN le système :
      • Ouvre automatiquement une fenêtre de prévisualisation du PDF dans le navigateur
      • Affiche un message d'instructions :
        "📋 Instructions d'impression :"
        "1. Papier blanc A4 standard 80g ou papier couleur selon numéro liste"
        "2. Imprimer en couleur si possible (sinon les fonds grisés restent visibles)"
        "3. Découper les étiquettes le long des lignes pointillées"
        "4. Préparer les pochettes transparentes avec liste + étiquettes découpées"
      • Propose un bouton "Imprimer directement"
      • Propose un bouton "Télécharger le guide de découpe" (PDF avec instructions visuelles)

  # AC-12 : Export et statistiques
  - GIVEN j'ai terminé la génération pour tous les créneaux
    WHEN j'accède à la page "Gestion des étiquettes"
    THEN je peux :
      • Exporter un tableau Excel récapitulatif :
        - Colonnes : Déposant | Créneau | Nb listes | Nb articles | Statut | Généré le | Imprimé le
      • Voir les statistiques globales :
        "245 déposants - 412 listes - 3246 étiquettes"
        "✅ Générées : 350 listes (85%)"
        "🖨️ Imprimées : 280 listes (68%)"
        "⏳ En attente : 62 listes (15%)"
      • Filtrer par statut pour relancer les déposants n'ayant pas validé leurs listes

dependencies:
  - US-002  # Déclaration articles (listes validées requises)
  - US-008  # Import Billetweb (pour avoir le créneau de dépôt)

links:
  - rel: requirement
    id: REQ-F-003  # Génération étiquettes scannables
  - rel: source
    href: docs/Reglement_interne.md
    title: Règlement intérieur ALPE (couleurs étiquettes)

# Règles métier complémentaires
business_rules:
  - Génération en masse par le gestionnaire (pas par les déposants individuellement)
  - Impression et découpage à la charge d'ALPE (règlement intérieur)
  - Génération possible par créneau, par sélection, ou pour toute l'édition
  - Code unique format : EDI-[ID_EDITION]-L[NUMERO_LISTE]-A[NUMERO_ARTICLE]
  - QR code scannable contenant le code unique
  - Une étiquette par article déclaré
  - Couleur de fond selon numéro de liste (100=bleu ciel, 200=jaune, 300=fushia, 400=lilas, 500=vert menthe, 600=clémentine, 1000=blanc, 2000=groseille)
  - Format étiquette : 70×74mm (12 par page A4)
  - PDF contient pour chaque déposant : page de séparation + liste d'articles imprimable + étiquettes
  - Traçabilité complète : qui a généré, quand, qui a imprimé, quand
  - Statuts : Non générées / Générées / Imprimées
  - PDF téléchargeable indéfiniment (stocké côté serveur)
  - Codes uniques au sein de l'édition (pas de duplication possible)
  - Pochette transparente remise au déposant le jour du dépôt contenant : liste imprimée + étiquettes découpées

# Spécifications techniques du QR code
qr_code_specs:
  - Type : QR Code version 3 minimum (capacité 35 caractères alphanumériques)
  - Format de données : Texte brut contenant le code unique
  - Niveau de correction d'erreur : M (15% de redondance)
  - Taille minimale : 25×25mm pour scan fiable à 20cm
  - Couleur : Noir sur fond blanc (zone QR détourée en blanc si fond coloré)
  - Marges blanches : minimum 4 modules autour du QR code

# Cas de test suggérés
test_scenarios:
  - T-US003-01 : Génération en masse pour créneau de 20 déposants (OK, PDF 287 étiquettes)
  - T-US003-02 : Génération individuelle pour 1 déposant avec 2 listes (OK, page séparation + 2 listes articles + étiquettes)
  - T-US003-03 : Vérification codes uniques sur 412 listes édition complète (pas de doublon)
  - T-US003-04 : Vérification couleur fond pour listes 100, 200, 1000, 2000 (couleurs correctes)
  - T-US003-05 : Impression test et scan QR code avec lecteur smartphone (OK)
  - T-US003-06 : Régénération après modification d'articles par déposant (nouvelles infos affichées, QR identiques)
  - T-US003-07 : Génération pour toute l'édition 245 déposants (OK, PDF organisé par créneau)
  - T-US003-08 : Filtrage par créneau puis génération (OK, seulement le créneau sélectionné)
  - T-US003-09 : Aperçu PDF dans navigateur avec instructions d'impression (OK)
  - T-US003-10 : Marquage statut "Imprimé" avec traçabilité (date + nom gestionnaire enregistrés)
  - T-US003-11 : Export Excel récapitulatif avec tous les statuts (OK, 412 lignes)
  - T-US003-12 : Vérification liste d'articles imprimable dans PDF (tableau complet, total correct)
  - T-US003-13 : Vérification page de séparation avec instructions pochette (case à cocher présente)
  - T-US003-14 : Format étiquette 70×74mm vérifié après impression et découpage (OK)
  - T-US003-15 : Statistiques globales affichées (pourcentages générées/imprimées corrects)
  - T-US003-16 : Gestion erreur sur incohérence (rapport d'erreur lisible, génération partielle possible)
  - T-US003-17 : Historique édition avec toutes les générations tracées (date, heure, gestionnaire, nombre)
```

## US-004 — Scanner un article et enregistrer la vente

```yaml
id: US-004
title: Scanner un article et enregistrer la vente
actor: benevole
benefit: "...pour enregistrer rapidement les ventes en caisse et assurer la traçabilité"
as_a: "En tant que bénévole en caisse pendant la bourse"
i_want: "Je veux scanner les QR codes des étiquettes et enregistrer les ventes avec le moyen de paiement"
so_that: "Afin de tracer toutes les ventes, calculer les reversements et fournir des statistiques en temps réel"

# Contexte métier
notes: |
  - Cette US s'appuie sur US-003 (étiquettes avec QR codes contenant codes uniques)
  - Les bénévoles en caisse scannent les étiquettes des articles vendus
  - Plusieurs caisses en parallèle pendant la bourse (3-5 caisses typiquement)
  - Volume : ~3000 articles à scanner sur un week-end
  - Performance critique : scan + enregistrement < 3 secondes par article (REQ-F-004)
  - Moyens de paiement : Espèces, Chèque, Carte Bancaire
  - Vente privée écoles/ALAE : vendredi 17h-18h avant vente publique (REQ-F-017)
  - Vente publique : samedi et dimanche
  - Commission ALPE : 20% du montant des ventes (prélevée automatiquement)
  - Les bénévoles doivent pouvoir travailler même si le réseau est instable
  - Traçabilité complète : qui a vendu quoi, quand, pour quel montant

acceptance_criteria:
  # AC-1 : Interface caisse bénévole - accès et connexion
  - GIVEN je suis un bénévole affecté à la caisse
    AND j'ai mes identifiants
    WHEN je me connecte à l'application sur la tablette/PC de caisse
    THEN je vois l'interface "Caisse - Bourse [NOM_EDITION]" avec :
      • Mon nom en haut : "Bénévole : Jean Dupont"
      • Le nom de l'édition : "Bourse Automne 2024"
      • Le statut de connexion : "En ligne ●" ou "Mode offline ○"
      • Un bouton "Scanner un article" (principal, gros bouton central)
      • Un compteur : "Articles vendus aujourd'hui : [N]"
      • Un montant total : "Total ventes : [MONTANT]€"
      • Un bouton "Historique de mes ventes"
      • Un bouton "Statistiques temps réel"
      • Un bouton "Déconnexion"

  # AC-2 : Scan QR code - cas nominal
  - GIVEN je suis connecté à l'interface caisse
    AND un client me présente un article avec son étiquette
    WHEN je clique sur "Scanner un article"
    THEN le système active la caméra de la tablette ou attend le scan du douchette USB
    AND j'approche l'étiquette du scanner
    AND le QR code est lu (code unique : "EDI-2024-11-L245-A03")
    THEN le système :
      • Émet un bip sonore de confirmation
      • Affiche les infos de l'article en < 1 seconde :
        - Photo de l'article (si disponible)
        - Description : "Pull rayé bleu marine"
        - Catégorie : "Vêtements - Garçon - 4 ans"
        - Prix : "5.00€" (en gros caractères)
        - Liste : "Liste 245"
        - Déposant : "Marie Dupont"
        - Statut : "✓ Disponible"

  # AC-3 : Confirmation de la vente - sélection moyen de paiement
  - GIVEN le système a affiché les infos de l'article scanné
    AND le statut est "Disponible"
    WHEN je sélectionne le moyen de paiement :
      • Bouton "💵 Espèces"
      • Bouton "🏦 Chèque"
      • Bouton "💳 Carte Bancaire"
    AND je clique sur un des boutons
    THEN le système :
      • Affiche une confirmation : "Vente de [DESCRIPTION] pour [PRIX]€ en [MOYEN_PAIEMENT] ?"
      • Propose deux boutons : "✓ Confirmer la vente" (vert) et "✗ Annuler" (gris)

  # AC-4 : Enregistrement de la vente - confirmation
  - GIVEN j'ai scanné un article et sélectionné le moyen de paiement
    WHEN je clique sur "✓ Confirmer la vente"
    THEN le système :
      • Enregistre la vente en base de données avec :
        - Code unique article : EDI-2024-11-L245-A03
        - Prix de vente : 5.00€
        - Moyen de paiement : Espèces
        - Date et heure : 2024-11-09 14:35:22
        - Bénévole vendeur : Jean Dupont (ID du bénévole connecté)
        - Déposant : Marie Dupont (Liste 245)
      • Marque l'article comme "Vendu"
      • Affiche une confirmation : "✓ Vente enregistrée - 5.00€"
      • Incrémente le compteur "Articles vendus aujourd'hui"
      • Met à jour le total des ventes
      • Revient automatiquement à l'écran "Scanner un article" après 2 secondes
      • Temps total du scan à la confirmation : < 3 secondes

  # AC-5 : Gestion des erreurs - article déjà vendu
  - GIVEN un article a déjà été vendu précédemment
    WHEN je scanne son QR code
    THEN le système :
      • Émet un bip d'erreur (double bip)
      • Affiche un message d'alerte rouge :
        "⚠️ ARTICLE DÉJÀ VENDU"
        "Cet article a été vendu le [DATE] à [HEURE] par [BENEVOLE]"
        "Prix : [PRIX]€ - Moyen : [MOYEN_PAIEMENT]"
      • Affiche les infos de l'article (description, liste, déposant)
      • Propose un bouton "OK" pour revenir au scan
      • Ne permet PAS de vendre à nouveau l'article
      • Suggère : "Si l'étiquette est en double, contactez un gestionnaire"

  # AC-6 : Gestion des erreurs - article non trouvé
  - GIVEN je scanne un QR code qui ne correspond à aucun article de l'édition
    WHEN le scan est effectué
    THEN le système :
      • Émet un bip d'erreur
      • Affiche : "⚠️ ARTICLE NON TROUVÉ"
      • Affiche le code scanné : "Code : [CODE_SCANNE]"
      • Propose : "Vérifier que l'étiquette appartient bien à cette édition"
      • Bouton "Réessayer le scan"
      • Bouton "Signaler un problème" (ouvre un formulaire)

  # AC-7 : Gestion des erreurs - QR code illisible
  - GIVEN j'essaie de scanner un QR code abîmé ou illisible
    WHEN le scanner n'arrive pas à lire le code après 5 secondes
    THEN le système :
      • Affiche : "⚠️ QR CODE ILLISIBLE"
      • Propose : "Saisie manuelle du code"
      • Affiche un champ texte pour saisir : "EDI-2024-11-L245-A03"
      • Bouton "Valider" pour lancer la recherche manuelle
      • Si le code saisi existe, continue le flux normal (AC-2)

  # AC-8 : Annulation d'une vente - erreur de scan
  - GIVEN j'ai scanné un article par erreur (mauvais article présenté)
    AND je n'ai pas encore confirmé la vente
    WHEN je clique sur "✗ Annuler"
    THEN le système :
      • Revient à l'écran "Scanner un article"
      • N'enregistre aucune vente
      • Affiche brièvement : "Scan annulé"

  # AC-9 : Annulation d'une vente après confirmation (cas exceptionnel)
  - GIVEN j'ai confirmé une vente par erreur il y a moins de 5 minutes
    AND je réalise l'erreur (client n'achète finalement pas)
    WHEN j'accède à "Historique de mes ventes"
    AND je sélectionne la vente erronée
    THEN je vois un bouton "Annuler cette vente" (seulement si < 5 minutes)
    AND je clique sur "Annuler cette vente"
    AND je confirme avec un motif : "Client n'a pas acheté", "Erreur de scan", "Autre"
    THEN le système :
      • Marque la vente comme "Annulée" (ne la supprime pas, pour traçabilité)
      • Remet l'article en statut "Disponible"
      • Décrémente les compteurs
      • Enregistre l'annulation avec : qui, quand, motif
      • Affiche : "✓ Vente annulée - Article à nouveau disponible"

  # AC-10 : Historique des ventes du bénévole
  - GIVEN je suis connecté en caisse
    WHEN je clique sur "Historique de mes ventes"
    THEN je vois la liste de toutes mes ventes du jour avec :
      • Colonne Heure : "14:35:22"
      • Colonne Article : "Pull rayé bleu... - Liste 245"
      • Colonne Prix : "5.00€"
      • Colonne Paiement : "Espèces"
      • Colonne Statut : "✓ Vendu" ou "✗ Annulé"
      • Filtre par statut : "Toutes / Vendues / Annulées"
      • Total en bas : "[N] ventes pour [MONTANT]€"
      • Possibilité d'annuler une vente < 5 minutes

  # AC-11 : Statistiques temps réel pour le bénévole
  - GIVEN je clique sur "Statistiques temps réel"
    THEN je vois un tableau de bord avec :
      • Mes ventes : "[N] articles - [MONTANT]€"
      • Répartition par moyen de paiement :
        - Espèces : [N] articles ([MONTANT]€)
        - Chèque : [N] articles ([MONTANT]€)
        - CB : [N] articles ([MONTANT]€)
      • Ventes totales de toutes les caisses : "[N] articles - [MONTANT]€"
      • Top 5 déposants avec le plus de ventes :
        - Liste 245 (Marie Dupont) : 12 articles vendus / 18
      • Graphique évolution ventes par heure
      • Taux de vente global : "[X]% des articles déposés"

  # AC-12 : Mode offline - fonctionnement sans connexion
  - GIVEN je suis en train de scanner des articles
    AND la connexion réseau est perdue
    WHEN le système détecte la perte de connexion
    THEN :
      • Le statut passe à "Mode offline ○" avec bandeau orange
      • Je peux continuer à scanner et enregistrer des ventes
      • Les ventes sont stockées localement (IndexedDB/LocalStorage)
      • Affiche : "⚠️ Mode offline - Les ventes seront synchronisées dès le retour de la connexion"
    AND quand la connexion revient
    THEN le système :
      • Synchronise automatiquement toutes les ventes offline
      • Affiche : "✓ [N] ventes synchronisées"
      • Passe le statut à "En ligne ●"
      • Détecte les éventuels conflits (même article vendu sur 2 caisses) et affiche une alerte

  # AC-13 : Gestion des conflits - même article vendu 2 fois (offline)
  - GIVEN deux bénévoles ont vendu le même article en mode offline
    WHEN le système synchronise les ventes
    THEN il détecte le conflit et :
      • Garde la vente la plus ancienne (première dans le temps)
      • Marque la seconde vente comme "En conflit"
      • Envoie une notification au gestionnaire :
        "⚠️ Conflit détecté : Article EDI-2024-11-L245-A03 vendu 2 fois"
        "Vente 1 : Jean Dupont à 14:35 (conservée)"
        "Vente 2 : Marie Martin à 14:36 (annulée)"
      • Le bénévole concerné voit l'alerte dans son historique
      • Le gestionnaire doit résoudre manuellement (rembourser le client, etc.)

  # AC-14 : Performance - scan rapide
  - GIVEN je scanne un article
    WHEN le QR code est lu
    THEN le système :
      • Affiche les infos de l'article en < 1 seconde
      • Permet de confirmer la vente
      • Enregistre la vente en < 500ms
      • Revient à l'écran scan en < 500ms
      • Temps total scan → confirmation → prêt pour le suivant : < 3 secondes
    AND cette performance est maintenue même avec 5 caisses en parallèle

  # AC-15 : Traçabilité complète
  - GIVEN n'importe quelle vente enregistrée
    WHEN un gestionnaire consulte les détails de la vente
    THEN il voit :
      • Code unique article complet
      • Description, catégorie, taille
      • Prix de vente
      • Moyen de paiement
      • Date et heure exacte (à la seconde)
      • Nom du bénévole vendeur
      • Nom du déposant et numéro de liste
      • Si annulée : date/heure annulation, motif, qui a annulé
      • Si conflit : détails du conflit et résolution
      • Logs complets pour audit

dependencies:
  - US-003  # Génération étiquettes avec QR codes
  - US-008  # Import Billetweb (édition active)

links:
  - rel: requirement
    id: REQ-F-004  # Scannage/encaissement rapide ventes
  - rel: requirement
    id: REQ-F-005  # Calcul reversements (consomme les données de ventes)

# Règles métier complémentaires
business_rules:
  - Un article ne peut être vendu qu'une seule fois
  - Scan + enregistrement < 3 secondes (performance critique)
  - Moyens de paiement : Espèces, Chèque, Carte Bancaire
  - Traçabilité complète : qui a vendu, quand, moyen de paiement
  - Mode offline obligatoire (coupures réseau fréquentes dans les gymnases)
  - Synchronisation automatique quand connexion revient
  - Annulation possible < 5 minutes après vente (avec motif)
  - Gestion des conflits automatique (première vente conservée)
  - Statistiques temps réel pour motivation bénévoles
  - Commission 20% calculée automatiquement (pour reversements US-005)
  - Vente privée écoles/ALAE vendredi 17h-18h (REQ-F-017)
  - Plusieurs caisses en parallèle (3-5 typiquement)
  - Volume : ~3000 articles sur un week-end

# Spécifications techniques scan
scan_specs:
  - Scanner : Caméra tablette/smartphone ou douchette USB code-barres
  - Formats supportés : QR Code (priorité), Code-barres EAN-13 si QR illisible
  - Librairie scan : ZXing ou QuaggaJS pour navigateur
  - Résolution minimale : 640×480 pour scan fiable
  - Distance scan : 10-30 cm optimal
  - Temps scan QR : < 500ms typique
  - Mode offline : IndexedDB pour stockage local
  - Synchronisation : WebSocket ou polling 5s pour détection conflit
  - Performance base : requête SQL avec index sur code_unique (< 50ms)

# Cas de test suggérés
test_scenarios:
  - T-US004-01 : Connexion bénévole et accès interface caisse (OK, infos affichées)
  - T-US004-02 : Scan QR code article disponible (OK, infos < 1s, confirmation vente)
  - T-US004-03 : Vente avec paiement Espèces (OK, enregistrée, compteurs mis à jour)
  - T-US004-04 : Vente avec paiement Chèque (OK)
  - T-US004-05 : Vente avec paiement CB (OK)
  - T-US004-06 : Scan article déjà vendu (erreur, message clair, pas de double vente)
  - T-US004-07 : Scan article non trouvé (erreur, proposition saisie manuelle)
  - T-US004-08 : Scan QR illisible (saisie manuelle OK, recherche fonctionne)
  - T-US004-09 : Annulation avant confirmation (OK, rien enregistré)
  - T-US004-10 : Annulation après confirmation < 5 min (OK, article redevient disponible)
  - T-US004-11 : Tentative annulation > 5 min (bloqué, bouton absent)
  - T-US004-12 : Historique ventes bénévole (OK, liste complète, filtres fonctionnent)
  - T-US004-13 : Statistiques temps réel (OK, chiffres cohérents, toutes caisses)
  - T-US004-14 : Mode offline activé (OK, ventes enregistrées localement)
  - T-US004-15 : Synchronisation après offline (OK, [N] ventes synchronisées)
  - T-US004-16 : Conflit même article 2 caisses (détecté, première vente conservée, alerte gestionnaire)
  - T-US004-17 : Performance scan 100 articles (OK, moyenne < 3s par article)
  - T-US004-18 : Performance 5 caisses parallèles (OK, pas de ralentissement)
  - T-US004-19 : Traçabilité vente consultée par gestionnaire (OK, tous les détails présents)
  - T-US004-20 : Vente privée écoles/ALAE vendredi 17h (OK, accessible seulement ce créneau)
```

- US-005 — En tant que gestionnaire, je veux générer les reversements en fin d'édition.

```yaml
id: US-005
title: Générer les reversements en fin d'édition
actor: gestionnaire
benefit: "...pour calculer et verser aux déposants leur part des ventes et clôturer l'édition"
as_a: "En tant que gestionnaire responsable des reversements"
i_want: "Je veux générer les bordereaux de reversement pour tous les déposants à la fin de l'édition"
so_that: "Afin de reverser à chaque déposant 80% du montant de ses ventes, de tracer les paiements et de clôturer l'édition"

# Contexte métier
notes: |
  - Commission ALPE : 20% du montant des ventes
  - Reversement déposant : 80% du montant des ventes
  - Les déposants viennent récupérer leurs invendus + leur reversement lors des créneaux de restitution
  - Un bordereau signé est nécessaire pour la traçabilité (preuve de paiement)
  - Modes de reversement possibles : Espèces, Chèque, Virement (à préciser lors du paiement)
  - Si aucune vente : pas de reversement, juste récupération des invendus
  - Si tout vendu : reversement sans invendus
  - Volume : ~250 déposants à traiter en 2-3 jours de restitution

acceptance_criteria:
  # AC-1 : Accès à la génération des reversements
  - GIVEN je suis connecté en tant que gestionnaire
    AND l'édition en cours est en phase de restitution (ventes terminées)
    WHEN j'accède à la section "Reversements"
    THEN je vois :
      • Un tableau listant tous les déposants avec leurs statistiques :
        - Nom, Prénom, N° déposant
        - Nombre d'articles déposés
        - Nombre d'articles vendus / invendus
        - Montant total des ventes
        - Commission ALPE (20%)
        - Montant à reverser (80%)
        - Statut : "À générer" / "Bordereau prêt" / "Payé" / "Clôturé"
      • Des filtres : par statut, par créneau de restitution, par montant
      • Un bouton "Générer tous les bordereaux"
      • Un bouton "Exporter Excel récapitulatif"
      • Des statistiques globales en haut de page :
        - Total ventes édition : "15 234,50€"
        - Commission ALPE : "3 046,90€ (20%)"
        - Reversements déposants : "12 187,60€ (80%)"
        - Taux de vente global : "65% (1 823 vendus / 2 805 déposés)"

  # AC-2 : Calcul automatique des reversements
  - GIVEN un déposant a vendu des articles
    WHEN le système calcule son reversement
    THEN :
      • Le système récupère toutes les ventes associées à ce déposant
      • Calcule le total des ventes (somme des prix de vente)
      • Calcule la commission ALPE : montant_total × 0,20
      • Calcule le reversement : montant_total × 0,80
      • Arrondit les montants à 2 décimales (comptabilité)
    EXEMPLE :
      • 12 articles vendus : 3€ + 5€ + 2€ + 8€ + 4€ + 6€ + 7€ + 3€ + 10€ + 5€ + 4€ + 2€ = 59,00€
      • Commission ALPE : 59,00 × 0,20 = 11,80€
      • Reversement déposant : 59,00 × 0,80 = 47,20€

  # AC-3 : Génération du bordereau de reversement (PDF)
  - GIVEN je clique sur "Générer le bordereau" pour un déposant
    WHEN le PDF est généré
    THEN il contient :
      • En-tête : Logo ALPE, "BORDEREAU DE REVERSEMENT"
      • Édition : "Bourse Automne 2024"
      • Date de génération : "Généré le 07/11/2024 à 14:23"
      • Informations déposant :
        - N° déposant : "EDI-2024-11-D245"
        - Nom : "MARTIN Sophie"
        - Téléphone : "06 12 34 56 78"
      • Tableau récapitulatif articles VENDUS :
        Colonnes : N° article | Description | Catégorie | Prix vente
        Exemple :
          EDI-2024-11-L245-A01 | Pull rayé bleu | Vêtements | 5,00€
          EDI-2024-11-L245-A03 | Pantalon jean | Vêtements | 8,00€
          ...
        TOTAL VENTES : 59,00€
      • Tableau récapitulatif articles INVENDUS :
        Colonnes : N° article | Description | Catégorie | Prix demandé
        (idem, liste des invendus)
        TOTAL INVENDUS : 18 articles (valeur demandée : 78,00€)
      • Calculs :
        - Montant total des ventes : 59,00€
        - Commission ALPE (20%) : 11,80€
        - Montant à reverser (80%) : 47,20€
      • Section paiement (à remplir lors de la restitution) :
        □ Espèces  □ Chèque  □ Virement
        Date de paiement : ___ / ___ / ______
        Signature bénévole : ____________
        Signature déposant : ____________
      • Mention légale : "Je soussigné(e) reconnais avoir reçu la somme de 47,20€ et récupéré mes articles invendus."

  # AC-4 : Génération en masse des bordereaux
  - GIVEN je clique sur "Générer tous les bordereaux"
    WHEN la génération démarre
    THEN :
      • Le système affiche une barre de progression : "Génération en cours... 45/245 déposants"
      • Génère un PDF unique par déposant (stocké avec nom : "Reversement_EDI-2024-11-D245_MARTIN.pdf")
      • OU génère un PDF global avec tous les bordereaux (séparés par saut de page)
      • Marque tous les déposants en statut "Bordereau prêt"
      • Affiche : "✓ 245 bordereaux générés avec succès"
      • Propose : "Télécharger l'archive ZIP" (tous les PDFs) ou "Télécharger le PDF global"

  # AC-5 : Enregistrement du paiement effectif
  - GIVEN un déposant se présente pour récupérer ses invendus et son reversement
    AND j'ai son bordereau imprimé
    WHEN je coche son article dans le tableau et clique "Enregistrer le paiement"
    THEN un formulaire modal s'affiche :
      • Déposant : "MARTIN Sophie (EDI-2024-11-D245)"
      • Montant à reverser : "47,20€" (en gros caractères)
      • Mode de paiement : ● Espèces  ○ Chèque  ○ Virement (boutons radio)
      • Si Chèque : champ "N° de chèque" (obligatoire)
      • Si Virement : champ "Date virement prévu" (obligatoire)
      • Articles invendus récupérés : ☑ Oui (case à cocher obligatoire)
      • Commentaire optionnel (ex: "Absent, viendra jeudi")
      • Boutons : "Annuler" / "Confirmer le paiement"
    AND quand je confirme :
      • Le statut passe à "Payé"
      • L'horodatage est enregistré : "Payé le 07/11/2024 à 15:42 par Bénévole Clara D."
      • Un email de confirmation est envoyé au déposant (optionnel selon config)

  # AC-6 : Cas particulier - Aucune vente
  - GIVEN un déposant n'a vendu aucun article (0 vente)
    WHEN je consulte son bordereau
    THEN :
      • Montant total des ventes : 0,00€
      • Commission ALPE : 0,00€
      • Montant à reverser : 0,00€
      • Message : "ℹ️ Aucun article vendu. Seuls les invendus sont à récupérer."
      • La section "paiement" est remplacée par :
        Articles invendus récupérés : ☑ Oui
        Date de restitution : ___ / ___ / ______
        Signature déposant : ____________

  # AC-7 : Cas particulier - Tout vendu
  - GIVEN un déposant a vendu TOUS ses articles (100% vendus)
    WHEN je consulte son bordereau
    THEN :
      • Tableau "Articles INVENDUS" : vide ou message "✓ Tous les articles ont été vendus !"
      • Montant à reverser : [montant calculé]
      • Message encourageant : "🎉 Félicitations, tous vos articles ont trouvé preneur !"

  # AC-8 : Statistiques globales et export
  - GIVEN je veux analyser les résultats de l'édition
    WHEN je clique sur "Statistiques détaillées"
    THEN j'accède à un dashboard avec :
      • Résultats financiers :
        - Total ventes : 15 234,50€
        - Commission ALPE : 3 046,90€
        - Reversements : 12 187,60€
      • Résultats articles :
        - Articles déposés : 2 805
        - Articles vendus : 1 823 (65%)
        - Articles invendus : 982 (35%)
      • Répartition par catégorie (graphique) :
        - Vêtements : 75% de taux de vente
        - Chaussures : 60%
        - Livres : 80%
        - Jeux et jouets : 70%
        - Etc.
      • Top déposants (plus de ventes) : tableau top 10
      • Répartition des prix de vente (histogramme : combien d'articles entre 0-5€, 5-10€, etc.)
    AND je peux cliquer sur "Exporter Excel complet" pour obtenir :
      • Feuille 1 : Récapitulatif par déposant (1 ligne = 1 déposant)
      • Feuille 2 : Détail des ventes (1 ligne = 1 vente)
      • Feuille 3 : Détail des invendus (1 ligne = 1 article invendu)
      • Feuille 4 : Statistiques globales

  # AC-9 : Suivi des paiements en temps réel
  - GIVEN la phase de restitution est en cours (plusieurs bénévoles traitent les déposants)
    WHEN je consulte le tableau des reversements
    THEN :
      • Les statuts sont actualisés en temps réel (WebSocket ou polling)
      • Un compteur affiche : "142 / 245 déposants traités (58%)"
      • Filtres rapides : "À traiter" / "Payés aujourd'hui" / "En attente"
      • Indication visuelle : ligne verte si "Payé", orange si "Bordereau prêt", blanche si "À générer"

  # AC-10 : Clôture définitive de l'édition
  - GIVEN tous les déposants ont été traités (ou deadline de restitution dépassée)
    WHEN je clique sur "Clôturer l'édition"
    THEN :
      • Le système vérifie : "243 déposants traités, 2 absents (n'ont pas récupéré)"
      • Affiche un message de confirmation : "⚠️ Clôture définitive : les données seront archivées et les bordereaux ne seront plus modifiables. Continuer ?"
      • Si je confirme :
        - Le statut de l'édition passe à "Clôturée"
        - Les bordereaux passent en lecture seule
        - Un rapport final est généré automatiquement (PDF + Excel)
        - Une sauvegarde complète est créée
        - Message : "✓ Édition clôturée. Rapport final disponible en téléchargement."

  # AC-11 : Gestion des déposants absents
  - GIVEN un déposant ne s'est pas présenté pour récupérer ses invendus et son reversement
    WHEN je consulte son dossier
    THEN je peux :
      • Marquer comme "Absent - À recontacter"
      • Ajouter un commentaire : "Appelé le 08/11, viendra samedi prochain"
      • Envoyer un email de relance automatique : "Rappel : vos invendus et votre reversement de 47,20€ sont disponibles"
      • Si déposant revient plus tard : enregistrer le paiement normalement (même après clôture, avec dérogation)

  # AC-12 : Traçabilité complète
  - GIVEN je consulte l'historique d'un reversement
    WHEN j'accède aux détails du déposant
    THEN je vois :
      • Date génération bordereau : "07/11/2024 14:23 par Bénévole Alice M."
      • Date impression : "07/11/2024 14:45"
      • Date paiement : "08/11/2024 10:15 par Bénévole Clara D."
      • Mode de paiement : "Espèces"
      • Articles récupérés : "Oui, 18 invendus rendus"
      • Commentaires éventuels
      • PDF bordereau signé (si scanné) : lien de téléchargement

  # AC-13 : Corrections et ajustements
  - GIVEN je détecte une erreur sur un reversement (article mal scanné, vente non enregistrée, etc.)
    AND le reversement n'est pas encore payé
    WHEN je clique sur "Recalculer"
    THEN :
      • Le système recalcule le total des ventes en temps réel
      • Met à jour les montants (commission, reversement)
      • Régénère le bordereau PDF
      • Affiche un warning : "⚠️ Montant modifié : 47,20€ → 52,20€ (article ajouté)"
      • Log l'ajustement pour traçabilité : "Modifié le 08/11/2024 par Bénévole Alice M. : +5€ (article EDI-2024-11-L245-A12 ajouté)"

business_rules:
  - Commission ALPE fixe : 20% du montant des ventes
  - Reversement déposant fixe : 80% du montant des ventes
  - Arrondis comptables : 2 décimales, arrondi au centime le plus proche
  - Modes de paiement acceptés : Espèces (priorité), Chèque, Virement
  - Un bordereau signé = preuve de paiement (obligation légale de traçabilité)
  - Articles invendus DOIVENT être récupérés (ne pas rester chez ALPE)
  - Délai de récupération : généralement 2-3 jours après la bourse (créneaux définis)
  - Si déposant absent : relance, puis don à association si pas de réponse après 2 mois
  - Clôture édition : possible uniquement si >95% des déposants traités
  - Performance : génération de 250 bordereaux en < 2 minutes

technical_specs:
  pdf_generation:
    - Librairie : PDFKit (Node.js) ou jsPDF (navigateur) ou pdfmake
    - Format : A4 portrait
    - Polices : Roboto ou Arial pour lisibilité
    - Tableaux : bordures, alternance de couleurs pour lignes
    - Logo ALPE : en-tête, résolution 300 DPI minimum
    - Signature : zones dédiées (cadres pointillés)

  calculs:
    - Requête SQL JOIN entre articles, listes, ventes pour récupérer toutes les infos
    - Agrégation : SUM(prix_vente) GROUP BY deposant_id
    - Index sur deposant_id et edition_id pour performance
    - Calcul en backend (pas frontend) pour sécurité et cohérence

  export_excel:
    - Librairie : ExcelJS ou xlsx (Node.js)
    - Format : .xlsx (Excel 2007+)
    - Formatage : en-têtes en gras, colonnes auto-dimensionnées, filtres activés
    - Formules Excel : totaux calculés avec formules pour vérification

  temps_reel:
    - WebSocket pour mise à jour statuts en temps réel (plusieurs bénévoles)
    - Ou polling toutes les 5 secondes si WebSocket non dispo
    - Verrouillage optimiste : si 2 bénévoles traitent même déposant, alerte conflit

test_scenarios:
  - T-US005-01 : Accès section Reversements (OK, tableau 245 déposants, statistiques globales)
  - T-US005-02 : Calcul reversement déposant avec 12 ventes (OK, 59€ ventes → 11,80€ ALPE + 47,20€ déposant)
  - T-US005-03 : Génération bordereau PDF déposant standard (OK, PDF conforme, toutes sections présentes)
  - T-US005-04 : Génération en masse 245 bordereaux (OK, < 2 min, ZIP téléchargeable)
  - T-US005-05 : Enregistrement paiement espèces (OK, statut "Payé", horodatage correct)
  - T-US005-06 : Enregistrement paiement chèque avec n° (OK, n° chèque enregistré)
  - T-US005-07 : Cas 0 vente (OK, bordereau avec message "aucune vente", seulement section invendus)
  - T-US005-08 : Cas 100% vendu (OK, message félicitations, pas de tableau invendus)
  - T-US005-09 : Statistiques globales (OK, dashboard complet, graphiques, top 10)
  - T-US005-10 : Export Excel complet (OK, 4 feuilles, données cohérentes avec BDD)
  - T-US005-11 : Suivi temps réel 2 bénévoles (OK, compteur actualisé, pas de conflit)
  - T-US005-12 : Clôture édition (OK, passage "Clôturée", lecture seule, rapport final généré)
  - T-US005-13 : Déposant absent marqué (OK, statut "Absent", email relance envoyé)
  - T-US005-14 : Traçabilité reversement (OK, historique complet, qui/quand/comment)
  - T-US005-15 : Correction montant avant paiement (OK, recalcul, PDF régénéré, log ajustement)
  - T-US005-16 : Tentative clôture avec <90% traités (bloqué, message erreur)
  - T-US005-17 : Filtres tableau (OK, filtrage par statut, créneau, montant fonctionne)
  - T-US005-18 : Performance 245 bordereaux (OK, génération < 2 min, pas d'erreur mémoire)
  - T-US005-19 : Déposant revient après clôture (OK, paiement avec dérogation possible)
  - T-US005-20 : Vérification cohérence (OK, somme reversements + commissions = total ventes)
```

## US-006 — Créer une nouvelle édition de bourse

```yaml
id: US-006
title: Créer une nouvelle édition de bourse
actor: administrateur
benefit: "...pour organiser les bourses printemps/automne et permettre aux déposants et gestionnaires de travailler sur l'édition"
as_a: "En tant qu'administrateur de l'application ALPE"
i_want: "Je veux créer une nouvelle édition de bourse avec ses informations de base"
so_that: "Afin que les gestionnaires puissent ensuite la configurer et lancer le processus d'inscriptions"

# Contexte métier
notes: |
  - Généralement 2 éditions par an : printemps (mars-avril) et automne (septembre-octobre)
  - Une édition ne peut être créée que par un administrateur
  - Une fois créée, elle est en statut "brouillon" jusqu'à configuration complète
  - Seules les éditions configurées peuvent recevoir des inscriptions et articles

acceptance_criteria:
  # AC-1 : Accès à la création d'édition
  - GIVEN je suis connecté avec le rôle administrateur
    WHEN j'accède à la section "Gestion des éditions"
    THEN je vois un bouton "Créer une nouvelle édition"
    AND je vois la liste des éditions existantes (actives et archivées)

  # AC-2 : Affichage du formulaire de création
  - GIVEN je clique sur "Créer une nouvelle édition"
    WHEN le formulaire s'affiche
    THEN je vois les champs suivants :
      • Nom de l'édition (obligatoire, ex: "Bourse Printemps 2025")
      • Date et heure de début (obligatoire, sélecteur date + heure)
      • Date et heure de fin (obligatoire, sélecteur date + heure)
      • Lieu (optionnel, ex: "Salle des fêtes, Plaisance-du-Touch")
      • Description (optionnel, texte libre)
      • Statut initial (automatique: "Brouillon")
    AND un bouton "Créer l'édition" et un bouton "Annuler"

  # AC-3 : Validation et création réussie
  - GIVEN je remplis tous les champs obligatoires avec des valeurs valides
    AND aucune édition avec le même nom n'existe déjà
    WHEN je clique sur "Créer l'édition"
    THEN le système crée l'édition avec le statut "Brouillon"
    AND m'affiche un message de confirmation : "Édition '[Nom]' créée avec succès"
    AND me redirige vers la page de configuration de cette édition
    AND l'édition apparaît dans la liste des éditions avec une étiquette "Brouillon"

  # AC-4 : Erreur - nom d'édition en double
  - GIVEN je saisis un nom d'édition qui existe déjà dans le système
    WHEN je tente de créer l'édition
    THEN le système affiche une erreur : "Une édition avec ce nom existe déjà. Veuillez choisir un nom différent."
    AND le formulaire reste affiché avec mes données pré-remplies

  # AC-5 : Validation de la cohérence des dates et heures
  - GIVEN je remplis les dates et heures de l'édition
    AND la date/heure de fin est antérieure ou égale à la date/heure de début
    WHEN je tente de valider le formulaire
    THEN le système affiche une erreur : "La date et heure de fin doivent être postérieures à la date et heure de début"
    AND bloque la soumission

  # AC-6 : Erreur - champs obligatoires manquants
  - GIVEN je n'ai pas rempli un ou plusieurs champs obligatoires (nom, date/heure début, date/heure fin)
    WHEN je tente de soumettre le formulaire
    THEN le système affiche des messages d'erreur sous chaque champ manquant
    AND bloque la soumission jusqu'à correction

  # AC-7 : Annulation de la création
  - GIVEN je suis en train de remplir le formulaire de création
    WHEN je clique sur "Annuler"
    THEN le système me demande confirmation : "Êtes-vous sûr de vouloir annuler ? Les données saisies seront perdues."
    AND si je confirme, me ramène à la liste des éditions sans créer l'édition

  # AC-8 : Contrôle d'accès - non-administrateur
  - GIVEN je suis connecté avec un rôle autre qu'administrateur (gestionnaire, bénévole, déposant)
    WHEN j'essaie d'accéder à la création d'édition (URL directe ou navigation)
    THEN le système affiche un message : "Accès refusé. Seuls les administrateurs peuvent créer des éditions."
    AND me redirige vers ma page d'accueil

  # AC-9 : Horodatage et traçabilité
  - GIVEN une édition vient d'être créée
    WHEN je consulte ses métadonnées
    THEN je vois :
      • Date/heure de création
      • Créée par (nom de l'administrateur)
      • Dernière modification (date/heure)
      • Modifiée par (nom)

dependencies: []

links:
  - rel: requirement
    id: REQ-F-006  # TODO : créer exigence pour création d'éditions
  - rel: requirement
    id: REQ-NF-003  # RGPD
  - rel: persona
    id: Administrateur

# Règles métier complémentaires
business_rules:
  - Seuls les administrateurs peuvent créer des éditions
  - Le nom d'une édition doit être unique dans tout le système
  - Une édition créée est en statut "Brouillon" par défaut
  - Une édition en brouillon ne peut pas recevoir d'inscriptions ni d'articles
  - La date/heure de fin doit être strictement postérieure à la date/heure de début
  - Le statut passe de "Brouillon" à "Configurée" après configuration des dates opérationnelles (US-007)

# États du cycle de vie d'une édition
edition_lifecycle:
  - Brouillon : créée mais non configurée
  - Configurée : dates définies, prête pour inscriptions
  - Inscriptions ouvertes : import Billetweb possible
  - En cours : période de dépôt/vente active
  - Clôturée : terminée, en lecture seule
  - Archivée : historique, non modifiable

# Données de l'édition
data_model:
  - id (UUID, généré automatiquement)
  - nom (string, unique, max 100 caractères)
  - datetime_debut (datetime, obligatoire)
  - datetime_fin (datetime, obligatoire)
  - lieu (string, max 200 caractères, optionnel)
  - description (text, optionnel)
  - statut (enum selon lifecycle ci-dessus)
  - created_at (timestamp)
  - created_by (référence utilisateur administrateur)
  - updated_at (timestamp)
  - updated_by (référence utilisateur)

  # Dates opérationnelles (configurées via US-007)
  - dates_depot (array de dates, configuré ultérieurement)
  - dates_vente (array de dates, configuré ultérieurement)
  - date_retour_invendus (date, configuré ultérieurement)
  - taux_commission (decimal, configuré ultérieurement)

# Cas de test suggérés
test_scenarios:
  - T-US006-01 : Création nominale avec date/heure valides (ex: 15/03/2025 08h00 au 17/03/2025 18h00)
  - T-US006-02 : Création d'une édition avec nom en double (erreur)
  - T-US006-03 : Champs obligatoires manquants (nom, date/heure début, date/heure fin)
  - T-US006-04 : Date/heure fin antérieure ou égale à date/heure début (erreur)
  - T-US006-05 : Lieu non renseigné (OK, optionnel)
  - T-US006-06 : Description non renseignée (OK, optionnel)
  - T-US006-07 : Annulation du formulaire avec confirmation
  - T-US006-08 : Tentative de création par un gestionnaire (accès refusé)
  - T-US006-09 : Tentative de création par un bénévole (accès refusé)
  - T-US006-10 : Tentative de création par un déposant (accès refusé)
  - T-US006-11 : Vérification métadonnées (horodatage, créateur)
  - T-US006-12 : Affichage de l'édition dans la liste avec statut "Brouillon"
```

## US-007 — Configurer les dates clés d'une édition

```yaml
id: US-007
title: Configurer les dates clés d'une édition
actor: gestionnaire
benefit: "...pour définir le calendrier de l'édition et permettre le bon déroulement des opérations"
as_a: "En tant que gestionnaire de bourse"
i_want: "Je veux définir les dates importantes d'une édition (dépôt, vente, récupération)"
so_that: "Afin d'organiser les opérations et informer les déposants du planning"

# Contexte métier
notes: |
  - Cette configuration suit la création d'édition (US-006)
  - Un gestionnaire (ou administrateur) peut configurer les dates
  - Les dates doivent être cohérentes chronologiquement
  - Une fois les dates définies, l'édition passe en statut "Configurée"

acceptance_criteria:
  # AC-1 : Accès à la configuration
  - GIVEN je suis connecté avec le rôle gestionnaire ou administrateur
    AND une édition existe en statut "Brouillon" ou "Configurée"
    WHEN j'accède à la page de configuration de cette édition
    THEN je vois un formulaire avec les champs de dates suivants :
      • Date de début des inscriptions (optionnel, informatif - géré par Billetweb)
      • Date de fin des inscriptions (optionnel, informatif - géré par Billetweb)
      • **Date limite de déclaration des articles** (obligatoire, date avant laquelle les déposants doivent compléter leurs listes)
      • Date(s) de dépôt des articles (obligatoire, peut être plusieurs dates)
      • Date(s) de vente (obligatoire, peut être plusieurs dates/période)
      • Date de récupération des invendus (obligatoire)
      • **Paramètres tarifaires** :
        - Taux de commission ALPE (%, obligatoire, par défaut 20%)
        - Note informative : "Les frais d'inscription (5€ pour 2 listes) sont gérés via Billetweb et non remboursables"
      • Catégories d'articles autorisées (multi-sélection)

  # AC-2 : Saisie et validation des dates
  - GIVEN je remplis la date limite de déclaration, les dates de dépôt, vente et récupération
    AND les dates respectent l'ordre chronologique : date_limite_declaration < dépôt < vente < récupération
    AND je définis un taux de commission valide (entre 0 et 100%, par défaut 20%)
    WHEN je valide le formulaire
    THEN le système enregistre toutes les dates et le taux de commission
    AND passe l'édition au statut "Configurée"
    AND affiche un message : "Configuration enregistrée. L'édition est maintenant prête pour l'import des inscriptions."
    AND les déposants pourront déclarer leurs articles jusqu'à la date limite configurée

  # AC-2bis : Configuration des créneaux de dépôt avec capacités
  - GIVEN je configure les dates de dépôt pour l'édition
    WHEN j'ajoute un créneau de dépôt
    THEN le système m'affiche un formulaire pour chaque créneau :
      • Date du créneau (ex: mercredi 13/03/2025)
      • Heure de début (ex: 9h30)
      • Heure de fin (ex: 11h30)
      • Capacité maximum de déposants (ex: 20)
      • Case à cocher "Réservé aux habitants de Plaisance-du-Touch"
      • Description optionnelle
    AND je peux ajouter plusieurs créneaux sur différents jours
    AND le système propose des exemples de capacités standard :
      - Mercredi matin 9h30-11h30 : 20 déposants
      - Mercredi après-midi 14h-18h : 40 déposants
      - Mercredi soir 20h-22h : 20 déposants (réservé Plaisançois)
      - Jeudi matin 9h30-12h : 15 déposants
      - Jeudi soir 17h-21h : 32 déposants
      - Vendredi matin 9h30-12h : 15 déposants (réservé Plaisançois)
    AND une fois les créneaux configurés, les déposants peuvent réserver leur créneau via Billetweb
    AND le système bloque les réservations une fois la capacité atteinte

  # AC-3 : Erreur - incohérence chronologique
  - GIVEN je saisis des dates incohérentes (ex: récupération avant vente)
    WHEN je tente de valider
    THEN le système affiche une erreur explicite : "Les dates doivent respecter l'ordre : dépôt → vente → récupération"
    AND bloque la soumission

  # AC-4 : Modification de dates existantes
  - GIVEN une édition est déjà configurée avec des dates
    AND aucune inscription n'a encore été importée
    WHEN je modifie les dates et valide
    THEN le système enregistre les nouvelles dates
    AND affiche un message de confirmation

  # AC-5 : Protection - édition avec inscriptions actives
  - GIVEN une édition a déjà des inscriptions importées et des déposants actifs
    WHEN je tente de modifier les dates critiques (dépôt, vente, récupération)
    THEN le système affiche un avertissement : "Cette édition contient déjà [X] déposants. Modifier les dates nécessitera de les notifier. Confirmer ?"
    AND nécessite une confirmation explicite avant modification
    AND envoie automatiquement une notification aux déposants impactés

  # AC-6 : Contrôle d'accès - rôles autorisés
  - GIVEN je suis connecté en tant que bénévole ou déposant
    WHEN j'essaie d'accéder à la configuration d'édition
    THEN le système refuse l'accès : "Accès réservé aux gestionnaires et administrateurs"

dependencies:
  - US-006  # Créer une édition

links:
  - rel: requirement
    id: REQ-F-007  # TODO : créer exigence pour configuration d'éditions
  - rel: persona
    id: Gestionnaire

# Règles métier complémentaires
business_rules:
  - Les dates doivent respecter l'ordre : inscriptions < date_limite_declaration < dépôt < vente < récupération
  - La date limite de déclaration doit être antérieure à la première date de dépôt (pour laisser le temps aux déposants)
  - Le taux de commission doit être entre 0 et 100% (par défaut 20% selon règlement ALPE)
  - Tarification ALPE : 5€ frais d'inscription (Billetweb, non remboursable) + 20% commission sur ventes
  - Modification possible sans restriction tant qu'aucune inscription n'est importée
  - Modification avec notification obligatoire si des déposants sont actifs
  - Le statut passe de "Brouillon" à "Configurée" après validation
  - Après la date limite de déclaration, les déposants ne peuvent plus modifier leurs listes

# Données de configuration
configuration_data:
  - date_debut_inscriptions (date, optionnel - informatif)
  - date_fin_inscriptions (date, optionnel - informatif)
  - date_limite_declaration (date, obligatoire - bloque modification listes après cette date)
  - dates_depot (array de dates, min 1, obligatoire)
  - dates_vente (array de dates/période, min 1, obligatoire)
  - date_recuperation (date, obligatoire)
  - taux_commission (decimal, 0-100, par défaut 20%)
  - categories_autorisees (array, ex: ["Vêtements enfants", "Jouets", "Livres", "Puériculture"])

# Cas de test suggérés
test_scenarios:
  - T-US007-01 : Configuration nominale avec dates valides
  - T-US007-02 : Dates incohérentes (récupération avant vente)
  - T-US007-03 : Taux de commission invalide (> 100%)
  - T-US007-04 : Modification sans inscriptions (OK sans notification)
  - T-US007-05 : Modification avec inscriptions actives (notification requise)
  - T-US007-06 : Accès refusé pour bénévole
  - T-US007-07 : Accès refusé pour déposant
  - T-US007-08 : Changement de statut Brouillon → Configurée
```

## US-008 — Importer les inscriptions depuis Billetweb

```yaml
id: US-008
title: Importer les inscriptions depuis Billetweb
actor: gestionnaire
benefit: "...pour intégrer rapidement les déposants inscrits et lancer les invitations"
as_a: "En tant que gestionnaire de bourse"
i_want: "Je veux importer le fichier d'inscriptions depuis Billetweb"
so_that: "Afin d'associer les comptes existants à cette édition et d'émettre des invitations pour les nouveaux déposants"

# Contexte métier
notes: |
  - Les inscriptions se font sur Billetweb (plateforme externe de billetterie)
  - Un fichier Excel (.xlsx) est exporté depuis Billetweb et importé dans l'application
  - Le fichier contient 35 colonnes (A à AI), dont 13 sont utiles pour l'application
  - L'import doit gérer les déposants existants et les nouveaux
  - Seuls les billets avec Payé="Oui" ET Valide="Oui" sont importés
  - Le créneau (colonne Séance) doit correspondre aux créneaux configurés dans l'édition (US-007)
  - Le tarif (colonne Tarif) indique le type de liste : standard, 1000, ou 2000
  - Volume attendu : 200-300 inscriptions par édition

acceptance_criteria:
  # AC-1 : Accès à l'import
  - GIVEN je suis connecté en tant que gestionnaire ou administrateur
    AND une édition existe en statut "Configurée" (dates définies)
    WHEN j'accède à la page de gestion de cette édition
    THEN je vois un bouton "Importer les inscriptions Billetweb"
    AND une indication du nombre d'inscriptions déjà importées pour cette édition

  # AC-2 : Sélection et upload du fichier
  - GIVEN je clique sur "Importer les inscriptions Billetweb"
    WHEN la modale d'import s'affiche
    THEN je vois :
      • Un champ de sélection de fichier (formats acceptés : .xlsx, .xls)
      • Des instructions : "Exportez le fichier depuis Billetweb et importez-le tel quel. Seuls les billets payés et valides seront traités."
      • Une liste des colonnes requises : Nom, Prénom, Email, Séance, Tarif, Payé, Valide, Téléphone, Code postal, Ville
      • Un bouton "Prévisualiser" et un bouton "Importer"

  # AC-3 : Prévisualisation avant import
  - GIVEN j'ai sélectionné un fichier valide
    WHEN je clique sur "Prévisualiser"
    THEN le système analyse le fichier
    AND affiche un tableau récapitulatif :
      • Nombre total de lignes dans le fichier : 287
      • Billets non payés ou non valides (ignorés) : 12
      • Billets payés et valides à traiter : 275
      • Nombre de déposants existants (email déjà en base) : 123
      • Nombre de nouveaux déposants (email inconnu) : 142
      • Doublons dans le fichier (même email, seule 1ère occurrence gardée) : 8
      • Créneaux non reconnus (erreur bloquante) : 2
      • Emails invalides (erreur bloquante) : 1
      • Détail des erreurs ligne par ligne s'il y en a

  # AC-4 : Import réussi
  - GIVEN la prévisualisation ne montre aucune erreur bloquante
    WHEN je clique sur "Importer"
    THEN le système :
      • Associe les déposants existants à l'édition (via email)
      • Crée les nouveaux comptes en statut "Invitation envoyée"
      • Génère et envoie les emails d'invitation (US-001) aux nouveaux
      • Affiche un résumé : "[X] déposants existants associés, [Y] nouvelles invitations envoyées"
    AND me redirige vers la liste des déposants de l'édition
    AND enregistre l'import dans les logs d'audit (qui, quand, combien)

  # AC-5 : Gestion des doublons dans le fichier
  - GIVEN le fichier contient plusieurs lignes avec le même email
    WHEN je lance la prévisualisation
    THEN le système détecte les doublons
    AND affiche un avertissement : "Le fichier contient [X] doublons (même email). Seule la première occurrence sera importée."
    AND me permet de confirmer ou annuler

  # AC-6 : Gestion des déposants déjà associés à l'édition
  - GIVEN certains emails du fichier correspondent à des déposants déjà associés à cette édition
    WHEN je lance l'import
    THEN le système ignore ces lignes sans erreur
    AND affiche dans le résumé : "[Z] déposants déjà inscrits à cette édition (ignorés)"

  # AC-7 : Erreur - format de fichier invalide
  - GIVEN le fichier ne respecte pas le format attendu (colonnes manquantes)
    WHEN je lance la prévisualisation
    THEN le système affiche une erreur explicite : "Format de fichier invalide. Colonnes requises manquantes : [liste des colonnes manquantes parmi : J, K, L, F, G, Y, Z, AE, AG, AH]. Utilisez le fichier d'export Billetweb sans modification."
    AND bloque l'import

  # AC-8 : Erreur - créneaux non reconnus
  - GIVEN certaines lignes contiennent des créneaux (colonne F : Séance) qui ne correspondent pas aux créneaux configurés dans l'édition
    WHEN je lance la prévisualisation
    THEN le système affiche un tableau des erreurs :
      Ligne 45 : Créneau "Samedi 14h" non reconnu. Créneaux disponibles : [liste des créneaux configurés]
      Ligne 78 : Créneau "Dimanche 10h" non reconnu
    AND bloque l'import avec le message : "3 créneaux non reconnus. Vérifiez la configuration des créneaux (US-007) ou corrigez le fichier."

  # AC-10 : Erreur - données invalides
  - GIVEN certaines lignes contiennent des emails invalides ou téléphones mal formatés
    WHEN je lance la prévisualisation
    THEN le système affiche un tableau des erreurs ligne par ligne
    AND me permet soit de :
      • Corriger le fichier et réessayer
      • Ignorer les lignes en erreur et importer le reste (avec confirmation)

  # AC-11 : Notification aux déposants existants
  - GIVEN des déposants existants sont associés à la nouvelle édition
    WHEN l'import est terminé
    THEN le système leur envoie un email de notification :
      "Bonjour [Prénom], vous êtes inscrit(e) à l'édition [Nom édition]. Connectez-vous pour déclarer vos articles."

  # AC-12 : Limitation de taille de fichier
  - GIVEN le fichier uploadé dépasse 5 Mo ou contient plus de 500 lignes
    WHEN je tente de l'importer
    THEN le système affiche : "Fichier trop volumineux. Maximum 5 Mo ou 500 inscriptions par import."

  # AC-13 : Contrôle d'accès
  - GIVEN je suis connecté en tant que bénévole ou déposant
    WHEN j'essaie d'accéder à l'import Billetweb
    THEN le système refuse l'accès

dependencies:
  - US-006  # Créer une édition
  - US-007  # Configurer les dates
  - US-001  # Activation invitation (pour nouveaux déposants)

links:
  - rel: requirement
    id: REQ-F-008  # TODO : créer exigence pour import Billetweb
  - rel: persona
    id: Gestionnaire
  - rel: external
    href: https://www.billetweb.fr/

# Règles métier complémentaires
business_rules:
  - L'import n'est possible que si l'édition est en statut "Configurée"
  - Seuls les billets avec Payé="Oui" ET Valide="Oui" sont importés
  - Un email ne peut être associé qu'une seule fois à une édition donnée
  - Les créneaux (colonne Séance) doivent correspondre exactement aux créneaux configurés (US-007)
  - Le tarif indique le type de liste : mapping à définir (ex: "Adhérent" → liste 1000, "Standard" → standard)
  - Les déposants existants sont associés automatiquement (via email)
  - Les nouveaux reçoivent une invitation (token 7 jours comme US-001 ou US-010)
  - L'import est traçé pour audit (qui, quand, nombre d'inscriptions, fichier source)
  - Maximum 500 inscriptions par fichier
  - Format accepté : Excel (.xlsx, .xls) - export direct de Billetweb

# Format du fichier Billetweb (export direct)
file_format:
  source: "Export Billetweb (35 colonnes A à AI)"
  format: "Excel (.xlsx ou .xls)"

  colonnes_utilisees:
    D: "Date de création (datetime, info)"
    F: "Séance (string, obligatoire) - Créneau de dépôt, doit matcher créneaux configurés"
    G: "Tarif (string, obligatoire) - Type de billet, détermine type de liste (standard/1000/2000)"
    J: "Nom (string, obligatoire)"
    K: "Prénom (string, obligatoire)"
    L: "Email (string, obligatoire, format email validé)"
    P: "Commande (string, info) - Référence commande Billetweb pour traçabilité"
    Y: "Payé (string, obligatoire) - Valeurs : 'Oui' ou 'Non', seuls 'Oui' importés"
    Z: "Valide (string, obligatoire) - Valeurs : 'Oui' ou 'Non', seuls 'Oui' importés"
    AE: "Téléphone (string, obligatoire) - Format français"
    AF: "Adresse (string, optionnel) - Numéro et nom de rue"
    AG: "Code postal (string, obligatoire) - Pour identifier Plaisançois (31830)"
    AH: "Ville (string, obligatoire)"

  colonnes_ignorees: "B, C, E, H, I, M, N, O, Q, R, S, T, U, V, W, X, AA, AB, AC, AD, AI (22 colonnes non utilisées)"

  validations:
    - "Colonne Y (Payé) = 'Oui' ET Colonne Z (Valide) = 'Oui' (sinon ligne ignorée)"
    - "Colonne L (Email) : format email RFC 5322"
    - "Colonne F (Séance) : doit exister dans les créneaux configurés de l'édition"
    - "Colonne G (Tarif) : mapping vers type de liste (à définir selon tarifs Billetweb)"
    - "Colonne AE (Téléphone) : format français (10 chiffres commençant par 0)"
    - "Doublons email : seule la première occurrence est gardée"

# Cas de test suggérés
test_scenarios:
  - T-US008-01 : Import nominal avec 10 déposants payés et valides (5 nouveaux, 5 existants)
  - T-US008-02 : Fichier avec billets non payés ou non valides (ignorés, pas d'erreur)
  - T-US008-03 : Fichier avec créneaux non reconnus (erreur bloquante, liste des créneaux disponibles)
  - T-US008-04 : Fichier avec doublons email (seule 1ère occurrence gardée, warning)
  - T-US008-05 : Fichier avec emails invalides (erreur, tableau ligne par ligne)
  - T-US008-06 : Fichier format invalide (colonnes manquantes J, K, L, F, etc.)
  - T-US008-07 : Fichier trop volumineux (> 5 Mo ou > 500 lignes)
  - T-US008-08 : Import sur édition non configurée (bouton absent ou erreur)
  - T-US008-09 : Déposants déjà associés à l'édition (ignorés)
  - T-US008-10 : Accès refusé pour bénévole/déposant
  - T-US008-11 : Vérification emails d'invitation envoyés aux nouveaux (avec créneau et type liste)
  - T-US008-12 : Vérification emails de notification envoyés aux existants
  - T-US008-13 : Traçabilité de l'import dans les logs (fichier, nombre, date, gestionnaire)
  - T-US008-14 : Mapping tarif Billetweb vers type de liste (standard/1000/2000)
  - T-US008-15 : Identification Plaisançois via code postal 31830
```

## US-009 — Clôturer une édition de bourse

```yaml
id: US-009
title: Clôturer une édition de bourse
actor: administrateur
benefit: "...pour finaliser l'édition, calculer les reversements et archiver les données"
as_a: "En tant qu'administrateur"
i_want: "Je veux clôturer définitivement une édition de bourse terminée"
so_that: "Afin de valider les reversements, archiver les données et libérer le système pour la prochaine édition"

# Contexte métier
notes: |
  - La clôture est l'étape finale du cycle de vie d'une édition
  - Elle ne peut être effectuée que par un administrateur
  - Elle nécessite des validations préalables (tous les reversements calculés, etc.)
  - Une fois clôturée, l'édition passe en lecture seule

acceptance_criteria:
  # AC-1 : Accès à la clôture
  - GIVEN je suis connecté en tant qu'administrateur
    AND une édition existe en statut "En cours"
    AND la date de récupération est passée
    WHEN j'accède à la page de gestion de cette édition
    THEN je vois un bouton "Clôturer l'édition"

  # AC-2 : Pré-requis de clôture
  - GIVEN je clique sur "Clôturer l'édition"
    WHEN le système vérifie les pré-requis
    THEN il affiche une checklist de validation :
      • Tous les reversements ont été calculés ✓/✗
      • Tous les paiements déposants sont en statut final (payé/annulé) ✓/✗
      • Aucune vente en attente de validation ✓/✗
      • Inventaire des invendus réconcilié ✓/✗
    AND si toutes les conditions sont remplies, affiche un bouton "Confirmer la clôture"
    AND sinon, affiche les blocages et désactive le bouton

  # AC-3 : Confirmation et clôture réussie
  - GIVEN tous les pré-requis sont remplis
    WHEN je clique sur "Confirmer la clôture"
    THEN le système affiche une modale de confirmation :
      "Attention : la clôture est définitive. L'édition passera en lecture seule et ne pourra plus être modifiée. Confirmez-vous ?"
    AND si je confirme, le système :
      • Passe l'édition en statut "Clôturée"
      • Horodate la clôture (date, heure, administrateur)
      • Génère un rapport de clôture PDF (statistiques, reversements, totaux)
      • Envoie une notification aux gestionnaires : "L'édition [Nom] a été clôturée"
      • Verrouille toute modification sur les données de l'édition
      • Affiche un message : "Édition clôturée avec succès. Rapport disponible en téléchargement."

  # AC-4 : Édition clôturée en lecture seule
  - GIVEN une édition est en statut "Clôturée"
    WHEN un utilisateur (même administrateur) tente de modifier ses données
    THEN le système bloque la modification
    AND affiche : "Cette édition est clôturée et ne peut plus être modifiée"
    AND toutes les données restent consultables en lecture seule

  # AC-5 : Rapport de clôture
  - GIVEN une édition vient d'être clôturée
    WHEN je consulte sa page de détails
    THEN je vois un bouton "Télécharger le rapport de clôture"
    AND le rapport PDF contient :
      • Informations édition (nom, dates, lieu)
      • Statistiques générales (nb déposants, articles déposés, vendus, invendus)
      • Montant total des ventes
      • Montant total des commissions ALPE
      • Montant total des reversements déposants
      • Liste récapitulative des reversements par déposant
      • Date et responsable de clôture

  # AC-6 : Erreur - pré-requis non remplis
  - GIVEN je tente de clôturer une édition
    AND certains pré-requis ne sont pas remplis (ex: reversements non calculés)
    WHEN je clique sur "Clôturer l'édition"
    THEN le système affiche les blocages :
      "Impossible de clôturer : [liste des problèmes]"
    AND désactive le bouton de confirmation

  # AC-7 : Archivage ultérieur (optionnel)
  - GIVEN une édition est clôturée depuis plus de 1 an
    WHEN un administrateur accède à la liste des éditions
    THEN il peut marquer l'édition comme "Archivée"
    AND elle passe dans un onglet "Archives" distinct pour alléger la vue principale

  # AC-8 : Contrôle d'accès strict
  - GIVEN je suis connecté en tant que gestionnaire, bénévole ou déposant
    WHEN j'essaie d'accéder à la clôture d'édition
    THEN le système refuse : "Seuls les administrateurs peuvent clôturer une édition"

dependencies:
  - US-006  # Créer une édition
  - US-005  # Générer les reversements (à détailler)

links:
  - rel: requirement
    id: REQ-F-009  # TODO : créer exigence pour clôture d'éditions
  - rel: persona
    id: Administrateur

# Règles métier complémentaires
business_rules:
  - Seuls les administrateurs peuvent clôturer une édition
  - La clôture nécessite que tous les reversements soient calculés
  - Une édition clôturée est en lecture seule définitive
  - La clôture génère automatiquement un rapport PDF
  - La clôture est tracée (date, heure, administrateur)
  - Les données restent consultables indéfiniment

# Statut après clôture
post_closure:
  - Toutes les données de l'édition restent accessibles en lecture seule
  - Aucune modification n'est possible (même pour administrateurs)
  - Le rapport de clôture est conservé et téléchargeable
  - L'édition peut être archivée après 1 an pour alléger la vue

# Cas de test suggérés
test_scenarios:
  - T-US009-01 : Clôture nominale avec tous pré-requis OK
  - T-US009-02 : Tentative de clôture avec reversements manquants (bloqué)
  - T-US009-03 : Tentative de clôture avec ventes en attente (bloqué)
  - T-US009-04 : Vérification lecture seule après clôture
  - T-US009-05 : Génération et contenu du rapport PDF
  - T-US009-06 : Notification envoyée aux gestionnaires
  - T-US009-07 : Accès refusé pour gestionnaire/bénévole/déposant
  - T-US009-08 : Traçabilité de la clôture (date, administrateur)
  - T-US009-09 : Archivage d'une édition clôturée (> 1 an)
```

## US-010 — Émettre des invitations manuellement en masse

```yaml
id: US-010
title: Émettre des invitations manuellement en masse
actor: gestionnaire
benefit: "...pour permettre aux déposants de s'inscrire et déclarer leurs articles avant la bourse"
as_a: "En tant que gestionnaire responsable des inscriptions"
i_want: "Je veux créer et envoyer des invitations en masse aux déposants potentiels"
so_that: "Afin de leur permettre d'activer leur compte et déclarer leurs articles dans les délais"

# Contexte métier
notes: |
  - Deux modes d'inscription : via Billetweb (US-008) OU invitation manuelle (US-010)
  - Les invitations manuelles servent à :
    * Inviter des anciens déposants (déjà dans la base)
    * Inviter de nouveaux déposants non passés par Billetweb
    * Corriger des erreurs d'import Billetweb
    * Gérer des cas exceptionnels (adhérents ALPE, VIP, bénévoles)
  - Chaque invitation génère un token unique valide 7 jours
  - Un email est envoyé automatiquement avec lien d'activation
  - Les invitations peuvent être relancées si non activées
  - Volume attendu : 50-100 invitations manuelles par édition

acceptance_criteria:
  # AC-1 : Accès à l'interface d'invitation
  - GIVEN je suis connecté en tant que gestionnaire
    AND une édition est en statut "Inscriptions ouvertes"
    WHEN j'accède à la section "Gestion des invitations"
    THEN je vois :
      • Un tableau listant toutes les invitations de l'édition en cours :
        - Email déposant
        - Nom/Prénom (si connu)
        - Date d'envoi
        - Statut : "En attente" / "Activée" / "Expirée"
        - Date d'activation (si activée)
        - Actions : "Relancer" / "Annuler"
      • Des filtres : par statut, par date d'envoi
      • Un bouton "Nouvelle invitation"
      • Un bouton "Invitations en masse"
      • Des statistiques globales en haut :
        - Total invitations envoyées : 245
        - Activées : 198 (81%)
        - En attente : 35 (14%)
        - Expirées : 12 (5%)

  # AC-2 : Création d'une invitation unique
  - GIVEN je clique sur "Nouvelle invitation"
    WHEN le formulaire s'affiche
    THEN je vois les champs :
      • Email du déposant (obligatoire, validation format email)
      • Nom (optionnel, max 50 caractères)
      • Prénom (optionnel, max 50 caractères)
      • Type de liste : ○ Standard  ○ Liste 1000  ○ Liste 2000 (boutons radio)
      • Commentaire interne (optionnel, non visible du déposant, ex: "Ancien déposant 2023")
      • Case à cocher : ☑ Envoyer l'email d'invitation immédiatement
      • Boutons : "Annuler" / "Créer l'invitation"
    AND quand je valide :
      • Le système vérifie que l'email n'a pas déjà une invitation active pour cette édition
      • Crée l'invitation avec un token unique
      • Si case cochée : envoie l'email immédiatement
      • Affiche : "✓ Invitation créée et envoyée à sophie.martin@example.com"

  # AC-3 : Validation unicité email par édition
  - GIVEN un email a déjà une invitation active (non expirée) pour l'édition en cours
    WHEN je tente de créer une nouvelle invitation avec cet email
    THEN :
      • Le système affiche une erreur : "⚠️ Une invitation active existe déjà pour cet email (envoyée le 03/11/2024, expire le 10/11/2024)"
      • Propose 2 options :
        - "Annuler l'invitation existante et créer une nouvelle" (bouton)
        - "Relancer l'invitation existante" (bouton)
      • La création est bloquée jusqu'à résolution

  # AC-4 : Invitations en masse par CSV
  - GIVEN je clique sur "Invitations en masse"
    WHEN le formulaire s'affiche
    THEN je vois :
      • Un bouton "Télécharger le modèle CSV" (template avec colonnes attendues)
      • Une zone de dépôt de fichier : "Glissez votre fichier CSV ici ou cliquez pour parcourir"
      • Format attendu affiché :
        Colonnes obligatoires : email
        Colonnes optionnelles : nom, prenom, type_liste (standard/1000/2000), commentaire
      • Exemple :
        email,nom,prenom,type_liste,commentaire
        sophie.martin@example.com,Martin,Sophie,standard,Ancien déposant 2023
        jean.dupont@example.com,Dupont,Jean,1000,Adhérent ALPE
      • Case à cocher : ☑ Envoyer tous les emails immédiatement après import
      • Boutons : "Annuler" / "Valider et importer"

  # AC-5 : Validation du fichier CSV
  - GIVEN je sélectionne un fichier CSV pour import en masse
    WHEN je clique sur "Valider et importer"
    THEN le système :
      • Valide le format CSV (séparateur virgule, encodage UTF-8)
      • Vérifie la présence de la colonne "email"
      • Valide chaque email (format correct)
      • Vérifie que type_liste est dans : standard, 1000, 2000 (si fourni)
      • Détecte les doublons dans le fichier
      • Vérifie les emails déjà invités pour l'édition en cours
      • Affiche un rapport de validation :
        - ✓ 45 invitations valides à créer
        - ⚠️ 3 emails en doublon dans le fichier (ignorés)
        - ⚠️ 2 emails déjà invités pour cette édition (ignorés)
        - ❌ 1 email invalide : "jean.dupont@" (ligne 12)
      • Si erreurs critiques (emails invalides) : affiche la liste et bloque l'import
      • Si seulement warnings : propose "Continuer avec 45 invitations" ou "Annuler"

  # AC-6 : Import en masse effectif
  - GIVEN le rapport de validation affiche 45 invitations valides
    WHEN je confirme l'import
    THEN :
      • Le système affiche une barre de progression : "Création des invitations... 12/45"
      • Crée 45 invitations avec tokens uniques
      • Si case "Envoyer immédiatement" cochée : envoie les 45 emails (affichage progression)
      • Affiche un rapport final :
        - ✓ 45 invitations créées avec succès
        - ✓ 45 emails envoyés (si case cochée) ou "⏸ En attente d'envoi" (si non cochée)
        - ⚠️ 2 emails en échec d'envoi : liste des emails + raison
      • Propose : "Télécharger le rapport CSV" (avec colonnes : email, statut, token, date_envoi, erreur_envoi)

  # AC-7 : Contenu de l'email d'invitation
  - GIVEN une invitation est envoyée à un déposant
    WHEN l'email arrive dans sa boîte
    THEN il contient :
      • Objet : "Bourse Automne 2024 ALPE - Activez votre compte déposant"
      • Corps :
        - Logo ALPE
        - "Bonjour Sophie," (si prénom connu) ou "Bonjour," (si inconnu)
        - Texte explicatif : "Vous êtes invité(e) à participer à la Bourse Automne 2024 d'ALPE Plaisance du Touch."
        - Si type liste 1000/2000 : "Vous bénéficiez d'une liste adhérent [1000/2000] avec restitution prioritaire."
        - Bouton CTA : "Activer mon compte" (lien vers page activation avec token)
        - Informations importantes :
          * Date limite de déclaration des articles : 20/11/2024
          * Date de la bourse : 30/11-01/12/2024
          * Ce lien est valide 7 jours (jusqu'au 14/11/2024)
        - Lien vers règlement déposant
        - Footer : Contact ALPE, mentions légales
      • Expéditeur : "ALPE Plaisance du Touch <noreply@alpe-bourse.fr>"
      • Reply-To : "contact@alpe-bourse.fr"

  # AC-8 : Relance d'une invitation
  - GIVEN une invitation a été envoyée il y a 3 jours et n'est pas encore activée
    WHEN je clique sur "Relancer" dans le tableau des invitations
    THEN :
      • Le système affiche une confirmation : "Renvoyer l'email d'invitation à sophie.martin@example.com ?"
      • Si je confirme :
        - Génère un nouveau token (l'ancien est invalidé)
        - Prolonge la validité de 7 jours à partir de maintenant
        - Envoie un nouvel email avec le nouveau lien
        - Met à jour le statut : "Relancée le 06/11/2024"
        - Affiche : "✓ Email de relance envoyé à sophie.martin@example.com"
        - Trace l'action : qui a relancé, quand

  # AC-9 : Annulation d'une invitation
  - GIVEN une invitation est en statut "En attente" (non activée)
    WHEN je clique sur "Annuler" dans le tableau
    THEN :
      • Le système affiche une confirmation : "⚠️ Annuler l'invitation de sophie.martin@example.com ? Le lien ne sera plus valide."
      • Si je confirme :
        - Invalide le token immédiatement
        - Passe le statut à "Annulée"
        - Si le déposant tente d'activer : message "Cette invitation a été annulée. Contactez l'organisation."
        - Trace l'action : qui a annulé, quand, motif (optionnel)
        - Affiche : "✓ Invitation annulée"

  # AC-10 : Gestion des invitations expirées
  - GIVEN une invitation a dépassé les 7 jours sans activation
    WHEN le système vérifie les invitations (tâche cron quotidienne)
    THEN :
      • Le statut passe automatiquement à "Expirée"
      • Le token devient invalide
      • Si le déposant tente d'activer : message "Ce lien d'invitation a expiré (7 jours dépassés). Demandez une nouvelle invitation."
      • Le gestionnaire voit dans le tableau : statut "Expirée" en rouge
      • Action disponible : "Relancer" (crée une nouvelle invitation)

  # AC-11 : Invitations pour anciens déposants
  - GIVEN je veux inviter un ancien déposant (déjà dans la base de données)
    WHEN je tape son email dans le formulaire "Nouvelle invitation"
    THEN :
      • Le système détecte l'email existant
      • Affiche une info : "ℹ️ Déposant existant : Sophie MARTIN (dernière participation : Printemps 2024)"
      • Pré-remplit automatiquement les champs Nom et Prénom
      • Affiche l'historique : "3 éditions, 87 articles vendus (72% taux de vente)"
      • Propose de réutiliser le même type de liste que la dernière fois : "Type suggéré : Standard"
      • Je peux modifier ou valider tel quel

  # AC-12 : Notifications gestionnaires
  - GIVEN des invitations restent non activées 3 jours avant expiration
    WHEN le système vérifie les invitations (tâche cron quotidienne)
    THEN :
      • Envoie un email récapitulatif aux gestionnaires :
        Objet : "Bourse Automne 2024 - 12 invitations expirent dans 3 jours"
        Corps :
          - Liste des 12 emails non activés
          - Bouton : "Relancer ces invitations en masse"
          - Lien vers tableau de bord des invitations
      • Affiche une alerte dans l'interface : "⚠️ 12 invitations expirent dans 3 jours"

  # AC-13 : Statistiques et export
  - GIVEN je veux analyser le taux d'activation des invitations
    WHEN je clique sur "Statistiques détaillées"
    THEN j'accède à un dashboard avec :
      • Graphique d'évolution : invitations envoyées vs activées par jour
      • Taux d'activation global : 81% (198/245)
      • Délai moyen d'activation : 1,5 jours
      • Taux d'expiration : 5% (12/245)
      • Nombre de relances : 23 (dont 18 activées après relance)
      • Répartition par type de liste :
        - Standard : 210 invitations (85%)
        - Liste 1000 : 25 invitations (10%)
        - Liste 2000 : 10 invitations (5%)
    AND je peux cliquer sur "Exporter Excel" pour obtenir :
      • Feuille 1 : Liste complète des invitations (email, statut, dates, etc.)
      • Feuille 2 : Statistiques globales
      • Feuille 3 : Invitations non activées (à relancer)

  # AC-14 : Traçabilité complète
  - GIVEN je consulte l'historique d'une invitation
    WHEN j'accède aux détails de l'invitation
    THEN je vois :
      • Création : "Créée le 03/11/2024 à 10:23 par Gestionnaire Sophie D."
      • Envoi initial : "Email envoyé le 03/11/2024 à 10:23"
      • Relances : "Relancée le 06/11/2024 à 14:15 par Gestionnaire Alice M."
      • Activation : "Activée le 07/11/2024 à 09:42 (4 jours après envoi)"
      • Token(s) : "abc123def456" (avec date de validité)
      • Commentaire interne : "Ancien déposant 2023, très bon taux de vente"
      • Modifications : historique de toutes les modifications (si annulation, motif)

  # AC-15 : Sécurité et contrôles
  - GIVEN je suis gestionnaire
    WHEN j'utilise les fonctions d'invitation
    THEN :
      • Je ne peux inviter que pour l'édition en cours (pas pour éditions futures/passées)
      • Je ne peux pas voir/modifier les invitations créées par d'autres gestionnaires (sauf admin)
      • Les tokens sont générés avec cryptographie sécurisée (UUID v4 ou JWT)
      • Les tokens sont hashés en base de données
      • Les emails sont validés côté serveur (protection XSS/injection)
      • Rate limiting : max 100 invitations/heure par gestionnaire (anti-spam)
      • Logs d'audit : toutes les actions sont tracées (création, relance, annulation)

  # AC-16 : Visualisation des invitations activées
  - GIVEN je consulte la liste des invitations
    WHEN je sélectionne le filtre "Activées" dans les options de statut
    THEN :
      • Le tableau affiche uniquement les invitations au statut "Activée"
      • Une colonne "Date d'activation" affiche la date et heure d'activation du compte
      • Les statistiques en haut de page incluent le compte des invitations activées
      • Je peux voir l'historique complet du parcours de l'invitation (envoi → activation)

  # AC-17 : Suppression d'une invitation individuelle
  - GIVEN je consulte une invitation dans le tableau (quel que soit son statut)
    WHEN je clique sur le bouton "Supprimer" dans la colonne Actions
    THEN :
      • Le système affiche une modale de confirmation :
        "Supprimer l'invitation de sophie.martin@example.com ?
        Cette action est irréversible. Si l'invitation était activée, le compte déposant n'est pas affecté."
      • Si je confirme :
        - L'invitation est supprimée de la base de données
        - Si l'invitation n'était pas encore activée, le token devient invalide
        - Un toast de confirmation s'affiche : "✓ Invitation supprimée"
        - Le tableau se rafraîchit automatiquement
        - L'action est tracée dans les logs d'audit
      • Si j'annule : rien ne se passe, la modale se ferme

  # AC-18 : Sélection multiple d'invitations
  - GIVEN je consulte le tableau des invitations
    WHEN je souhaite sélectionner plusieurs invitations
    THEN :
      • Chaque ligne du tableau a une checkbox de sélection
      • L'en-tête du tableau contient une checkbox "Sélectionner tout" (sélectionne la page courante)
      • Un compteur affiche le nombre d'éléments sélectionnés : "3 invitations sélectionnées"
      • Les sélections sont préservées lors de la navigation/filtrage
      • Je peux combiner sélection individuelle et "Sélectionner tout"

  # AC-19 : Suppression en masse des invitations sélectionnées
  - GIVEN j'ai sélectionné une ou plusieurs invitations
    WHEN je clique sur le bouton "Supprimer la sélection" (visible si sélection > 0)
    THEN :
      • Le système affiche une modale de confirmation :
        "Supprimer 5 invitations ?
        Statuts : 3 en attente, 1 expirée, 1 activée
        Cette action est irréversible."
      • Si je confirme :
        - Le système supprime toutes les invitations sélectionnées
        - Une barre de progression s'affiche si > 10 éléments
        - Un rapport final s'affiche : "✓ 5 invitations supprimées"
        - Le tableau se rafraîchit automatiquement
        - La sélection est réinitialisée
        - L'action est tracée dans les logs d'audit (liste des IDs supprimés)
      • Si j'annule : rien ne se passe, la sélection est préservée

business_rules:
  - Une invitation = 1 email unique pour 1 édition donnée
  - Validité : 7 jours calendaires après émission
  - Token unique, non réutilisable après expiration ou annulation
  - Relance = nouveau token (ancien invalidé) + nouveau délai 7 jours
  - Un déposant peut avoir des invitations pour différentes éditions
  - Import CSV : max 500 lignes par import (performance)
  - Format email : RFC 5322 standard
  - Types de liste : standard (défaut), 1000, 2000 (selon adhésion ALPE)
  - Traçabilité obligatoire : qui a invité, quand, pour quelle édition
  - Rate limiting : 100 invitations/heure par gestionnaire

technical_specs:
  token_generation:
    - Format : UUID v4 ou JWT signé
    - Longueur : 32-64 caractères
    - Stockage : hashé (SHA-256) en base de données
    - URL activation : https://app.alpe-bourse.fr/activation?token=abc123def456

  email_sending:
    - Service : SendGrid, AWS SES, ou équivalent
    - Template : HTML responsive (mobile-friendly)
    - Tracking : ouverture, clic (optionnel)
    - Retry automatique en cas d'échec (max 3 tentatives)
    - Bounce management : détecter emails invalides

  csv_import:
    - Format : CSV UTF-8, séparateur virgule
    - Colonnes : email (obligatoire), nom, prenom, type_liste, commentaire
    - Validation côté serveur (pas seulement client)
    - Traitement asynchrone si > 50 lignes (job en background)
    - Rapport d'erreurs détaillé ligne par ligne

  cron_jobs:
    - Vérification quotidienne (1h du matin) : invitations expirées
    - Notification gestionnaires : invitations expirant dans 3 jours
    - Nettoyage tokens expirés : suppression après 30 jours

  security:
    - Rate limiting : 100 requêtes/heure par gestionnaire
    - CSRF protection sur formulaires
    - Email validation : format + vérification MX record (optionnel)
    - Logs d'audit : toutes actions tracées avec IP + user agent

test_scenarios:
  - T-US010-01 : Création invitation unique valide (OK, email envoyé, token généré)
  - T-US010-02 : Tentative doublon email même édition (bloqué, message erreur)
  - T-US010-03 : Import CSV 45 invitations valides (OK, 45 créées, 45 emails envoyés)
  - T-US010-04 : Import CSV avec erreurs (5 emails invalides, 3 doublons, rapport affiché)
  - T-US010-05 : Validation format email (OK pour valides, bloqué pour invalides)
  - T-US010-06 : Relance invitation non activée après 3 jours (OK, nouveau token, email envoyé)
  - T-US010-07 : Annulation invitation en attente (OK, token invalidé, statut "Annulée")
  - T-US010-08 : Expiration automatique après 7 jours (OK, statut "Expirée", token invalide)
  - T-US010-09 : Activation après expiration (bloqué, message "lien expiré")
  - T-US010-10 : Invitation ancien déposant (OK, nom/prénom pré-remplis, historique affiché)
  - T-US010-11 : Email d'invitation contient toutes sections (OK, logo, CTA, dates, règlement)
  - T-US010-12 : Notification gestionnaires 3 jours avant expiration (OK, email récap envoyé)
  - T-US010-13 : Statistiques dashboard (OK, graphiques, taux activation, délais)
  - T-US010-14 : Export Excel invitations (OK, 3 feuilles, données complètes)
  - T-US010-15 : Traçabilité invitation (OK, historique complet qui/quand/quoi)
  - T-US010-16 : Sécurité tokens (OK, hashés en BDD, non lisibles)
  - T-US010-17 : Rate limiting 100/heure (OK, 101ème requête bloquée)
  - T-US010-18 : Import CSV 500 lignes (OK, traitement asynchrone, rapport final)
  - T-US010-19 : Type liste 1000/2000 dans email (OK, mention priorité affichée)
  - T-US010-20 : Gestionnaire ne voit que ses invitations (OK, isolation données)
  - T-US010-21 : Affichage invitations activées avec date d'activation (OK, filtre "Activées", colonne date)
  - T-US010-22 : Suppression invitation individuelle (OK, confirmation, feedback)
  - T-US010-23 : Sélection multiple invitations (OK, checkbox, compteur)
  - T-US010-24 : Suppression en masse invitations sélectionnées (OK, confirmation, rapport)
```

