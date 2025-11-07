# Structure du Template Excel ALPE

**Fichier source** : `docs/ListeALPEAvecMacro_Aut 25.xlsm`

Ce document décrit la structure du fichier Excel actuelle utilisé par ALPE pour générer les listes et étiquettes des déposants.

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

## Recommandations pour l'application

L'application devrait :

1. **Remplacer le Google Form** par une saisie directe dans l'application (US-002)
2. **Générer des fichiers Excel** conformes au template actuel (transition en douceur)
3. **Ajouter des QR codes** sur les étiquettes pour le scan en caisse (US-003)
4. **Permettre génération en masse** pour tous les déposants d'un créneau
5. **Offrir export PDF** en complément/alternative à Excel
6. **Enrichir les étiquettes** : numéro article, prix, description courte, catégorie
7. **Maintenir compatibilité** : permettre export format Excel actuel pour les bénévoles habitués

## Format cible pour la nouvelle application

### Liste d'articles (PDF/Excel)
- Conserver la mise en page actuelle (familière)
- Ajouter : code unique par article (EDI-xxx-Lyyy-Azz)
- Ajouter : total des articles, total montant
- Option : génération groupée (toutes les listes d'un créneau)

### Étiquettes (PDF/Excel)
- Conserver : numéro liste, info restitution
- Ajouter : **QR code** contenant code unique article
- Ajouter : numéro article (ex: 3/24)
- Ajouter : prix de vente
- Ajouter : description courte (30-50 car)
- Ajouter : catégorie (icône + texte)
- Ajouter : couleur de fond selon numéro liste
- Format : 105×74mm (8 par page A4) comme spécifié dans US-003
