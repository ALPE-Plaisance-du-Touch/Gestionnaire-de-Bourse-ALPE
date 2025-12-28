---
id: DOC-110-TESTS
title: Stratégie de Tests
status: validated
version: 1.0.0
updated: 2025-12-28
owner: ALPE Plaisance du Touch
links:
  - rel: traceability
    href: traceability.md
    title: Matrice de traçabilité
  - rel: requirements
    href: exigences.md
    title: Exigences
  - rel: api
    href: api/openapi.yaml
    title: Spécification API
---

# 1. Vue d'ensemble

Ce document définit la **stratégie de tests** pour l'application Gestionnaire de Bourse ALPE, incluant :
- La pyramide de tests et les niveaux
- Les outils et frameworks recommandés
- Les critères de couverture
- Les scénarios de test par composant
- L'intégration continue

---

# 2. Pyramide de tests

```
                    ┌───────────────┐
                    │     E2E       │  ← 10-15% des tests
                    │   (Cypress)   │     Parcours utilisateur complets
                    └───────┬───────┘
                            │
                ┌───────────┴───────────┐
                │     Intégration       │  ← 25-30% des tests
                │   (API + Services)    │     Composants interconnectés
                └───────────┬───────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │              Unitaires                │  ← 55-65% des tests
        │     (Composants isolés, fonctions)    │     Logique métier pure
        └───────────────────────────────────────┘
```

## 2.1 Répartition cible

| Niveau | Proportion | Temps exécution | Fréquence |
|--------|------------|-----------------|-----------|
| Unitaires | 55-65% | < 2 min | À chaque commit |
| Intégration | 25-30% | < 10 min | À chaque PR |
| E2E | 10-15% | < 30 min | Avant déploiement |

## 2.2 Principes directeurs

1. **Tests rapides d'abord** : Privilégier les tests unitaires pour un feedback immédiat
2. **Isolation** : Chaque test doit être indépendant et reproductible
3. **Réalisme** : Les tests d'intégration utilisent des données représentatives
4. **Couverture métier** : Prioriser les chemins critiques (ventes, reversements)
5. **Automatisation** : Tous les tests doivent être exécutables en CI/CD

---

# 3. Stack de tests

## 3.1 Frontend (React + TypeScript)

| Outil | Usage | Justification |
|-------|-------|---------------|
| **Vitest** | Tests unitaires | Rapide, compatible Vite, API Jest |
| **React Testing Library** | Tests composants | Approche accessible, best practices |
| **MSW** | Mocking API | Interception réseau réaliste |
| **Cypress** | Tests E2E | Fiable, debugging visuel, PWA support |
| **Playwright** | Alternative E2E | Multi-navigateur si nécessaire |

### Configuration Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'src/test/'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    }
  }
})
```

## 3.2 Backend (Python + FastAPI)

| Outil | Usage | Justification |
|-------|-------|---------------|
| **pytest** | Framework de test | Standard Python, fixtures puissantes |
| **pytest-asyncio** | Tests async | Support FastAPI async |
| **pytest-cov** | Couverture | Rapports détaillés |
| **httpx** | Client HTTP test | Support async, compatible TestClient |
| **factory_boy** | Fixtures | Génération données test |
| **Faker** | Données fictives | Données réalistes françaises |

### Configuration pytest

```ini
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
addopts =
    --cov=app
    --cov-report=term-missing
    --cov-report=html
    --cov-fail-under=80
```

## 3.3 Base de données

| Outil | Usage |
|-------|-------|
| **SQLite in-memory** | Tests unitaires rapides |
| **MySQL de test** | Tests intégration (Docker) |
| **pytest-mysql** | Fixtures DB |

---

# 4. Tests unitaires

## 4.1 Frontend - Composants React

### Composants à tester prioritairement

| Composant | Criticité | Tests requis |
|-----------|-----------|--------------|
| `ArticleForm` | Haute | Validation prix, catégories, limites |
| `ScannerView` | Haute | États scan, offline, erreurs |
| `VenteConfirmation` | Haute | Affichage article, prix, actions |
| `ListeEditor` | Moyenne | CRUD articles, validation liste |
| `ReversementDetail` | Moyenne | Calcul commission, totaux |
| `LoginForm` | Haute | Validation, erreurs auth |

### Exemple de test composant

```typescript
// ArticleForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ArticleForm } from './ArticleForm'

describe('ArticleForm', () => {
  it('refuse un prix inférieur à 1€', async () => {
    render(<ArticleForm onSubmit={vi.fn()} />)

    const prixInput = screen.getByLabelText(/prix/i)
    fireEvent.change(prixInput, { target: { value: '0.50' } })
    fireEvent.blur(prixInput)

    expect(screen.getByText(/minimum 1€/i)).toBeInTheDocument()
  })

  it('refuse un prix supérieur à 150€', async () => {
    render(<ArticleForm onSubmit={vi.fn()} />)

    const prixInput = screen.getByLabelText(/prix/i)
    fireEvent.change(prixInput, { target: { value: '200' } })
    fireEvent.blur(prixInput)

    expect(screen.getByText(/maximum 150€/i)).toBeInTheDocument()
  })

  it('limite les vêtements à 12 par liste', async () => {
    const listeWith12Vetements = mockListeWith12Vetements()
    render(<ArticleForm liste={listeWith12Vetements} onSubmit={vi.fn()} />)

    const categorieSelect = screen.getByLabelText(/catégorie/i)
    fireEvent.change(categorieSelect, { target: { value: 'vetement' } })

    expect(screen.getByText(/limite de 12 vêtements atteinte/i)).toBeInTheDocument()
  })
})
```

### Hooks personnalisés à tester

| Hook | Tests |
|------|-------|
| `useOfflineStatus` | Détection online/offline, callbacks |
| `useVenteQueue` | File d'attente, persistance, sync |
| `useScanArticle` | Recherche, états, erreurs |
| `useAuth` | Login, logout, refresh token |

## 4.2 Backend - Services Python

### Services à tester prioritairement

| Service | Criticité | Tests requis |
|---------|-----------|--------------|
| `VenteService` | Critique | Création, annulation, calcul total |
| `ReversementService` | Critique | Calcul commission, frais listes |
| `ArticleService` | Haute | Validation, limites, catégories |
| `EtiquetteService` | Haute | Génération QR, PDF |
| `ImportBilletwebService` | Moyenne | Parsing CSV, doublons, invitations |
| `AuthService` | Haute | Tokens, validation, blocage |

### Exemple de test service

```python
# tests/unit/test_reversement_service.py
import pytest
from decimal import Decimal
from app.services.reversement import ReversementService

class TestReversementService:
    """Tests du calcul des reversements"""

    def test_calcul_commission_standard(self):
        """La commission de 20% est correctement calculée"""
        service = ReversementService()

        montant_brut = Decimal("100.00")
        commission = service.calculer_commission(montant_brut, taux=Decimal("0.20"))

        assert commission == Decimal("20.00")

    def test_calcul_reversement_liste_standard(self):
        """Reversement = brut - commission (pas de frais liste standard)"""
        service = ReversementService()
        ventes = [
            {"prix": Decimal("10.00")},
            {"prix": Decimal("25.00")},
            {"prix": Decimal("15.00")},
        ]

        reversement = service.calculer_reversement(
            ventes=ventes,
            type_liste="standard",
            taux_commission=Decimal("0.20")
        )

        # Brut = 50€, Commission = 10€, Net = 40€
        assert reversement.montant_brut == Decimal("50.00")
        assert reversement.commission == Decimal("10.00")
        assert reversement.frais_liste == Decimal("0.00")
        assert reversement.montant_net == Decimal("40.00")

    def test_calcul_reversement_liste_1000(self):
        """Liste 1000 : frais de 1€ déduits du reversement"""
        service = ReversementService()
        ventes = [{"prix": Decimal("50.00")}]

        reversement = service.calculer_reversement(
            ventes=ventes,
            type_liste="1000",
            taux_commission=Decimal("0.20")
        )

        # Brut = 50€, Commission = 10€, Frais = 1€, Net = 39€
        assert reversement.frais_liste == Decimal("1.00")
        assert reversement.montant_net == Decimal("39.00")

    def test_calcul_reversement_liste_2000(self):
        """Liste 2000 : frais de 2.50€ déduits (5€ pour 2 listes)"""
        service = ReversementService()
        ventes = [{"prix": Decimal("50.00")}]

        reversement = service.calculer_reversement(
            ventes=ventes,
            type_liste="2000",
            taux_commission=Decimal("0.20")
        )

        # Brut = 50€, Commission = 10€, Frais = 2.50€, Net = 37.50€
        assert reversement.frais_liste == Decimal("2.50")
        assert reversement.montant_net == Decimal("37.50")

    def test_reversement_aucune_vente(self):
        """Sans vente, le reversement est nul (mais frais déduits si applicables)"""
        service = ReversementService()

        reversement = service.calculer_reversement(
            ventes=[],
            type_liste="1000",
            taux_commission=Decimal("0.20")
        )

        assert reversement.montant_brut == Decimal("0.00")
        assert reversement.montant_net == Decimal("-1.00")  # Frais liste non couverts
```

### Règles métier à couvrir

| Règle | Fichier test | Cas |
|-------|--------------|-----|
| Max 2 listes/édition | `test_liste_service.py` | Création 3ème liste → erreur |
| Max 24 articles/liste | `test_article_service.py` | 25ème article → erreur |
| Max 12 vêtements/liste | `test_article_service.py` | 13ème vêtement → erreur |
| Prix 1€ - 150€ | `test_article_service.py` | Prix hors bornes → erreur |
| Commission 20% | `test_reversement_service.py` | Calcul exact |
| Token invitation 7j | `test_invitation_service.py` | Expiration vérifiée |
| Mot de passe complexe | `test_auth_service.py` | Règles validation |

---

# 5. Tests d'intégration

## 5.1 Tests API (Backend)

### Endpoints critiques à tester

| Endpoint | Méthode | Tests |
|----------|---------|-------|
| `/api/auth/login` | POST | Succès, mauvais credentials, blocage |
| `/api/auth/activate` | POST | Token valide, expiré, déjà utilisé |
| `/api/ventes` | POST | Création vente, article déjà vendu, offline sync |
| `/api/ventes/{id}` | DELETE | Annulation gestionnaire, unauthorized |
| `/api/reversements/calculate` | POST | Calcul batch, édition non clôturée |
| `/api/etiquettes/generate` | POST | Génération PDF, job async |
| `/api/editions/{id}/import` | POST | Import CSV, doublons, validation |

### Exemple de test API

```python
# tests/integration/test_ventes_api.py
import pytest
from httpx import AsyncClient
from app.main import app

class TestVentesAPI:
    """Tests d'intégration des endpoints ventes"""

    @pytest.fixture
    async def client(self):
        async with AsyncClient(app=app, base_url="http://test") as client:
            yield client

    @pytest.fixture
    async def auth_headers(self, client):
        """Authentification bénévole pour les tests"""
        response = await client.post("/api/auth/login", json={
            "email": "benevole@test.com",
            "password": "TestPassword123!"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    async def test_creation_vente_succes(self, client, auth_headers, article_disponible):
        """Création d'une vente pour un article disponible"""
        response = await client.post(
            "/api/ventes",
            json={"article_id": article_disponible.id, "caisse_id": "C1"},
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["article_id"] == article_disponible.id
        assert data["statut"] == "vendu"
        assert "horodatage" in data

    async def test_creation_vente_article_deja_vendu(self, client, auth_headers, article_vendu):
        """Impossible de vendre un article déjà vendu"""
        response = await client.post(
            "/api/ventes",
            json={"article_id": article_vendu.id, "caisse_id": "C1"},
            headers=auth_headers
        )

        assert response.status_code == 409
        assert "déjà vendu" in response.json()["detail"].lower()

    async def test_creation_vente_unauthorized(self, client, article_disponible):
        """Un utilisateur non authentifié ne peut pas créer de vente"""
        response = await client.post(
            "/api/ventes",
            json={"article_id": article_disponible.id, "caisse_id": "C1"}
        )

        assert response.status_code == 401

    async def test_annulation_vente_gestionnaire(self, client, gestionnaire_headers, vente_existante):
        """Un gestionnaire peut annuler une vente"""
        response = await client.delete(
            f"/api/ventes/{vente_existante.id}",
            headers=gestionnaire_headers
        )

        assert response.status_code == 200
        assert response.json()["statut"] == "annulé"

    async def test_annulation_vente_benevole_interdit(self, client, auth_headers, vente_existante):
        """Un bénévole ne peut pas annuler une vente"""
        response = await client.delete(
            f"/api/ventes/{vente_existante.id}",
            headers=auth_headers
        )

        assert response.status_code == 403
```

## 5.2 Tests synchronisation offline

```python
# tests/integration/test_offline_sync.py

class TestOfflineSync:
    """Tests de synchronisation des ventes offline"""

    async def test_sync_ventes_offline_succes(self, client, auth_headers):
        """Synchronisation réussie des ventes créées offline"""
        ventes_offline = [
            {
                "article_id": 1,
                "caisse_id": "C1",
                "horodatage_local": "2025-03-15T14:30:00Z",
                "signature_hmac": "abc123..."
            },
            {
                "article_id": 2,
                "caisse_id": "C1",
                "horodatage_local": "2025-03-15T14:31:00Z",
                "signature_hmac": "def456..."
            }
        ]

        response = await client.post(
            "/api/ventes/sync",
            json={"ventes": ventes_offline},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["synchronisees"] == 2
        assert data["conflits"] == 0

    async def test_sync_conflit_article_deja_vendu(self, client, auth_headers, article_vendu):
        """Détection de conflit : article vendu par une autre caisse"""
        vente_offline = {
            "article_id": article_vendu.id,
            "caisse_id": "C2",
            "horodatage_local": "2025-03-15T14:35:00Z",  # Après la vente existante
            "signature_hmac": "xyz789..."
        }

        response = await client.post(
            "/api/ventes/sync",
            json={"ventes": [vente_offline]},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["synchronisees"] == 0
        assert data["conflits"] == 1
        assert data["details_conflits"][0]["raison"] == "article_deja_vendu"

    async def test_sync_signature_invalide(self, client, auth_headers):
        """Rejet d'une vente avec signature HMAC invalide"""
        vente_falsifiee = {
            "article_id": 1,
            "caisse_id": "C1",
            "horodatage_local": "2025-03-15T14:30:00Z",
            "signature_hmac": "signature_invalide"
        }

        response = await client.post(
            "/api/ventes/sync",
            json={"ventes": [vente_falsifiee]},
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "signature" in response.json()["detail"].lower()
```

## 5.3 Tests base de données

```python
# tests/integration/test_db_transactions.py

class TestTransactionsDB:
    """Tests d'intégrité transactionnelle"""

    async def test_vente_atomique(self, db_session):
        """La création de vente est atomique (tout ou rien)"""
        article = await create_article(db_session)

        # Simuler une erreur pendant la transaction
        with pytest.raises(Exception):
            async with db_session.begin():
                await VenteService.creer_vente(article.id, "C1")
                raise Exception("Erreur simulée")

        # L'article ne doit pas être marqué vendu
        await db_session.refresh(article)
        assert article.statut == "disponible"

    async def test_calcul_reversement_coherent(self, db_session, edition_avec_ventes):
        """Le calcul des reversements est cohérent avec les ventes"""
        reversements = await ReversementService.calculer_tous(edition_avec_ventes.id)

        # Vérifier la somme des reversements
        total_brut = sum(r.montant_brut for r in reversements)
        total_ventes = await VenteService.get_total_ventes(edition_avec_ventes.id)

        assert total_brut == total_ventes
```

---

# 6. Tests End-to-End (E2E)

## 6.1 Scénarios critiques

### SC-E2E-001 : Parcours complet déposant

```typescript
// cypress/e2e/deposant-parcours-complet.cy.ts

describe('Parcours Déposant Complet', () => {
  beforeEach(() => {
    cy.resetDatabase()
    cy.createInvitation('marie@test.com')
  })

  it('De l\'activation à la consultation des ventes', () => {
    // 1. Activation du compte
    cy.visit('/activation?token=valid-token')
    cy.get('[data-testid="password"]').type('MonMotDePasse123!')
    cy.get('[data-testid="password-confirm"]').type('MonMotDePasse123!')
    cy.get('[data-testid="accept-cgu"]').check()
    cy.get('[data-testid="accept-rgpd"]').check()
    cy.get('[data-testid="submit"]').click()

    cy.url().should('include', '/dashboard')
    cy.contains('Bienvenue').should('be.visible')

    // 2. Création d'une liste
    cy.get('[data-testid="nouvelle-liste"]').click()
    cy.get('[data-testid="nom-liste"]').type('Vêtements printemps')
    cy.get('[data-testid="creer-liste"]').click()

    cy.contains('Liste créée').should('be.visible')

    // 3. Ajout d'articles
    cy.get('[data-testid="ajouter-article"]').click()
    cy.get('[data-testid="description"]').type('Pantalon bleu taille 8 ans')
    cy.get('[data-testid="categorie"]').select('Vêtement')
    cy.get('[data-testid="prix"]').type('8')
    cy.get('[data-testid="sauvegarder-article"]').click()

    cy.contains('Article ajouté').should('be.visible')

    // 4. Validation de la liste
    cy.get('[data-testid="valider-liste"]').click()
    cy.get('[data-testid="confirmer-validation"]').click()

    cy.contains('Liste validée').should('be.visible')
    cy.get('[data-testid="statut-liste"]').should('contain', 'Validée')

    // 5. Consultation des ventes (simuler une vente)
    cy.simulerVente('article-1')

    cy.visit('/mes-ventes')
    cy.contains('Pantalon bleu').should('be.visible')
    cy.get('[data-testid="montant-total"]').should('contain', '8,00 €')
  })
})
```

### SC-E2E-002 : Vente en caisse avec mode offline

```typescript
// cypress/e2e/caisse-offline.cy.ts

describe('Vente en Caisse - Mode Offline', () => {
  beforeEach(() => {
    cy.resetDatabase()
    cy.loginAs('benevole')
    cy.visit('/caisse')
  })

  it('Gère la bascule offline et la resynchronisation', () => {
    // 1. Vente normale en ligne
    cy.scanArticle('ART-001')
    cy.contains('Pantalon bleu - 8,00 €').should('be.visible')
    cy.get('[data-testid="confirmer-vente"]').click()
    cy.contains('Vente enregistrée').should('be.visible')

    // 2. Simuler perte réseau
    cy.goOffline()
    cy.get('[data-testid="status-connexion"]').should('contain', 'OFFLINE')
    cy.get('[data-testid="status-connexion"]').should('have.class', 'bg-orange')

    // 3. Vente en mode offline
    cy.scanArticle('ART-002')
    cy.contains('T-shirt rouge - 5,00 €').should('be.visible')
    cy.get('[data-testid="confirmer-vente"]').click()
    cy.contains('Vente enregistrée localement').should('be.visible')
    cy.get('[data-testid="ventes-en-attente"]').should('contain', '1')

    // 4. Retour en ligne
    cy.goOnline()
    cy.get('[data-testid="status-connexion"]').should('contain', 'ONLINE')

    // 5. Vérifier synchronisation
    cy.contains('Synchronisation en cours').should('be.visible')
    cy.contains('1 vente synchronisée').should('be.visible')
    cy.get('[data-testid="ventes-en-attente"]').should('contain', '0')
  })

  it('Détecte les conflits de synchronisation', () => {
    // 1. Aller offline
    cy.goOffline()

    // 2. Vendre un article
    cy.scanArticle('ART-003')
    cy.get('[data-testid="confirmer-vente"]').click()

    // 3. Simuler vente du même article sur autre caisse (côté serveur)
    cy.simulerVenteAutreCaisse('ART-003')

    // 4. Retour en ligne
    cy.goOnline()

    // 5. Vérifier alerte conflit
    cy.contains('Conflit détecté').should('be.visible')
    cy.contains('Article déjà vendu').should('be.visible')
    cy.get('[data-testid="conflits-count"]').should('contain', '1')
  })
})
```

### SC-E2E-003 : Gestion édition par gestionnaire

```typescript
// cypress/e2e/gestionnaire-edition.cy.ts

describe('Gestion Édition - Gestionnaire', () => {
  beforeEach(() => {
    cy.resetDatabase()
    cy.loginAs('gestionnaire')
  })

  it('Configure une édition et importe les inscriptions', () => {
    // 1. Accéder à l'édition
    cy.visit('/editions/printemps-2025')

    // 2. Configurer les dates
    cy.get('[data-testid="configurer-dates"]').click()
    cy.get('[data-testid="date-depot-debut"]').type('2025-03-10')
    cy.get('[data-testid="date-depot-fin"]').type('2025-03-14')
    cy.get('[data-testid="date-vente"]').type('2025-03-15')
    cy.get('[data-testid="date-recuperation"]').type('2025-03-17')
    cy.get('[data-testid="sauvegarder-dates"]').click()

    cy.contains('Dates configurées').should('be.visible')

    // 3. Importer inscriptions Billetweb
    cy.get('[data-testid="importer-billetweb"]').click()
    cy.get('[data-testid="upload-csv"]').attachFile('inscriptions-test.csv')

    // Prévisualisation
    cy.contains('50 inscriptions détectées').should('be.visible')
    cy.contains('3 doublons').should('be.visible')

    cy.get('[data-testid="confirmer-import"]').click()
    cy.contains('47 invitations envoyées').should('be.visible')

    // 4. Vérifier statut édition
    cy.get('[data-testid="statut-edition"]').should('contain', 'Inscriptions ouvertes')
  })

  it('Génère les étiquettes en masse', () => {
    cy.visit('/editions/printemps-2025/etiquettes')

    // Sélectionner toutes les listes validées
    cy.get('[data-testid="select-all"]').check()
    cy.contains('150 listes sélectionnées').should('be.visible')

    // Lancer génération
    cy.get('[data-testid="generer-etiquettes"]').click()

    // Attendre job async
    cy.contains('Génération en cours', { timeout: 5000 }).should('be.visible')
    cy.contains('Génération terminée', { timeout: 120000 }).should('be.visible')

    // Télécharger
    cy.get('[data-testid="telecharger-pdf"]').click()
    cy.verifyDownload('etiquettes-printemps-2025.pdf')
  })
})
```

### SC-E2E-004 : Calcul et validation reversements

```typescript
// cypress/e2e/reversements.cy.ts

describe('Reversements - Fin d\'édition', () => {
  beforeEach(() => {
    cy.resetDatabase()
    cy.createEditionAvecVentes()
    cy.loginAs('gestionnaire')
  })

  it('Calcule et génère les bordereaux de reversement', () => {
    cy.visit('/editions/printemps-2025/reversements')

    // 1. Lancer le calcul
    cy.get('[data-testid="calculer-reversements"]').click()
    cy.contains('Calcul en cours').should('be.visible')
    cy.contains('Calcul terminé', { timeout: 30000 }).should('be.visible')

    // 2. Vérifier les totaux
    cy.get('[data-testid="total-ventes"]').should('contain', '4 523,50 €')
    cy.get('[data-testid="total-commission"]').should('contain', '904,70 €')
    cy.get('[data-testid="total-reversements"]').should('contain', '3 618,80 €')

    // 3. Vérifier un reversement individuel
    cy.get('[data-testid="recherche-deposant"]').type('marie@test.com')
    cy.get('[data-testid="deposant-row"]').first().click()

    cy.contains('Détail reversement').should('be.visible')
    cy.get('[data-testid="nb-articles-vendus"]').should('contain', '12')
    cy.get('[data-testid="montant-brut"]').should('contain', '85,00 €')
    cy.get('[data-testid="commission"]').should('contain', '17,00 €')
    cy.get('[data-testid="montant-net"]').should('contain', '68,00 €')

    // 4. Générer bordereau PDF
    cy.get('[data-testid="generer-bordereau"]').click()
    cy.verifyDownload('bordereau-marie.pdf')
  })
})
```

## 6.2 Configuration Cypress

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    setupNodeEvents(on, config) {
      // Plugins
      on('task', {
        resetDatabase: () => { /* ... */ },
        simulerVente: (articleId) => { /* ... */ },
        createInvitation: (email) => { /* ... */ }
      })
    }
  },
  env: {
    apiUrl: 'http://localhost:8000/api'
  }
})
```

### Commandes personnalisées

```typescript
// cypress/support/commands.ts

Cypress.Commands.add('loginAs', (role: 'deposant' | 'benevole' | 'gestionnaire' | 'admin') => {
  const credentials = {
    deposant: { email: 'deposant@test.com', password: 'Test123!' },
    benevole: { email: 'benevole@test.com', password: 'Test123!' },
    gestionnaire: { email: 'gestionnaire@test.com', password: 'Test123!' },
    admin: { email: 'admin@test.com', password: 'Test123!' }
  }

  cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, credentials[role])
    .then((response) => {
      window.localStorage.setItem('access_token', response.body.access_token)
    })
})

Cypress.Commands.add('goOffline', () => {
  cy.window().then((win) => {
    cy.stub(win.navigator, 'onLine').value(false)
    win.dispatchEvent(new Event('offline'))
  })
})

Cypress.Commands.add('goOnline', () => {
  cy.window().then((win) => {
    cy.stub(win.navigator, 'onLine').value(true)
    win.dispatchEvent(new Event('online'))
  })
})

Cypress.Commands.add('scanArticle', (code: string) => {
  cy.get('[data-testid="scan-input"]').type(code)
  cy.get('[data-testid="scan-submit"]').click()
})
```

---

# 7. Tests de performance

## 7.1 Scénarios de charge

| Scénario | Métriques | Seuil acceptable |
|----------|-----------|------------------|
| **Scan article** | Temps réponse | p95 < 1.5s |
| **Encaissement** | Temps réponse | p95 < 3s |
| **Import 500 inscriptions** | Temps total | < 30s |
| **Génération 300 étiquettes** | Temps total | < 60s |
| **50 utilisateurs simultanés** | Temps réponse | p95 < 2s |
| **200 ventes/heure** | Débit soutenu | Stable 1h |

## 7.2 Outils recommandés

| Outil | Usage |
|-------|-------|
| **k6** | Tests de charge API |
| **Lighthouse** | Performance frontend |
| **Artillery** | Scénarios complexes |

### Exemple script k6

```javascript
// tests/performance/k6-ventes.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Montée à 10 users
    { duration: '5m', target: 50 },  // Pic à 50 users
    { duration: '1m', target: 0 },   // Descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],  // 95% < 1.5s
    http_req_failed: ['rate<0.01'],     // < 1% erreurs
  },
}

export default function () {
  const token = login()

  // Simuler scan et vente
  const articleId = Math.floor(Math.random() * 1000) + 1

  const scanResponse = http.get(
    `${__ENV.API_URL}/articles/${articleId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  check(scanResponse, {
    'scan status 200': (r) => r.status === 200,
    'scan < 1.5s': (r) => r.timings.duration < 1500,
  })

  if (scanResponse.status === 200) {
    const venteResponse = http.post(
      `${__ENV.API_URL}/ventes`,
      JSON.stringify({ article_id: articleId, caisse_id: 'C1' }),
      { headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }}
    )

    check(venteResponse, {
      'vente status 201': (r) => r.status === 201,
      'vente < 3s': (r) => r.timings.duration < 3000,
    })
  }

  sleep(1)
}
```

---

# 8. Tests d'accessibilité

## 8.1 Outils

| Outil | Usage |
|-------|-------|
| **axe-core** | Audit automatisé WCAG |
| **pa11y** | CI/CD accessibility |
| **Lighthouse** | Score accessibilité |

## 8.2 Critères WCAG 2.1 AA à valider

| Critère | Test |
|---------|------|
| **1.1.1** Images alternatives | Toutes les images ont un alt |
| **1.4.3** Contraste minimum | Ratio 4.5:1 texte normal |
| **2.1.1** Clavier accessible | Navigation sans souris |
| **2.4.4** Liens explicites | Texte de lien compréhensible |
| **3.3.1** Erreurs identifiées | Messages d'erreur clairs |
| **4.1.2** Nom, rôle, valeur | ARIA correct |

### Exemple test accessibilité

```typescript
// cypress/e2e/accessibility.cy.ts
import 'cypress-axe'

describe('Accessibilité WCAG AA', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.injectAxe()
  })

  it('Page d\'accueil accessible', () => {
    cy.checkA11y(null, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    })
  })

  it('Formulaire de connexion accessible', () => {
    cy.visit('/login')
    cy.injectAxe()
    cy.checkA11y('#login-form')
  })

  it('Interface caisse accessible', () => {
    cy.loginAs('benevole')
    cy.visit('/caisse')
    cy.injectAxe()
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-access': { enabled: true }
      }
    })
  })
})
```

---

# 9. Tests de sécurité

## 9.1 Tests automatisés

| Test | Outil | Fréquence |
|------|-------|-----------|
| Dépendances vulnérables | `npm audit`, `pip-audit` | Chaque build |
| Injection SQL | Tests d'intégration | Chaque PR |
| XSS | Tests E2E | Chaque PR |
| CSRF | Tests d'intégration | Chaque PR |
| Authentification | Tests unitaires | Chaque commit |

### Exemple tests sécurité

```python
# tests/security/test_injection.py

class TestInjectionSQL:
    """Tests de protection contre l'injection SQL"""

    async def test_recherche_article_injection(self, client, auth_headers):
        """La recherche d'article est protégée contre l'injection"""
        payloads = [
            "'; DROP TABLE articles; --",
            "1 OR 1=1",
            "1; SELECT * FROM users",
            "UNION SELECT password FROM users"
        ]

        for payload in payloads:
            response = await client.get(
                f"/api/articles/search?q={payload}",
                headers=auth_headers
            )
            # Ne doit pas causer d'erreur SQL
            assert response.status_code in [200, 400]
            assert "error" not in response.json().get("detail", "").lower()


class TestXSS:
    """Tests de protection contre XSS"""

    async def test_article_description_xss(self, client, auth_headers):
        """Les descriptions d'articles sont échappées"""
        malicious_description = '<script>alert("XSS")</script>Pantalon'

        response = await client.post(
            "/api/articles",
            json={
                "liste_id": 1,
                "description": malicious_description,
                "prix": 10,
                "categorie": "vetement"
            },
            headers=auth_headers
        )

        if response.status_code == 201:
            article = response.json()
            # Le script doit être échappé ou supprimé
            assert '<script>' not in article["description"]


class TestAuthentification:
    """Tests de robustesse de l'authentification"""

    async def test_brute_force_protection(self, client):
        """Blocage après 5 tentatives échouées"""
        for i in range(6):
            response = await client.post("/api/auth/login", json={
                "email": "user@test.com",
                "password": f"wrong_password_{i}"
            })

        # 6ème tentative doit être bloquée
        assert response.status_code == 429
        assert "bloqué" in response.json()["detail"].lower()

    async def test_token_jwt_invalide(self, client):
        """Rejet des tokens JWT invalides"""
        fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature"

        response = await client.get(
            "/api/me",
            headers={"Authorization": f"Bearer {fake_token}"}
        )

        assert response.status_code == 401
```

---

# 10. Couverture et qualité

## 10.1 Objectifs de couverture

| Composant | Couverture cible | Minimum acceptable |
|-----------|------------------|-------------------|
| **Backend - Services** | 90% | 80% |
| **Backend - API** | 85% | 75% |
| **Frontend - Composants critiques** | 85% | 75% |
| **Frontend - Hooks** | 90% | 80% |
| **Global** | 80% | 70% |

## 10.2 Métriques de qualité

| Métrique | Seuil | Outil |
|----------|-------|-------|
| Couverture lignes | ≥ 80% | pytest-cov, vitest |
| Couverture branches | ≥ 75% | pytest-cov, vitest |
| Duplication code | < 5% | SonarQube |
| Dette technique | < 2j | SonarQube |
| Vulnérabilités | 0 critique, 0 haute | Snyk, npm audit |

## 10.3 Rapport de couverture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RAPPORT DE COUVERTURE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BACKEND (Python)                                                       │
│  ─────────────────────────────────────────────────────────────────────  │
│  Module                    │ Lignes │ Couvert │ Manqué │ Couverture    │
│  ─────────────────────────────────────────────────────────────────────  │
│  app/services/vente.py     │   245  │   230   │   15   │   93.9%       │
│  app/services/reversement.py│   180  │   172   │    8   │   95.6%       │
│  app/services/article.py   │   320  │   288   │   32   │   90.0%       │
│  app/api/ventes.py         │   150  │   135   │   15   │   90.0%       │
│  app/api/auth.py           │   200  │   180   │   20   │   90.0%       │
│  ─────────────────────────────────────────────────────────────────────  │
│  TOTAL BACKEND             │  1850  │  1628   │  222   │   88.0%  ✅   │
│                                                                         │
│  FRONTEND (TypeScript)                                                  │
│  ─────────────────────────────────────────────────────────────────────  │
│  Composant                 │ Lignes │ Couvert │ Manqué │ Couverture    │
│  ─────────────────────────────────────────────────────────────────────  │
│  ArticleForm.tsx           │   180  │   162   │   18   │   90.0%       │
│  ScannerView.tsx           │   250  │   225   │   25   │   90.0%       │
│  VenteConfirmation.tsx     │   120  │   114   │    6   │   95.0%       │
│  useOfflineStatus.ts       │    80  │    76   │    4   │   95.0%       │
│  useVenteQueue.ts          │   150  │   135   │   15   │   90.0%       │
│  ─────────────────────────────────────────────────────────────────────  │
│  TOTAL FRONTEND            │  1200  │  1020   │  180   │   85.0%  ✅   │
│                                                                         │
│  GLOBAL                    │  3050  │  2648   │  402   │   86.8%  ✅   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 11. Intégration continue (CI/CD)

## 11.1 Pipeline de tests

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # ─────────────────────────────────────────────
  # Tests unitaires
  # ─────────────────────────────────────────────
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          pip install -r requirements-dev.txt
          npm ci

      - name: Run backend unit tests
        run: pytest tests/unit -v --cov=app --cov-report=xml

      - name: Run frontend unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: coverage.xml,coverage/lcov.info

  # ─────────────────────────────────────────────
  # Tests d'intégration
  # ─────────────────────────────────────────────
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: bourse_test
        ports:
          - 3306:3306
    steps:
      - uses: actions/checkout@v4

      - name: Setup environment
        run: |
          pip install -r requirements-dev.txt
          npm ci

      - name: Run integration tests
        run: pytest tests/integration -v
        env:
          DATABASE_URL: mysql://root:test@localhost:3306/bourse_test

  # ─────────────────────────────────────────────
  # Tests E2E
  # ─────────────────────────────────────────────
  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v4

      - name: Setup environment
        run: |
          pip install -r requirements.txt
          npm ci

      - name: Start application
        run: |
          npm run build
          npm run start &
          python -m uvicorn app.main:app &
          npx wait-on http://localhost:3000 http://localhost:8000

      - name: Run Cypress tests
        uses: cypress-io/github-action@v6
        with:
          browser: chrome
          record: true
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: cypress-screenshots
          path: cypress/screenshots

  # ─────────────────────────────────────────────
  # Vérifications de sécurité
  # ─────────────────────────────────────────────
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run pip-audit
        run: |
          pip install pip-audit
          pip-audit -r requirements.txt

      - name: Run Snyk
        uses: snyk/actions/python@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

## 11.2 Gates de qualité

| Gate | Condition | Bloquant |
|------|-----------|----------|
| Tests unitaires | 100% passés | ✅ Oui |
| Couverture code | ≥ 80% | ✅ Oui |
| Tests intégration | 100% passés | ✅ Oui |
| Tests E2E critiques | 100% passés | ✅ Oui |
| Vulnérabilités | 0 haute/critique | ✅ Oui |
| Accessibilité | Score ≥ 90 | ⚠️ Warning |
| Performance | Lighthouse ≥ 80 | ⚠️ Warning |

---

# 12. Annexes

## 12.1 Fixtures et données de test

### Jeu de données standard

```python
# tests/fixtures/data.py

DEPOSANTS_TEST = [
    {"email": "marie@test.com", "nom": "Dupont", "prenom": "Marie"},
    {"email": "jean@test.com", "nom": "Martin", "prenom": "Jean"},
    {"email": "sophie@test.com", "nom": "Bernard", "prenom": "Sophie"},
]

ARTICLES_TEST = [
    {"description": "Pantalon bleu T8", "categorie": "vetement", "prix": 8.00},
    {"description": "T-shirt rouge T6", "categorie": "vetement", "prix": 5.00},
    {"description": "Chaussures sport P32", "categorie": "chaussures", "prix": 12.00},
    {"description": "Puzzle 100 pièces", "categorie": "jouet", "prix": 6.00},
    {"description": "Livre contes", "categorie": "livre", "prix": 3.00},
]

EDITION_TEST = {
    "nom": "Printemps 2025",
    "date_depot_debut": "2025-03-10",
    "date_depot_fin": "2025-03-14",
    "date_vente": "2025-03-15",
    "date_recuperation": "2025-03-17",
    "taux_commission": 0.20
}
```

## 12.2 Checklist avant release

```
□ TESTS
  □ Tous les tests unitaires passent
  □ Tous les tests d'intégration passent
  □ Tous les tests E2E critiques passent
  □ Couverture ≥ 80%
  □ Aucune régression détectée

□ SÉCURITÉ
  □ npm audit : 0 vulnérabilité haute/critique
  □ pip-audit : 0 vulnérabilité haute/critique
  □ Tests injection SQL passent
  □ Tests XSS passent

□ PERFORMANCE
  □ Lighthouse score ≥ 80
  □ Tests de charge passent
  □ Temps de réponse API < seuils

□ ACCESSIBILITÉ
  □ Audit axe-core : 0 erreur WCAG AA
  □ Navigation clavier fonctionnelle
  □ Contrastes vérifiés

□ DOCUMENTATION
  □ Changelog à jour
  □ Documentation API à jour
  □ Notes de version rédigées
```

## 12.3 Glossaire des tests

| Terme | Définition |
|-------|------------|
| **Fixture** | Données préparées pour les tests |
| **Mock** | Simulation d'un composant externe |
| **Stub** | Remplacement simplifié d'une fonction |
| **Coverage** | Pourcentage de code exécuté par les tests |
| **Flaky test** | Test instable (résultat non déterministe) |
| **Regression** | Bug réintroduit après correction |
| **Smoke test** | Tests rapides vérifiant les fonctions essentielles |
| **Sanity check** | Vérification de cohérence basique |
