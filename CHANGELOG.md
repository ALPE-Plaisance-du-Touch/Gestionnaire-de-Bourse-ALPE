# Changelog

Toutes les évolutions notables de ce projet sont consignées ici.

Le format s'inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/)
et le projet suit le [versionnement sémantique](https://semver.org/lang/fr/).

Les versions antérieures à 0.23 sont résumées à partir de [PLAN.md](PLAN.md) :
elles ont été livrées avant la mise en place de ce fichier et n'ont pas de date
de publication fiable.

## [Non publié]

### Ajouté

- Modules de fonctionnalités configurables par édition : chaque édition peut
  activer ou désactiver les modules qu'elle utilise, et la barre latérale
  n'affiche que les rubriques correspondantes (#66)

## [0.23.0] - Messagerie & Paramètres admin

### Ajouté

- Messagerie interne entre déposants et organisateurs, avec notification par
  courriel lorsqu'un membre du staff répond (US-016)
- Page de paramètres pour les administrateurs, dont l'adresse de contact du
  support, désormais configurable sans redéploiement

## [0.22.0] - Ticket de caisse

### Ajouté

- Panier multi-articles en caisse : plusieurs articles sont encaissés en une
  seule opération et regroupés sur un même ticket
- Confirmation explicite avant l'annulation d'une vente

## [0.21.0] - Revue des listes au dépôt

### Ajouté

- Validation des articles au dépôt : les bénévoles acceptent, refusent ou
  corrigent chaque article, puis clôturent la revue (US-014)
- Suivi de l'avancement des déclarations
- Génération des planches d'étiquettes en PDF séparés

## [0.20.0] - Mode Formation

### Ajouté

- Éditions de formation permettant de s'entraîner sans affecter les données
  réelles, signalées par un bandeau visuel
- Forçage manuel du statut d'une édition et indicateur « testeur » sur les
  comptes

## [0.19.0] - Intégration API Billetweb

### Ajouté

- Synchronisation directe avec Billetweb (événements, sessions, inscrits) en
  complément de l'import de fichier
- Import incrémental : seules les nouveautés sont récupérées

## [0.18.0] - Page d'accueil

### Ajouté

- Page d'accueil publique présentant l'édition en cours

## [0.17.0] - Améliorations gestion

### Ajouté

- Export Excel des données d'une édition
- Relances groupées par courriel
- Possibilité pour un gestionnaire de passer outre une annulation

## [0.16.0] - Accessibilité & UX

### Modifié

- Mise en conformité WCAG 2.1 niveau AA
- Indicateur de robustesse du mot de passe et ergonomie du scanner améliorée

## [0.15.0] - Fonctionnalités secondaires

### Ajouté

- Ventes au profit des écoles privées
- Rappel de récupération des invendus
- Aide à la fixation des prix et prévisualisation des étiquettes

## [0.14.0] - Listes spéciales & Règles métier

### Ajouté

- Listes 1000 (adhérents ALPE) et 2000 (famille et proches)
- Date limite de déclaration et plafond de capacité par créneau de dépôt

## [0.13.0] - Ops & Déploiement

### Ajouté

- Configuration Docker de production avec nginx et HTTPS
- Scripts de sauvegarde et de restauration

## [0.12.0] - Conformité RGPD & Sécurité

### Ajouté

- Export et suppression des données personnelles
- Journal d'audit, en-têtes de sécurité et politique de confidentialité

## [0.11.0] - PWA & Mode hors ligne

### Ajouté

- Application installable fonctionnant hors connexion : les ventes sont
  enregistrées localement puis synchronisées au retour du réseau

## [0.10.0] - Clôture d'édition

### Ajouté

- Procédure de clôture, rapport de synthèse et archivage automatique

## [0.9.0] - Tableau de bord & Rapports

### Ajouté

- Tableau de bord administrateur avec statistiques en temps réel

## [0.8.0] - Calcul des reversements

### Ajouté

- Calcul de la commission, états de reversement et reçus en PDF

## [0.7.0] - Ventes & Encaissement

### Ajouté

- Interface de caisse pour les bénévoles avec lecture de code-barres

## [0.6.0] - Génération des étiquettes

### Ajouté

- Étiquettes en PDF avec QR codes et impression en lot

## [0.5.0] - Déclaration des articles

### Ajouté

- Déclaration et gestion des listes d'articles par les déposants

## [0.4.0] - Import Billetweb

### Ajouté

- Import des inscriptions depuis un fichier CSV Billetweb

## [0.3.0] - Gestion des éditions

### Ajouté

- Création et configuration des éditions, créneaux de dépôt et transitions
  automatiques de statut

## [0.2.0] - Authentification

### Ajouté

- Connexion, activation de compte et réinitialisation du mot de passe
- Quatre rôles (déposant, bénévole, gestionnaire, administrateur) et gestion
  des invitations, à l'unité ou en masse par CSV

## [0.1.0] - Mise en place du projet

### Ajouté

- Squelette du projet : API, interface web, base de données et environnement
  de développement conteneurisé
