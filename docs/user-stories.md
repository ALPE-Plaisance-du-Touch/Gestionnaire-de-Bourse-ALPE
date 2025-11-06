---
id: DOC-030-US
title: User Stories
status: draft
version: 0.3.0
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
      • Date(s) de dépôt des articles (obligatoire, peut être plusieurs dates)
      • Date(s) de vente (obligatoire, peut être plusieurs dates/période)
      • Date de récupération des invendus (obligatoire)
      • Paramètres tarifaires : taux de commission (%, obligatoire)
      • Catégories d'articles autorisées (multi-sélection)

  # AC-2 : Saisie et validation des dates
  - GIVEN je remplis les dates de dépôt, vente et récupération
    AND les dates respectent l'ordre chronologique : dépôt < vente < récupération
    AND je définis un taux de commission valide (entre 0 et 100%)
    WHEN je valide le formulaire
    THEN le système enregistre les dates
    AND passe l'édition au statut "Configurée"
    AND affiche un message : "Configuration enregistrée. L'édition est maintenant prête pour l'import des inscriptions."

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
  - Les dates doivent respecter l'ordre : inscriptions < dépôt < vente < récupération
  - Le taux de commission doit être entre 0 et 100%
  - Modification possible sans restriction tant qu'aucune inscription n'est importée
  - Modification avec notification obligatoire si des déposants sont actifs
  - Le statut passe de "Brouillon" à "Configurée" après validation

# Données de configuration
configuration_data:
  - date_debut_inscriptions (date, optionnel)
  - date_fin_inscriptions (date, optionnel)
  - dates_depot (array de dates, min 1)
  - dates_vente (array de dates/période, min 1)
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
  - Les inscriptions se font sur Billetweb (plateforme externe)
  - Un fichier CSV/Excel est exporté depuis Billetweb et importé dans l'application
  - L'import doit gérer les déposants existants et les nouveaux
  - Format du fichier sera fourni ultérieurement (colonnes : nom, prénom, email, téléphone, etc.)

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
      • Un champ de sélection de fichier (formats acceptés : .csv, .xlsx, .xls)
      • Des instructions sur le format attendu avec lien vers documentation
      • Un bouton "Prévisualiser" et un bouton "Importer"
      • Un bouton "Télécharger un exemple de fichier"

  # AC-3 : Prévisualisation avant import
  - GIVEN j'ai sélectionné un fichier valide
    WHEN je clique sur "Prévisualiser"
    THEN le système analyse le fichier
    AND affiche un tableau récapitulatif :
      • Nombre total d'inscriptions dans le fichier
      • Nombre de déposants existants (email déjà en base)
      • Nombre de nouveaux déposants (email inconnu)
      • Nombre de lignes en erreur (format invalide, doublons)
      • Détail des erreurs s'il y en a

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
  - GIVEN le fichier ne respecte pas le format attendu (colonnes manquantes, encodage incorrect)
    WHEN je lance la prévisualisation
    THEN le système affiche une erreur explicite : "Format de fichier invalide. Colonnes requises : [liste]. Vérifiez le format ou téléchargez le fichier exemple."
    AND bloque l'import

  # AC-8 : Erreur - données invalides
  - GIVEN certaines lignes contiennent des emails invalides ou téléphones mal formatés
    WHEN je lance la prévisualisation
    THEN le système affiche un tableau des erreurs ligne par ligne
    AND me permet soit de :
      • Corriger le fichier et réessayer
      • Ignorer les lignes en erreur et importer le reste (avec confirmation)

  # AC-9 : Notification aux déposants existants
  - GIVEN des déposants existants sont associés à la nouvelle édition
    WHEN l'import est terminé
    THEN le système leur envoie un email de notification :
      "Bonjour [Prénom], vous êtes inscrit(e) à l'édition [Nom édition]. Connectez-vous pour déclarer vos articles."

  # AC-10 : Limitation de taille de fichier
  - GIVEN le fichier uploadé dépasse 5 Mo ou contient plus de 1000 lignes
    WHEN je tente de l'importer
    THEN le système affiche : "Fichier trop volumineux. Maximum 5 Mo ou 1000 inscriptions par import."

  # AC-11 : Contrôle d'accès
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
  - Un email ne peut être associé qu'une seule fois à une édition donnée
  - Les déposants existants sont associés automatiquement (via email)
  - Les nouveaux reçoivent une invitation (token 7 jours comme US-001)
  - L'import est traçé pour audit (qui, quand, nombre d'inscriptions)
  - Maximum 1000 inscriptions par fichier
  - Formats acceptés : CSV (UTF-8), Excel (.xlsx, .xls)

# Format du fichier Billetweb (à confirmer)
file_format:
  required_columns:
    - email (string, validé format email)
    - nom (string)
    - prenom (string)
    - telephone (string, format français)
  optional_columns:
    - adresse (string)
    - code_postal (string)
    - ville (string)
  encodage: UTF-8
  separateur_csv: ";" ou ","

# Cas de test suggérés
test_scenarios:
  - T-US008-01 : Import nominal avec 10 déposants (5 nouveaux, 5 existants)
  - T-US008-02 : Fichier avec doublons (même email)
  - T-US008-03 : Fichier avec emails invalides
  - T-US008-04 : Fichier format invalide (colonnes manquantes)
  - T-US008-05 : Fichier trop volumineux (> 5 Mo)
  - T-US008-06 : Import sur édition non configurée (erreur)
  - T-US008-07 : Déposants déjà associés à l'édition (ignorés)
  - T-US008-08 : Accès refusé pour bénévole/déposant
  - T-US008-09 : Vérification emails d'invitation envoyés aux nouveaux
  - T-US008-10 : Vérification emails de notification envoyés aux existants
  - T-US008-11 : Traçabilité de l'import dans les logs
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
  - Cette US s'appuie sur le Règlement déposant (docs/Reglement_deposant.md)
  - Le déposant doit compléter ses listes AVANT la date limite de déclaration
  - Anciennement fait via Google Forms, maintenant intégré dans l'application
  - Les frais d'inscription (5€) sont payés via Billetweb pour réserver le créneau
  - Les bénévoles vérifieront physiquement les articles lors du dépôt

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
    AND m'affiche le formulaire de saisie des articles avec :
      • Un tableau de 24 lignes numérotées (1 à 24)
      • Les lignes 1-12 sont marquées "Vêtements uniquement" avec fond coloré distinct
      • Les lignes 13-24 acceptent toutes les catégories
      • Colonnes : N° ligne | Catégorie | Genre (opt.) | Taille (opt.) | Description | Prix (€) | Actions
      • Un bouton "Sauvegarder la liste" en bas

  # AC-3 : Ajout d'un article - cas nominal vêtement
  - GIVEN je suis dans une de mes listes (< 24 articles)
    AND je sélectionne une ligne entre 1 et 12 (zone vêtements)
    WHEN je remplis les champs :
      • Catégorie : "Vêtements" (imposé automatiquement pour lignes 1-12)
      • Genre : "Garçon" (menu déroulant : Fille/Garçon/Mixte/Adulte Homme/Adulte Femme/Mixte Adulte)
      • Taille : "4 ans" (menu déroulant avec tailles standard)
      • Description : "Pull rayé bleu marine"
      • Prix : "5"
    AND je clique sur "Ajouter l'article"
    THEN le système enregistre l'article dans la ligne sélectionnée
    AND met à jour le compteur "Articles : X / 24 (Y vêtements / 12)"
    AND affiche un message de confirmation vert : "Article ajouté"

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

  # AC-7 : Erreur - ajout article ligne vêtement (1-12) avec catégorie non-vêtement
  - GIVEN je sélectionne une ligne entre 1 et 12
    AND je tente de choisir une catégorie autre que "Vêtements" (ex: "Jouets")
    WHEN le système détecte l'incohérence
    THEN il affiche : "Les lignes 1 à 12 sont réservées aux vêtements. Pour les autres articles, utilisez les lignes 13 à 24."
    AND force la catégorie "Vêtements" ou propose de basculer sur une ligne 13-24 disponible

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

  # AC-10 : Limite 12 vêtements atteinte
  - GIVEN j'ai déjà saisi 12 articles de catégorie "Vêtements" dans ma liste
    WHEN je tente d'ajouter un 13ème vêtement (même sur ligne 13-24)
    THEN le système affiche : "Limite atteinte : 12 vêtements maximum par liste (règlement ALPE)"
    AND bloque l'ajout
    AND propose : "Vous pouvez créer une 2ème liste si nécessaire (2 listes max par déposant)"

  # AC-11 : Sauvegarde et modification de liste
  - GIVEN j'ai saisi des articles dans ma liste
    AND la date limite de déclaration n'est pas dépassée
    WHEN je clique sur "Sauvegarder la liste"
    THEN le système :
      • Enregistre tous les articles saisis
      • M'affiche un résumé : "Liste 1 : [X] articles saisis (Y vêtements)"
      • Me permet de revenir modifier tant que la date limite n'est pas atteinte
      • Affiche un statut : "Brouillon" (si < 5 articles) ou "Complète" (si ≥ 5 articles)

  # AC-12 : Blocage après date limite
  - GIVEN la date limite de déclaration est dépassée
    WHEN j'accède à mes listes
    THEN le système :
      • Affiche mes listes en lecture seule
      • Désactive les boutons "Ajouter" et "Modifier"
      • Affiche un bandeau rouge : "Date limite dépassée. Vous ne pouvez plus modifier vos listes."
      • Si mes listes sont vides ou incomplètes (< 3 articles), affiche :
        "Vos listes sont incomplètes. Votre dépôt ne sera pas pris en compte. Contactez les bénévoles si nécessaire."

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
  - Lignes 1-12 réservées aux vêtements uniquement
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
    - Contraintes : 12 max par liste, lignes 1-12
  Chaussures:
    - Chaussures sport (crampons, randonnée, ski, danse), Bottes pluie, Bottes neige
    - Exclusions : Chaussons enfants, Chaussures > pointure 25, Chaussettes (sauf ski)
  Puériculture:
    - Poussettes, Landaus, Tour de lit (1 max), Articles bébé très propres
    - Exclusions : Sièges-autos, Biberons, Pots, Vaisselle, Matelas, Baignoires
  Jouets:
    - Jouets complets, Jeux de société, Disquettes/CD jeux (avec boîte), Peluches (1 max)
    - Exclusions : Consoles, Jeux PC/Mac, Circuits électriques, Jouets gonflables piscine
  Livres:
    - Livres enfants, Livres adultes (5 max), Magazines enfants en lot
    - Exclusions : Livres jaunis/abîmés, Encyclopédies, Annales > 5 ans, Magazines adultes
  Accessoires:
    - Sacs à main (1 max), Foulards (2 max), Gants ski, Bonnets
    - Exclusions : Sacs de voyage, Cravates, Gants de ville

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
  - T-US002-09 : Tentative d'ajouter jouet sur ligne 1-12 (bloqué, zone vêtements)
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

# User Stories déposants (à détailler)

- US-003 — En tant que déposant, je veux obtenir/imprimer des étiquettes pour chaque article.

# User Stories bénévoles (à détailler)

- US-004 — En tant que bénévole, je veux scanner un article et enregistrer la vente.
- US-005 — En tant que bénévole, je veux générer les reversements en fin d'édition.
