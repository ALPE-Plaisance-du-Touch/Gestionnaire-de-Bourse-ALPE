---
id: DOC-140-DEMO
title: Démo du parcours de dépôt
status: draft
version: 0.2.0
updated: 2026-08-29
owner: ALPE Plaisance du Touch
links:
  - rel: environment
    href: deploiement-nas-synology.md
    title: Environnement de test dev-j
  - rel: glossary
    href: glossaire.md
    title: Glossaire
---

# Démo du parcours de dépôt

Ce guide permet de présenter l'application de bout en bout : inscrire des
participants, saisir une liste d'articles, la valider au moment du dépôt, puis
imprimer les étiquettes.

Aucune compétence technique n'est nécessaire. Tout se fait depuis un navigateur.

**Durée** : 20 à 30 minutes avec les questions.

## L'essentiel en trois phrases

L'adresse de la démonstration est **<https://dev-j.bourse.alpe-plaisance.org>**.

Toutes les données y sont inventées : aucun vrai déposant, aucun vrai article,
et **aucun courriel n'est réellement envoyé**. Vous pouvez donc tout essayer
sans crainte de conséquence.

C'est un environnement de test : il est remis à zéro régulièrement, et ce qui y
est saisi finit par disparaître.

## Les quatre étapes montrées

| | Étape | Qui la fait |
|---|---|---|
| 1 | Inscrire les participants à la bourse | Gestionnaire |
| 2 | Saisir sa liste d'articles | Déposant |
| 3 | Vérifier les articles au dépôt | Bénévole |
| 4 | Imprimer les étiquettes | Gestionnaire |

Chaque étape se fait avec un compte différent, car chaque rôle ne voit que ce
qui le concerne. C'est précisément ce que la démonstration cherche à montrer.

## Les comptes

| Rôle | Identifiant | Mot de passe |
|---|---|---|
| Administrateur | `admin@alpe-bourse.fr` | `Admin123!` |
| Gestionnaire | `manager@alpe-bourse.fr` | `Manager123!` |
| Bénévole | `volunteer@alpe-bourse.fr` | `Volunteer123!` |
| Déposant | `deposant@example.com` | `Deposant123!` |

Ces comptes n'existent que sur l'environnement de démonstration.

> **Ouvrez une fenêtre de navigation privée par rôle.**
> Dans une même fenêtre, se connecter avec un compte déconnecte le précédent.
> En préparant quatre fenêtres à l'avance, vous passez d'un rôle à l'autre d'un
> simple clic sur l'onglet, sans ressaisir de mot de passe devant votre public.

## Avant de commencer : deux réglages indispensables

À faire **une fois**, dix minutes avant, connecté en **administrateur**.

### 1. Activer le mode formation

Sans ce réglage, l'étape 3 sera impossible : la bourse ne pourra pas passer à
l'étape « Dépôt » avant la date prévue au calendrier, et la démonstration
s'arrêtera au milieu.

Le mode formation permet de faire avancer la bourse d'une étape à l'autre
manuellement, ce qui est indispensable pour tout montrer en vingt minutes.

1. Menu de gauche → **Éditions** → ouvrir *Bourse Printemps 2026*
2. Onglet **Actions**
3. Section « Mode formation » → bouton **Activer**

Un bandeau apparaît alors sur toutes les pages pour rappeler qu'il s'agit d'un
entraînement. C'est normal, et plutôt rassurant pour le public.

### 2. Vérifier la date limite de déclaration

Passé cette date, les déposants ne peuvent plus saisir d'articles — et l'étape 2
échouera sans explication très claire.

1. Onglet **Configuration** de la même bourse
2. Champ **Date limite de déclaration des articles**
3. Si la date est passée, mettez-en une dans plusieurs mois
4. **Enregistrer les modifications**

## Étape 1 — Inscrire les participants

**Connectez-vous en gestionnaire.**

1. Menu de gauche → **Éditions** → *Bourse Printemps 2026*
2. Onglet **Déposants**
3. Bouton **Ajouter un déposant**
4. Remplissez le formulaire, choisissez un type de liste, puis validez

**Ce qu'il faut souligner :** le participant apparaît immédiatement dans la
liste avec son type de liste et son créneau de dépôt.

Les trois types de listes correspondent à des tarifs et des couleurs
d'étiquettes différents : **Standard**, **Liste 1000** (adhérents ALPE) et
**Liste 2000** (famille et proches).

> **Sur l'import automatique.** Un bouton *Synchroniser via API* permet de
> récupérer directement les inscriptions depuis Billetweb, mais il n'apparaît
> que si un événement Billetweb a été associé à la bourse au préalable. Pour une
> démonstration, la saisie manuelle est plus sûre : elle ne dépend d'aucun
> service extérieur. Il n'existe pas d'import par fichier Excel ou CSV.

### Variante : montrer le courriel d'invitation

Pour illustrer ce que reçoit un déposant, passez par **Administration →
Invitations**, qui accepte une liste de personnes en un seul envoi.

Le courriel n'arrive dans aucune vraie boîte : il est capturé par un outil de
test, consultable sur **<https://mailhog.dev-j.bourse.alpe-plaisance.org>**
(des identifiants vous seront demandés, ceux fournis par l'administrateur).

C'est souvent le moment le plus parlant de la démonstration : on voit le
courriel exactement tel que le recevra le déposant, et le lien d'activation
fonctionne réellement.

## Étape 2 — Le déposant saisit sa liste

**Basculez sur la fenêtre du déposant** (`deposant@example.com`).

1. Menu **Mes listes**
2. Créer une liste, puis y ajouter des articles
3. Une fois la saisie terminée, valider la liste

Ce compte possède déjà une liste de six articles. Pratique pour montrer le
résultat sans tout ressaisir, mais créez-en une nouvelle si vous voulez
dérouler le formulaire en entier.

**Ce qu'il faut souligner :** l'application contrôle les quantités autorisées
par catégorie et propose une aide au prix. Le déposant valide lui-même sa liste
quand il a terminé : rien n'est figé avant ce geste.

## Étape 3 — Le bénévole vérifie les articles

Cette étape se déroule le jour du dépôt, quand le déposant apporte ses affaires.

**D'abord, faites avancer la bourse.** En administrateur, onglet **Actions** de
la bourse, passez l'étape à **Dépôt**. C'est ici que le mode formation activé
plus tôt entre en jeu.

**Puis basculez sur la fenêtre du bénévole.**

1. Menu **Revue des listes au dépôt**
2. Ouvrir une liste
3. Pour chaque article : **accepter**, **refuser** ou **corriger**
4. Clôturer la revue une fois tous les articles traités

**Ce qu'il faut souligner :** refusez un article et corrigez le prix d'un autre.
C'est le cœur du sujet — ce que le déposant a déclaré chez lui n'est pas repris
tel quel, le bénévole garde la main sur ce qui est réellement mis en vente.

## Étape 4 — Imprimer les étiquettes

**Revenez sur la fenêtre du gestionnaire.**

1. Menu **Étiquettes**
2. Choisir le mode de génération
3. Générer le PDF

**Ce qu'il faut souligner :** chaque étiquette porte un code-barres et un QR
code qui permettront le passage en caisse. Les planches sont produites en
fichiers séparés par liste, de façon à remettre à chaque déposant les siennes
sans avoir à les trier.

## Si quelque chose ne va pas

| Symptôme | Cause la plus fréquente |
|---|---|
| Impossible de faire avancer la bourse d'une étape | Le mode formation n'est pas activé |
| Le déposant ne peut pas ajouter d'article | La date limite de déclaration est dépassée |
| Le menu **Revue des listes** est absent | La bourse n'est pas à l'étape « Dépôt » |
| Un compte semble déconnecté tout seul | Deux rôles ouverts dans la même fenêtre |
| Le bouton *Synchroniser via API* n'apparaît pas | Aucun événement Billetweb associé — utilisez la saisie manuelle |

En cas de blocage réel, la remise à zéro complète prend quelques minutes et
rend l'environnement identique à sa sortie d'usine. Elle est décrite dans
[l'installation de l'environnement](deploiement-nas-synology.md), section
« Remettre à zéro avant une démonstration ».

## Préparation, en résumé

À dérouler dix minutes avant :

- [ ] Le site répond sur <https://dev-j.bourse.alpe-plaisance.org>
- [ ] Quatre fenêtres de navigation privée ouvertes, une connectée par rôle
- [ ] Mode formation activé sur *Bourse Printemps 2026*
- [ ] Date limite de déclaration dans le futur
- [ ] La bourse est à l'étape **Inscriptions ouvertes**
- [ ] Si vous montrez les courriels : MailHog accessible et identifiants en main
