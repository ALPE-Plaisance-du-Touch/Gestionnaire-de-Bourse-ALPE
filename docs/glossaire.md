---
id: DOC-010-GLOSSAIRE
title: Glossaire
status: draft
version: 0.3.0
updated: 2025-11-06
owner: ALPE Plaisance du Touch
links:
  - rel: source
    href: Reglement_deposant.md
    title: Règlement déposant
---

# Termes et définitions

## Concepts généraux

| Terme | Définition |
|---|---|
| Bourse | Événement d'échange/vente organisé par ALPE avec dépôt d'articles, vente, reversement. |
| Édition (de bourse) | Instance spécifique d'une bourse avec ses propres dates, lieu et règles. Généralement deux éditions par an : printemps et automne. Synonyme : Session de bourse. |
| Cycle de vie d'une édition | Séquence d'étapes : Création → Configuration → Inscriptions → Dépôts → Vente → Récupération invendus → Clôture. |

## Acteurs et rôles

| Terme | Définition |
|---|---|
| Déposant | Personne qui confie des articles à vendre lors d'une bourse. S'inscrit via Billetweb puis active son compte dans l'application. |
| Bénévole | Membre organisateur qui participe à la gestion opérationnelle de la bourse (accueil, scannage, encaissement). |
| Gestionnaire | Bénévole avec des droits étendus pour configurer une édition (dates, import inscriptions, paramètres). Ne peut pas gérer les utilisateurs ni créer/clôturer des éditions. |
| Administrateur | Rôle le plus élevé : peut créer et clôturer des éditions, gérer la liste des utilisateurs et leurs rôles, et effectuer toutes les actions d'un gestionnaire. |

## Articles et transactions

| Terme | Définition |
|---|---|
| Liste | Ensemble d'articles déclarés par un déposant pour une édition (max 24 articles dont 12 vêtements max). Chaque déposant peut avoir 2 listes par édition. Anciennement remplie via Google Forms, maintenant via l'application. |
| Article | Bien individuel proposé à la vente (taille, catégorie, prix). Rattaché à un déposant, une liste et une édition. Prix minimum 1€. |
| Lot | Regroupement d'articles vendus ensemble (ex: 3 bodys bébé de même taille/marque). Un lot compte comme un seul article dans la liste. |
| Catégorie d'article | Classification des articles : vêtements, puériculture, jouets, livres, chaussures, etc. Chaque catégorie a ses propres règles d'acceptation. |
| Étiquette | Code (QR/Code-barres) identifiant de manière unique un article au sein d'une édition pour scannage. Créée par les bénévoles lors du dépôt. |
| Vente | Transaction associant un article vendu et un paiement lors d'une édition. |
| Commission | Part de l'association prélevée sur le prix de vente (20% du montant des ventes selon règlement). |
| Frais d'inscription | Montant fixe de 5€ payé par le déposant lors de l'inscription pour 2 listes. Non remboursable en cas d'annulation. |
| Reversement | Somme due au déposant après déduction des commissions, calculée en fin d'édition. Versement par chèque sous quinzaine. |

## Processus et dates clés

| Terme | Définition |
|---|---|
| Période d'inscription | Période durant laquelle les déposants peuvent s'inscrire à une édition via Billetweb (gérée en dehors de l'application). |
| Créneau de dépôt | Plage horaire réservée par le déposant pour venir déposer ses articles. Défini lors de l'inscription et garanti par le paiement des frais d'inscription. |
| Date limite de déclaration | Date avant laquelle le déposant doit avoir complété ses listes d'articles. Passé ce délai, le dépôt n'est pas pris en compte. |
| Date de dépôt | Date(s) à laquelle les déposants apportent physiquement leurs articles sur le lieu de la bourse. Articles vérifiés par les bénévoles et étiquetés. |
| Date de vente | Période durant laquelle la bourse est ouverte au public pour acheter les articles. |
| Date de récupération des invendus | Date à laquelle les déposants viennent récupérer leurs articles non vendus. Articles non récupérés sont donnés à des associations caritatives. |
| Clôture d'édition | Opération finale effectuée par un administrateur marquant la fin d'une édition (calcul des reversements, archivage). |

## Outils externes

| Terme | Définition |
|---|---|
| Billetweb | Plateforme externe de billetterie/inscriptions utilisée par ALPE pour gérer les inscriptions aux bourses. Les données sont importées dans l'application via un fichier CSV/Excel. |

# Règles de vocabulaire

- Utiliser les termes ci‑dessus de manière cohérente dans toutes les specs.
- Ajouter tout nouveau terme ici avant usage dans d’autres documents.

