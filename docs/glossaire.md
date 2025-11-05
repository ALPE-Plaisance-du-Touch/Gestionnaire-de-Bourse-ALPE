---
id: DOC-010-GLOSSAIRE
title: Glossaire
status: draft
version: 0.2.0
updated: 2025-11-05
owner: ALPE Plaisance du Touch
links: []
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
| Article | Bien individuel proposé à la vente (taille, catégorie, prix). Rattaché à un déposant et une édition. |
| Lot | Regroupement d'articles sous un même dépôt/déposant. |
| Étiquette | Code (ex: QR/Code‑barres) identifiant de manière unique un article au sein d'une édition pour scannage. |
| Vente | Transaction associant un article vendu et un paiement lors d'une édition. |
| Commission | Part de l'association prélevée sur le prix de vente (taux défini par édition). |
| Reversement | Somme due au déposant après déduction des commissions/frais, calculée en fin d'édition. |

## Processus et dates clés

| Terme | Définition |
|---|---|
| Période d'inscription | Période durant laquelle les déposants peuvent s'inscrire à une édition via Billetweb (gérée en dehors de l'application). |
| Date de dépôt | Date(s) à laquelle les déposants apportent physiquement leurs articles étiquetés sur le lieu de la bourse. |
| Date de vente | Période durant laquelle la bourse est ouverte au public pour acheter les articles. |
| Date de récupération | Date à laquelle les déposants viennent récupérer leurs articles invendus. |
| Clôture d'édition | Opération finale effectuée par un administrateur marquant la fin d'une édition (calcul des reversements, archivage). |

## Outils externes

| Terme | Définition |
|---|---|
| Billetweb | Plateforme externe de billetterie/inscriptions utilisée par ALPE pour gérer les inscriptions aux bourses. Les données sont importées dans l'application via un fichier CSV/Excel. |

# Règles de vocabulaire

- Utiliser les termes ci‑dessus de manière cohérente dans toutes les specs.
- Ajouter tout nouveau terme ici avant usage dans d’autres documents.

