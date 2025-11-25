---
id: DOC-040-REQS
title: Exigences (fonctionnelles et non-fonctionnelles)
status: draft
version: 0.4.0
updated: 2025-11-06
owner: ALPE Plaisance du Touch
links:
  - rel: source
    href: Reglement_deposant.md
    title: Règlement déposant
  - rel: source
    href: Reglement_interne.md
    title: Règlement intérieur
---

# Règles d’écriture

- Atomicité, testabilité, traçabilité (REQ ↔ US ↔ tests).
- Forme: « Le système DOIT … » ou « DEVRAIT … » (priorité).
- Chaque REQ inclut critères d’acceptation et métriques si applicable.

# Exigences fonctionnelles

## Gestion des éditions

- REQ-F-006 — Le système DOIT permettre à un administrateur de créer une nouvelle édition de bourse avec nom unique, saison, année, lieu. (US-006)
  - **Critères d'acceptation :** Formulaire de création, validation unicité nom, statut initial "Brouillon"
  - **Priorité :** Must have
  - **Responsable validation :** Administrateur ALPE

- REQ-F-007 — Le système DOIT permettre à un gestionnaire de configurer les dates clés d'une édition (dépôt, vente, récupération) et le taux de commission. (US-007)
  - **Critères d'acceptation :** Validation cohérence chronologique des dates, taux commission 0-100%, passage statut "Configurée"
  - **Priorité :** Must have
  - **Responsable validation :** Gestionnaire

- REQ-F-008 — Le système DOIT permettre à un gestionnaire d'importer un fichier d'inscriptions Billetweb (CSV/Excel) pour associer déposants existants et créer invitations pour nouveaux. (US-008)
  - **Critères d'acceptation :** Prévisualisation avant import, gestion doublons, envoi invitations automatique, limite 1000 inscriptions/fichier
  - **Priorité :** Must have
  - **Responsable validation :** Gestionnaire

- REQ-F-009 — Le système DOIT permettre à un administrateur de clôturer une édition après vérification des pré-requis (reversements calculés, paiements finalisés). (US-009)
  - **Critères d'acceptation :** Checklist pré-requis, génération rapport PDF, passage en lecture seule, traçabilité
  - **Priorité :** Must have
  - **Responsable validation :** Administrateur ALPE

## Gestion des utilisateurs

- REQ-F-001 — Le système DOIT permettre la création de compte déposant via activation d'invitation. (US-001)
  - **Critères d'acceptation :** Token unique 7 jours, validation mot de passe (≥8 car., lettre, chiffre, symbole), acceptation CGU/RGPD
  - **Priorité :** Must have
  - **Responsable validation :** Déposant test

- REQ-F-010 — Le système DOIT gérer 4 rôles utilisateurs avec permissions différenciées : déposant, bénévole, gestionnaire, administrateur.
  - **Critères d'acceptation :** Matrice d'autorisation par rôle, contrôle d'accès sur chaque action sensible
  - **Priorité :** Must have
  - **Responsable validation :** Administrateur ALPE + SecOps

- REQ-F-011 — Le système DOIT gérer une date limite de déclaration des articles par édition.
  - **Critères d'acceptation :**
    - La date limite est configurable par le gestionnaire (dans US-007)
    - **Date limite recommandée : 3 semaines avant le début de la collecte** pour permettre l'impression des étiquettes par ALPE
    - Après la date limite, le déposant ne peut plus ajouter/modifier ses articles
    - Un message d'avertissement est affiché 3 jours avant la date limite
    - Si les listes ne sont pas complétées avant la date limite, le dépôt n'est pas pris en compte (notification automatique au déposant)
  - **Priorité :** Must have
  - **Responsable validation :** Gestionnaire

- REQ-F-013 — Le système DOIT restreindre les dépôts selon les règles du règlement intérieur.
  - **Critères d'acceptation :**
    - Un déposant (personne physique majeure) ne peut effectuer qu'un seul dépôt par semaine de collecte
    - Vérification par pièce d'identité lors du dépôt physique (processus manuel)
    - Le déposant ne peut pas déposer pour une autre personne
    - Créneaux spécifiques réservés aux Plaisançois (mercredi 20h-22h et vendredi 9h30-12h) : vérification domicile sur justificatif
  - **Priorité :** Must have
  - **Responsable validation :** Gestionnaire

- REQ-F-014 — Le système DOIT gérer les créneaux de dépôt avec limites de capacité.
  - **Critères d'acceptation :**
    - Chaque créneau de dépôt a une capacité maximum de déposants (configurée par édition)
    - Exemples de capacités standard :
      - Mercredi 9h30-11h30 : 20 déposants
      - Mercredi 14h-18h : 40 déposants
      - Mercredi 20h-22h : 20 déposants (réservé Plaisançois)
      - Jeudi 9h30-12h : 15 déposants
      - Jeudi 17h-21h : 32 déposants
      - Vendredi 9h30-12h : 15 déposants (réservé Plaisançois)
    - Blocage des inscriptions une fois la capacité atteinte
    - Indication visuelle du nombre de places restantes
    - Possibilité de liste d'attente (optionnel)
  - **Priorité :** Must have
  - **Responsable validation :** Gestionnaire

- REQ-F-015 — Le système DOIT gérer les listes spéciales 1000 et 2000 pour adhérents ALPE.
  - **Critères d'acceptation :**
    - **Listes 1000** (étiquettes blanches) :
      - Réservées aux adhérents ALPE participant minimum 8h à la bourse
      - Numérotation fixe attribuée de façon définitive tant que l'adhérent participe
      - Limite : 2 listes pour première bourse, puis 4 ensuite
      - Coût : 1€ par liste, déduit du montant des ventes
      - Créneaux de dépôt spéciaux : mardi jusqu'à 23h, mercredi 12h-14h et 18h-20h, jeudi 21h-22h
      - Restitution : dimanche 17h-18h (au lieu de lundi pour les autres)
    - **Listes 2000** (étiquettes groseille) :
      - Pour famille/amis d'adhérents ALPE ne participant pas à la bourse
      - Numérotation liée aux listes 1000 (ex: adhérent avec 1100/1101/1102/1103 peut déposer 2100/2101/2102/2103)
      - Limite : 4 listes pour 2 personnes maximum
      - Coût : 5€ pour 2 listes, déduit du montant des ventes
      - Mêmes créneaux de dépôt et restitution que les listes 1000
      - Doivent être étiquetées sous contrôle d'un membre ALPE
    - Distinction visuelle par couleur d'étiquettes (1000=blanc, 2000=groseille)
    - Les frais (1€ ou 5€) sont déduits automatiquement du reversement final
  - **Priorité :** Should have
  - **Responsable validation :** Administrateur ALPE

- REQ-F-016 — Le système DOIT différencier les horaires de restitution selon le type de liste.
  - **Critères d'acceptation :**
    - Listes standard : lundi 18h30-19h30 après la vente
    - Listes 1000 et 2000 : dimanche 17h-18h (jour de la vente)
    - Notification automatique avec le bon horaire selon le type de liste du déposant
  - **Priorité :** Should have
  - **Responsable validation :** Gestionnaire

- REQ-F-017 — Le système DOIT gérer une vente privée pour écoles/ALAE.
  - **Critères d'acceptation :**
    - Vente privée réservée aux écoles et ALAE de Plaisance-du-Touch
    - Horaire : vendredi 17h-18h précédant la vente publique
    - Liste des écoles/ALAE autorisées configurable par édition
    - Marquage des ventes "vente privée" pour statistiques
  - **Priorité :** Could have
  - **Responsable validation :** Gestionnaire

- REQ-F-018 — Le système DOIT permettre à un gestionnaire d'émettre des invitations manuellement (uniques ou en masse via CSV) avec tokens sécurisés, relances et traçabilité complète. (US-010)
  - **Critères d'acceptation :**
    - **Invitation unique :**
      - Formulaire de création : email (obligatoire), nom, prénom, type de liste (standard/1000/2000), commentaire interne
      - Génération automatique d'un token unique sécurisé (UUID v4 ou JWT signé, hashé SHA-256 en base)
      - Validité du token : 7 jours calendaires
      - Envoi immédiat ou différé de l'email d'invitation
      - Validation unicité : 1 email = 1 invitation active par édition (détection doublons avec options : annuler l'ancienne ou relancer)
    - **Import en masse CSV :**
      - Format CSV UTF-8, séparateur virgule
      - Colonnes : email (obligatoire), nom, prénom, type_liste (standard/1000/2000), commentaire
      - Limite : 500 lignes par import
      - Validation côté serveur : format CSV, emails valides (RFC 5322), détection doublons dans fichier et en base
      - Rapport de validation détaillé : nombre valides, doublons, erreurs ligne par ligne
      - Traitement asynchrone si >50 lignes (job en background avec barre de progression)
      - Génération tokens uniques pour toutes les invitations valides
      - Envoi emails en masse avec rapport final (succès, échecs avec raisons)
    - **Relance d'invitation :**
      - Relance possible pour invitations "En attente" (non activées)
      - Génération d'un nouveau token (l'ancien est invalidé)
      - Prolongation de validité : nouveau délai de 7 jours à partir de la relance
      - Email de relance automatique envoyé
      - Traçabilité : qui a relancé, quand
    - **Annulation d'invitation :**
      - Annulation possible pour invitations "En attente"
      - Invalidation immédiate du token
      - Passage statut "Annulée"
      - Message d'erreur si déposant tente d'activer : "Cette invitation a été annulée. Contactez l'organisation."
      - Traçabilité : qui a annulé, quand, motif optionnel
    - **Expiration automatique :**
      - Tâche cron quotidienne (1h du matin) vérifie les invitations
      - Passage automatique en statut "Expirée" après 7 jours sans activation
      - Token devient invalide
      - Message d'erreur : "Ce lien d'invitation a expiré (7 jours dépassés). Demandez une nouvelle invitation."
      - Action disponible pour gestionnaire : "Relancer" (crée une nouvelle invitation)
    - **Notification gestionnaires :**
      - Email récapitulatif quotidien : invitations expirant dans 3 jours
      - Contenu : liste des emails non activés, bouton "Relancer en masse", lien vers tableau de bord
      - Alerte dans interface : badge avec nombre d'invitations à risque
    - **Détection anciens déposants :**
      - Lors de saisie email, détection automatique si déposant existant en base
      - Affichage info : "Déposant existant : Nom Prénom (dernière participation : Édition précédente)"
      - Pré-remplissage automatique : nom, prénom, type de liste suggéré
      - Affichage historique : nombre d'éditions, articles vendus, taux de vente
    - **Statistiques et export :**
      - Dashboard : graphique évolution invitations envoyées vs activées, taux d'activation global, délai moyen d'activation, taux d'expiration, nombre de relances
      - Répartition par type de liste (standard/1000/2000)
      - Export Excel : feuille invitations complètes, feuille statistiques, feuille invitations non activées
    - **Sécurité :**
      - Tokens hashés en base de données (SHA-256), non lisibles en clair
      - Rate limiting : 100 invitations/heure par gestionnaire (anti-spam)
      - CSRF protection sur formulaires
      - Email validation : format RFC 5322 + vérification MX record optionnelle
      - Logs d'audit : toutes actions tracées (création, relance, annulation) avec IP + user agent
      - Isolation : gestionnaire voit seulement ses invitations (sauf admin qui voit tout)
    - **Contenu email d'invitation :**
      - Objet : "Bourse [Nom Édition] ALPE - Activez votre compte déposant"
      - Corps HTML responsive (mobile-friendly) :
        - Logo ALPE
        - Personnalisation : "Bonjour [Prénom]," ou "Bonjour," si prénom inconnu
        - Texte explicatif sur la bourse
        - Si liste 1000/2000 : mention "Vous bénéficiez d'une liste adhérent [type] avec restitution prioritaire"
        - Bouton CTA : "Activer mon compte" (lien avec token)
        - Informations importantes : date limite déclaration articles, dates de la bourse, validité lien (7 jours)
        - Lien vers règlement déposant
        - Footer : contact ALPE, mentions légales
      - Expéditeur : "ALPE Plaisance du Touch <noreply@alpe-bourse.fr>"
      - Reply-To : "contact@alpe-bourse.fr"
      - Tracking optionnel : ouverture, clic
      - Retry automatique en cas d'échec (max 3 tentatives)
      - Bounce management : détection emails invalides
  - **Priorité :** Must have
  - **Responsable validation :** Gestionnaire

- REQ-F-012 — Le système DOIT afficher les rappels réglementaires pour le jour du dépôt.
  - **Critères d'acceptation :**
    - Dans l'espace déposant, afficher les rappels :
      - "À apporter le jour du dépôt : pièce d'identité, articles propres et repassés dans l'ordre de votre liste, enveloppe timbrée à votre adresse"
      - "Seuls les articles présents sur la liste seront acceptés (pas de remplacement possible)"
      - "L'association se réserve le droit de refuser tout article taché, abîmé, incomplet, cassé ou non conforme"
      - "Vous devez venir le jour et à l'heure indiqués (créneau réservé via Billetweb)"
      - "Articles non récupérés en temps voulu seront donnés à des associations caritatives"
      - "L'association décline toute responsabilité en cas de perte ou de vol"
    - Affichage sur page de confirmation après déclaration des articles
    - Email de rappel envoyé 2 jours avant le créneau de dépôt
  - **Priorité :** Should have
  - **Responsable validation :** Déposant test

## Gestion des articles et ventes

- REQ-F-002 — Le système DOIT permettre l'enregistrement d'articles organisés en listes avec contraintes réglementaires. (US-002)
  - **Critères d'acceptation :**
    - Un déposant peut créer maximum 2 listes par édition
    - Chaque liste contient maximum 24 articles dont 12 vêtements maximum
    - Les articles sont automatiquement triés par catégorie dans l'ordre : Vêtements, Chaussures, Puériculture, Jeux et jouets, Livres, Accessoires, Autres
    - Interface : bouton "Nouvel article" ouvre un formulaire avec sélection catégorie, puis insertion automatique à la bonne position
    - Validation en temps réel : si 12 vêtements déjà saisis et catégorie "Vêtements" sélectionnée, bouton "Ajouter l'article" grisé avec message "Vous avez déjà ajouté vos 12 vêtements sur cette liste"
    - Prix article : minimum 1€, maximum 150€ (uniquement pour poussettes/landaus)
    - Catégories obligatoires : Vêtements, Chaussures, Jouets, Livres, Puériculture, Accessoires
    - Attributs article : catégorie, genre (optionnel), taille (optionnel), description, prix
    - Contraintes par catégorie (selon règlement déposant) :
      - 1 seul manteau ou blouson par liste
      - 1 seul sac à main par liste
      - Maximum 2 foulards par liste
      - 1 seul tour de lit par liste
      - 1 peluche par liste
      - 5 livres adultes maximum par liste
    - Lots autorisés : vêtements enfant (pyjama/bodys) en lot de 3 articles max, taille et marque identiques, acceptés jusqu'à 36 mois
    - Un lot compte comme 1 article dans la limite des 24
    - Articles refusés automatiquement si catégorie dans la liste noire (sièges-autos, biberons, CD/DVD, etc.)
  - **Priorité :** Must have
  - **Responsable validation :** Déposant test + Gestionnaire

- REQ-F-002-BIS — Le système DOIT valider la qualité déclarée des articles selon le règlement. (US-002)
  - **Critères d'acceptation :**
    - Pour vêtements : déclaration "propre, repassé, non taché, non déchiré, boutons complets, de saison, non démodé"
    - Pour puériculture : déclaration "très propre, parfait état"
    - Pour chaussures : déclaration "propres, très bon état" (uniquement chaussures spécifiques à un sport, bottes pluie/neige)
    - Pour jouets : déclaration "complets, sans pièce manquante"
    - Pour puzzles > 104 pièces : déclaration "neuf sous emballage"
    - Pour livres : déclaration "bon état, non jauni, non abîmé, prix en euros visible"
    - Case à cocher obligatoire par article : "Je certifie que cet article respecte les critères de qualité du règlement"
  - **Priorité :** Must have
  - **Responsable validation :** Bénévole (vérification physique lors du dépôt)

- REQ-F-003 — Le système DOIT permettre la génération et l'impression en masse des étiquettes par les gestionnaires (règlement intérieur : impression à la charge d'ALPE). (US-003)
  - **Critères d'acceptation :**
    - Génération en masse par gestionnaire (par créneau, par sélection, ou édition complète)
    - Code unique format : EDI-[ID_EDITION]-L[NUMERO_LISTE]-A[NUMERO_ARTICLE]
    - QR code version 3 minimum, niveau correction erreur M (15%), taille 25×25mm minimum
    - Génération PDF téléchargeable : format A4, 8 étiquettes par page (105×74mm chacune)
    - Contenu étiquette : QR code, numéro liste, numéro article, prix, description (50 car. max), catégorie, code unique
    - Couleur de fond selon numéro liste (100=bleu ciel, 200=jaune, 300=fushia, 400=lilas, 500=vert menthe, 600=clémentine, 1000=blanc, 2000=groseille)
    - PDF organisé par déposant avec : page de séparation + liste d'articles imprimable + étiquettes
    - Instructions pour bénévoles : préparation pochettes transparentes (liste imprimée + étiquettes découpées)
    - Statuts de suivi : Non générées / Générées / Imprimées avec traçabilité (qui, quand)
    - Export Excel récapitulatif avec statistiques globales
    - Régénération possible avec conservation des codes QR
    - Vérification cohérence en masse (codes uniques, pas de doublons sur toute l'édition)
    - Déposants peuvent consulter aperçu de leurs listes (sans impression) dans leur espace
  - **Priorité :** Must have
  - **Responsable validation :** Gestionnaire + Bénévole

- REQ-F-004 — Le système DOIT permettre le scannage/encaissement rapide des ventes en caisse. (US-004)
  - **Critères d'acceptation :** Scan étiquette < 3s, enregistrement vente avec moyen paiement, traçabilité bénévole vendeur
  - **Priorité :** Must have
  - **Responsable validation :** Bénévole caisse

- REQ-F-005 — Le système DOIT calculer commissions et reversements par déposant en fin d'édition selon la tarification réglementaire. (US-005)
  - **Critères d'acceptation :**
    - Frais d'inscription : 5€ par déposant pour 2 listes (payé via Billetweb, non remboursable)
    - Commission ALPE : 20% du montant total des ventes du déposant
    - Formule reversement : montant_net = total_ventes − (20% × total_ventes)
    - Note : Les frais d'inscription sont gérés en dehors du système (Billetweb), seule la commission est calculée par l'application
    - Calcul édition par édition (un déposant peut avoir plusieurs éditions)
    - Export liste reversements en CSV/PDF pour édition de chèques
    - Statuts reversement : en_attente, calculé, payé, annulé
  - **Priorité :** Must have
  - **Responsable validation :** Gestionnaire + Administrateur

# Exigences non-fonctionnelles

- REQ-NF-001 — Disponibilité pendant la bourse ≥ 99.5%.
- REQ-NF-002 — Temps moyen de scannage → encaissement ≤ 3 secondes.
- REQ-NF-003 — Conformité RGPD: consentement, droit d’accès, suppression.
- REQ-NF-004 — Accessibilité: respect WCAG 2.1 AA pour les écrans publics.

