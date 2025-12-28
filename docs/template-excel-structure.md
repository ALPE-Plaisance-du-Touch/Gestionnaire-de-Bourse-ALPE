# Structure du Template Excel ALPE

**Fichier source** : `docs/ListeALPEAvecMacro_Aut 25.xlsm`

> ⚠️ **IMPORTANT** : Ce document est une **documentation de référence uniquement**.
>
> **Objectif de l'application** : **Remplacer** le processus actuel Google Form + Excel + macros VBA.
>
> Ce fichier Excel représente le **format actuel** que les bénévoles connaissent.
> L'application va :
> - **Remplacer** le Google Form par une saisie directe (US-002)
> - **Remplacer** la génération Excel par une génération PDF (US-003)
> - **S'inspirer** de la mise en page actuelle pour que le PDF soit familier
> - **Améliorer** en ajoutant : QR codes, codes uniques, génération en masse, traçabilité
>
> **Cette documentation sert à** :
> - Comprendre le format visuel actuel (pour le reproduire dans les PDFs)
> - Identifier les informations affichées (pour ne rien oublier)
> - Connaître les limitations du processus actuel (pour les corriger)

Ce document décrit la structure du fichier Excel actuellement utilisé par ALPE pour générer les listes et étiquettes des déposants.

## Structure générale

Le fichier contient **4 feuilles** :
1. **ExportForm** : Import des données depuis Google Sheet
2. **Liste** : Liste d'articles du déposant
3. **Etiqu12** : Planche d'étiquettes pour 12 articles
4. **Etiqu24** : Planche d'étiquettes pour 24 articles

## Feuille 1 : ExportForm

### Champs du formulaire Google Form (colonnes)

Source : ligne copiée-collée depuis le Google Sheet qui recueille les réponses du Google Form

| Colonne | Nom du champ | Description |
|---------|--------------|-------------|
| A | Horodateur | Date/heure de soumission du formulaire |
| B | Adresse e-mail | Email du déposant |
| C | Numéro de liste | Numéro de liste assigné |
| D | Nom | Nom du déposant |
| E | Prénom | Prénom du déposant |
| F | Adresse - voie | Rue |
| G | Adresse - CP Ville | Code postal + Ville |
| H | Numéro de téléphone | Téléphone |
| I | Catégorie | Catégorie de l'article |
| J | Désignation | Description de l'article |
| K | Couleur | Couleur de l'article |
| L | Marque | Marque de l'article |
| M | Genre | Genre (Fille/Garçon/Mixte/Adulte) |
| N | Taille | Taille de l'article |
| O | Prix | Prix de vente |
| P+ | Avez-vous un autre article? | Questions répétées pour articles suivants |

**Note** : Le Google Form permet de saisir plusieurs articles. Les champs se répètent pour chaque article additionnel.

## Feuille 2 : Liste

### En-tête de la liste

```
BOURSE de VETEMENTS et de JOUETS
Liste n°[NUMERO]

Association locale de parents d'élèves
```

### Informations déposant (en haut)

```
Nom : [NOM]
Prénom : [PRENOM]
Adresse : [ADRESSE_VOIE]
          [CP_VILLE]
Téléphone : [TELEPHONE]
Date : _ _ / _ _ / _ _
```

### Tableau des articles

| N° | Désignation/Catégorie/Couleur/Marque/Genre/Taille | Prix | Vendu/NV |
|----|---------------------------------------------------|------|----------|
| 1  | [Article 1]                                       | [Prix] | □ |
| 2  | [Article 2]                                       | [Prix] | □ |
| ... | ...                                              | ...  | ... |
| 24 | [Article 24]                                      | [Prix] | □ |

**Format colonne "Désignation"** : Les informations sont combinées sur plusieurs lignes :
- Ligne 1 : Désignation
- Ligne 2 : Catégorie - Genre - Taille
- Ligne 3 : Couleur - Marque

### Champs bénévoles (bas de page)

```
Réservé à l'association

Bénévole 1 : .........................................................
Bénévole 2 : .........................................................
Enregistré par : .........................................................
Tri fait par : .........................................................

Enveloppe timbrée  □
Poche récupérée par le déposant le : _ _  / _ _ / _ _
Signature du déposant : _____________
```

### Mentions légales

```
L'association "ALPE" décline toute responsabilité en cas de perte ou de vol.
Les articles invendus non retirés à l'issue de la restitution seront donnés aux
divers organismes caritatifs de Plaisance du Touch.
Les bénéfices serviront à diverses actions destinées aux écoles, collège et lycée
de la commune.
```

## Feuille 3 : Etiqu12 (Étiquettes 12 articles)

Planche de **12 étiquettes** (format probablement 2 colonnes × 6 lignes)

### Contenu d'une étiquette

```
ATTENTION :
Conserver cette étiquette pour la restitution

Liste [NUMERO]

Restitution :
Le lundi qui suit le week-end de la Bourse
Entre 18h30 et 19h30
```

**Note** : Chaque étiquette correspond à un article de la liste. Pas de QR code visible, seulement le numéro de liste.

## Feuille 4 : Etiqu24 (Étiquettes 24 articles)

Planche de **24 étiquettes** (format probablement 2 colonnes × 12 lignes ou 3 colonnes × 8 lignes)

Structure identique à Etiqu12, mais avec 24 étiquettes au lieu de 12.

## Macros VBA

Le fichier contient des macros VBA (`xl/vbaProject.bin`) qui automatisent probablement :
- Import des données depuis la feuille ExportForm vers la feuille Liste
- Génération des étiquettes (remplissage des feuilles Etiqu12/Etiqu24)
- Formatage et mise en page

## Workflow actuel

1. Déposant remplit le Google Form en ligne
2. Réponses collectées dans un Google Sheet
3. Gestionnaire copie une ligne du Google Sheet
4. Gestionnaire colle la ligne dans l'onglet ExportForm du fichier Excel
5. Gestionnaire exécute une macro VBA
6. La macro remplit automatiquement :
   - La feuille Liste avec les infos du déposant et ses articles
   - Les feuilles Etiqu12 ou Etiqu24 selon le nombre d'articles
7. Gestionnaire imprime :
   - La Liste (pour pochette transparente)
   - Les étiquettes (à découper)
8. Préparation de la pochette avec liste + étiquettes découpées

## Observations et limitations

### Points forts
- Format familier pour les bénévoles
- Génération automatique via macros VBA
- Impression directe depuis Excel
- Format physique adapté (liste + étiquettes détachables)

### Limitations identifiées
- **Pas de QR code** sur les étiquettes (scan en caisse impossible)
- **Processus manuel** : copier-coller ligne par ligne depuis Google Sheet
- **Pas de numérotation unique** par article (seulement numéro de liste)
- **Pas de traçabilité numérique** des ventes
- **Macros VBA** : dépendance à Microsoft Excel, pas de version LibreOffice/Google Sheets
- **Gestion ligne par ligne** : fastidieux pour 245 déposants
- **Pas de génération en masse** par créneau
- **Format étiquette simple** : pas de prix, pas de description article, pas de catégorie

## Ce que l'application va faire (en remplacement)

L'application va **remplacer complètement** le processus Excel en :

1. **Remplaçant le Google Form** par une saisie directe dans l'application web (US-002)
2. **Générant des PDFs** au lieu d'Excel (US-003)
3. **S'inspirant de la mise en page actuelle** pour que les PDFs soient familiers aux bénévoles
4. **Ajoutant des QR codes** sur les étiquettes pour le scan en caisse
5. **Permettant génération en masse** pour tous les déposants d'un créneau
6. **Enrichissant les étiquettes** : numéro article, prix, description courte, catégorie, QR code
7. **Ajoutant la traçabilité numérique** : qui a généré quoi, quand, statut impression

## Format cible pour les PDFs générés (US-003)

### Liste d'articles (PDF)
- **S'inspirer de** la mise en page Excel actuelle (familière pour les bénévoles)
- Conserver : en-tête "BOURSE DE VETEMENTS ET DE JOUETS", infos déposant, tableau articles
- Ajouter : code unique par article (EDI-xxx-Lyyy-Azz) - caché ou en petit
- Ajouter : total des articles, total montant
- Ajouter : page de séparation par déposant (pour génération en masse)
- Format : A4 portrait, 1 page par liste

### Étiquettes (PDF)
- Conserver : numéro liste, info restitution (pour familiarité)
- Ajouter : **QR code** contenant code unique article (nouveau, essentiel)
- Ajouter : numéro article (ex: "Article 3/24")
- Ajouter : prix de vente en gros
- Ajouter : description courte (30-50 caractères)
- Ajouter : catégorie avec icône
- Ajouter : couleur de fond selon numéro liste
- Format : 105×74mm, 8 par page A4 (comme spécifié dans US-003)
