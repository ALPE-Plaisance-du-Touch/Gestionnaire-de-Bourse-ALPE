# UI kit — Site web ALPE

Recréation cliquable de **https://alpe-plaisance.org/**.

## Ce qui vient de la source
- **Architecture d'information exacte** : barre supérieure (réseaux à gauche, Actualités / Événements / Contact, « Se connecter »), en-tête logo + menu déroulant à 4 entrées (L'association, Les établissements, Nos actions, Adhésion) + loupe de recherche, pied de page à 3 colonnes (« Accès rapide », « Légal », « Restons en contact ») et mention « © 2022. Site web par Julien DEL RIO. »
- **Copie réelle** reprise des pages `/lassociation/` et `/nos-actions/bourse-aux-vetements/` (valeurs LOCALE / INDÉPENDANTE / APOLITIQUE, chiffres, horaires, avertissement « créneaux complets », signature « L'Équipe Bourse ALPE »).
- Les douze établissements, avec les villes hors Plaisance (Galilée à La Salvetat, Dissart-Françoise à Tournefeuille).

## Ce qui a été reconstruit
Le site en production tourne sous un **thème Avada génériqu**e : sa mise en page n'exprime pas la marque (pas de couleurs ALPE hors logo, typographie par défaut du thème). Les écrans ici appliquent les fondations reconstruites du design system (bleu / orange / jaune, Baloo 2 + Quicksand + Nunito, rayons généreux, ombres bleutées) **à l'architecture réelle du site**. C'est une proposition de refonte cohérente avec la marque, pas une copie pixel du thème.

## Écrans
| Fichier | Écran |
| --- | --- |
| `SiteChrome.jsx` | Barre supérieure, en-tête collant, menus déroulants, pied de page, `PageHero`, `Container` |
| `HomeScreen.jsx` | Accueil : hero, bandeau de chiffres, nos actions, agenda, établissements filtrables, bandeau d'adhésion |
| `AssociationScreen.jsx` | Présentation, les trois valeurs, équipe, cotisation |
| `BourseScreen.jsx` | Page action : bourse aux vêtements, onglets déposer / acheter / bénévole, éditions précédentes |
| `AdhesionScreen.jsx` | Formulaire d'adhésion complet, modale de confirmation, notification |

## Interactions
Navigation entre les 4 écrans (logo, menus, boutons), menus déroulants au survol, onglets de filtrage des établissements et de la page bourse, formulaire d'adhésion (consentement obligatoire → modale → notification).

## Manques signalés dans l'interface
Aucune photothèque n'a été fournie : les zones photo (hero, cartes événement, portrait de la présidente) sont laissées **volontairement vides** avec une mention explicite.
