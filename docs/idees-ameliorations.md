# Idées d'améliorations

Ce document recense les idées d'améliorations futures pour le Gestionnaire de Bourse ALPE.

---

## 1. Import d'une édition Bourse depuis Billetweb via l'API

**Description** : Permettre la création automatique d'une édition (avec ses créneaux de dépôt) directement depuis l'API Billetweb, sans saisie manuelle.

**Avantages** :
- Évite la double saisie des informations de l'événement
- Synchronisation des créneaux horaires avec Billetweb
- Réduction des erreurs de configuration

**Prérequis** :
- Accès à l'API Billetweb (clé API organisateur)
- Mapping entre les données Billetweb et le modèle Edition

---

## 2. Import des inscrits d'une bourse via l'API Billetweb

**Description** : Remplacer l'import manuel par fichier CSV par une synchronisation directe avec l'API Billetweb pour récupérer les participants inscrits.

**Avantages** :
- Import en temps réel sans export/import de fichier
- Possibilité de synchronisation périodique automatique
- Données toujours à jour avec Billetweb

**Prérequis** :
- Accès à l'API Billetweb (clé API organisateur)
- Gestion des tokens d'authentification API
- Mapping entre les champs API et le modèle EditionDepositor

---
