---
id: DOC-040-REQS
title: Exigences (fonctionnelles et non-fonctionnelles)
status: draft
version: 0.1.0
updated: 2025-11-03
owner: ALPE Plaisance du Touch
links: []
---

# Règles d’écriture

- Atomicité, testabilité, traçabilité (REQ ↔ US ↔ tests).
- Forme: « Le système DOIT … » ou « DEVRAIT … » (priorité).
- Chaque REQ inclut critères d’acceptation et métriques si applicable.

# Exigences fonctionnelles

- REQ-F-001 — Le système DOIT permettre la création de compte déposant. (US-001)
- REQ-F-002 — Le système DOIT permettre l’enregistrement d’articles avec prix, catégorie, taille. (US-002)
- REQ-F-003 — Le système DOIT générer des étiquettes scannables par article. (US-003)
- REQ-F-004 — Le système DOIT permettre le scannage/encaissement rapide en caisse. (US-004)
- REQ-F-005 — Le système DOIT calculer commissions et reversements en fin de bourse. (US-005)

# Exigences non-fonctionnelles

- REQ-NF-001 — Disponibilité pendant la bourse ≥ 99.5%.
- REQ-NF-002 — Temps moyen de scannage → encaissement ≤ 3 secondes.
- REQ-NF-003 — Conformité RGPD: consentement, droit d’accès, suppression.
- REQ-NF-004 — Accessibilité: respect WCAG 2.1 AA pour les écrans publics.

