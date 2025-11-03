---
id: DOC-050-ARCHI
title: Architecture & Contexte
status: draft
version: 0.1.0
updated: 2025-11-03
owner: ALPE Plaisance du Touch
links: []
---

# Contexte (C4 niveau Contexte — ébauche)

```mermaid
flowchart LR
  Deposant((Déposant)) -- Web/App --> App[Application Bourse ALPE]
  Benevole((Bénévole)) -- Web/App --> App
  App -- Notifications --> Email[Service Email/SMS]
  App -- Paiements --> Bank[(Paiement/Reversements)]
```

# Contraintes & hypothèses

- Stack et hébergement à décider (voir ADRs). Priorité: simplicité et robustesse.
- Mode offline éventuel côté caisse à évaluer.

# Risques (exemples)

- Pics de charge pendant la bourse (encaissement simultané).
- Qualité réseau variable sur site.
- Cohérence inventaire et anti‑doublon étiquettes.

