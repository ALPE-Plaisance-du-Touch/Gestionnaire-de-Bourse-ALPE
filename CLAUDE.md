# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains **specifications** (not implementation) for the "Gestionnaire de Bourse ALPE" - a web application to manage second-hand goods sales events organized by ALPE Plaisance du Touch (France). The target audience is depositors (sellers) and volunteer staff.

**Current status**: Specification drafting phase. No code implementation yet.

## Document Structure

All specifications are in the `docs/` folder:

- **[README.md](docs/README.md)** - Vision, objectives, navigation
- **[plan.md](docs/plan.md)** - Backlog tracking and roadmap
- **[glossaire.md](docs/glossaire.md)** - French domain terminology (critical for consistency)
- **[personas.md](docs/personas.md)** - 4 user personas (Déposant, Bénévole, Gestionnaire, Administrateur)
- **[user-stories.md](docs/user-stories.md)** - US-001 to US-010 with acceptance criteria and tests
- **[exigences.md](docs/exigences.md)** - Functional (REQ-F-xxx) and non-functional (REQ-NF-xxx) requirements
- **[domain-model.md](docs/domain-model.md)** - Entity model, lifecycle diagrams, business rules
- **[traceability.md](docs/traceability.md)** - Bidirectional mapping US ↔ REQ ↔ Tests
- **[categories-articles.md](docs/categories-articles.md)** - Article acceptance criteria guide
- **[Reglement_deposant.md](docs/Reglement_deposant.md)** / **[Reglement_interne.md](docs/Reglement_interne.md)** - Source regulations

## Document Conventions

Each specification file has YAML front matter:
```yaml
id: DOC-xxx-TITLE
title: Document Title
status: draft | validated
version: x.y.z
updated: YYYY-MM-DD
owner: ALPE Plaisance du Touch
links: []
```

Identifiers follow these patterns:
- User Stories: `US-xxx` (e.g., US-001)
- Requirements: `REQ-F-xxx` (functional), `REQ-NF-xxx` (non-functional)
- Decisions (ADR): `DEC-xxx`
- Documents: `DOC-xxx`

## Key Domain Concepts

The application manages **Éditions** (sale events) with this lifecycle:
1. **Brouillon** → Created by admin (US-006)
2. **Configurée** → Dates/commission set (US-007)
3. **Inscriptions_ouvertes** → Billetweb import done (US-008)
4. **En_cours** → Deposits and sales active
5. **Clôturée** → Final state (US-009)

**4 Roles** with hierarchical permissions:
- Déposant (seller) - declares articles, views sales
- Bénévole (volunteer) - scans/sells items
- Gestionnaire (manager) - configures editions, imports data
- Administrateur - full control, creates/closes editions

**Special list types** (REQ-F-015):
- Standard (100-600): Regular depositors
- Liste 1000: ALPE members, white labels, 1€/list
- Liste 2000: Family/friends of members, pink labels, 5€/2 lists

## Traceability Requirements

When modifying specifications:
1. Update the corresponding traceability entry in [traceability.md](docs/traceability.md)
2. Maintain bidirectional links: US ↔ REQ ↔ Tests
3. Verify coverage metrics after changes

## Language

All specification documents are written in **French**. Domain terminology must match [glossaire.md](docs/glossaire.md) exactly.
