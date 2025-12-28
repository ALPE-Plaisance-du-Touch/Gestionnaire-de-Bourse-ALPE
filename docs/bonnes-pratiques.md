---
id: DOC-120-BONNES-PRATIQUES
title: Bonnes Pratiques de Développement
status: draft
version: 0.1.0
updated: 2025-12-28
owner: ALPE Plaisance du Touch
links:
  - rel: architecture
    href: architecture.md
    title: Architecture technique
  - rel: tests
    href: tests.md
    title: Stratégie de tests
  - rel: security
    href: securite.md
    title: Sécurité et conformité
---

# 1. Vue d'ensemble

Ce document définit les **bonnes pratiques de développement** pour l'application Gestionnaire de Bourse ALPE. Ces règles visent à garantir :
- La maintenabilité du code par une équipe bénévole
- La cohérence entre les contributions
- La qualité et la sécurité du code produit

---

# 2. Langue du code

## 2.1 Règle fondamentale

> **Tout le code source doit être écrit en anglais.**

Cela inclut :
- Les noms de fichiers et dossiers
- Les noms de variables, constantes et fonctions
- Les noms de classes, interfaces et types
- Les commentaires et la documentation technique
- Les messages de commit
- Les noms de branches Git
- Les messages d'erreur techniques (logs)

## 2.2 Exceptions

Les éléments suivants peuvent rester en français :
- Les **messages affichés à l'utilisateur** (UI) — l'application est destinée à un public français
- Les **termes métier du glossaire** quand ils apparaissent dans les données ou l'UI
- Les **fichiers de spécifications** (dossier `docs/`)
- Les **fichiers de traduction** (i18n)

## 2.3 Mapping terminologique

| Terme français (métier) | Terme anglais (code) |
|-------------------------|----------------------|
| Édition | Edition |
| Bourse | SaleEvent |
| Déposant | Depositor |
| Bénévole | Volunteer |
| Gestionnaire | Manager |
| Administrateur | Administrator |
| Liste | ItemList |
| Article | Article / Item |
| Étiquette | Label / Tag |
| Vente | Sale |
| Reversement | Reimbursement / Payout |
| Créneau | TimeSlot |
| Commission | Commission |
| Invendu | UnsoldItem |

## 2.4 Exemples

### ❌ Mauvais

```python
def calculer_reversement(deposant_id, liste_articles):
    """Calcule le montant à reverser au déposant."""
    montant_brut = sum(article.prix for article in liste_articles)
    commission = montant_brut * TAUX_COMMISSION
    return montant_brut - commission
```

### ✅ Bon

```python
def calculate_payout(depositor_id: str, articles: list[Article]) -> Decimal:
    """Calculate the payout amount for a depositor."""
    gross_amount = sum(article.price for article in articles)
    commission = gross_amount * COMMISSION_RATE
    return gross_amount - commission
```

---

# 3. Conventions de nommage

## 3.1 Python (Backend)

| Élément | Convention | Exemple |
|---------|------------|---------|
| Fichiers/modules | snake_case | `sale_service.py` |
| Classes | PascalCase | `SaleService` |
| Fonctions/méthodes | snake_case | `calculate_payout()` |
| Variables | snake_case | `gross_amount` |
| Constantes | SCREAMING_SNAKE_CASE | `COMMISSION_RATE` |
| Variables privées | _snake_case | `_internal_cache` |

### Pydantic Models

```python
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from enum import Enum

class EditionStatus(str, Enum):
    DRAFT = "draft"
    CONFIGURED = "configured"
    REGISTRATIONS_OPEN = "registrations_open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"
    ARCHIVED = "archived"

class EditionCreate(BaseModel):
    name: str
    start_datetime: datetime
    end_datetime: datetime
    location: str | None = None
    description: str | None = None

class EditionResponse(BaseModel):
    id: str
    name: str
    status: EditionStatus
    commission_rate: Decimal | None
```

### SQLAlchemy Models

```python
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship

class Edition(Base):
    __tablename__ = "editions"

    id = Column(String(36), primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    status = Column(Enum(EditionStatus), default=EditionStatus.DRAFT)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)

    # Relationships
    item_lists = relationship("ItemList", back_populates="edition")
    sales = relationship("Sale", back_populates="edition")
```

## 3.2 TypeScript (Frontend)

| Élément | Convention | Exemple |
|---------|------------|---------|
| Fichiers composants | PascalCase | `SaleConfirmation.tsx` |
| Fichiers utilitaires | camelCase | `formatCurrency.ts` |
| Interfaces/Types | PascalCase | `EditionResponse` |
| Fonctions | camelCase | `calculateTotal()` |
| Variables | camelCase | `grossAmount` |
| Constantes | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| Composants React | PascalCase | `<ArticleForm />` |
| Hooks | camelCase avec préfixe use | `useOfflineStatus()` |

### Types et Interfaces

```typescript
// types/edition.ts

export type EditionStatus =
  | 'draft'
  | 'configured'
  | 'registrations_open'
  | 'in_progress'
  | 'closed'
  | 'archived';

export interface Edition {
  id: string;
  name: string;
  status: EditionStatus;
  startDatetime: Date;
  endDatetime: Date;
  commissionRate: number | null;
  depositDates: Date[] | null;
  saleDates: Date[] | null;
}

export interface CreateEditionRequest {
  name: string;
  startDatetime: string;
  endDatetime: string;
  location?: string;
  description?: string;
}
```

### Composants React

```typescript
// components/ArticleForm.tsx

interface ArticleFormProps {
  listId: string;
  onSubmit: (article: CreateArticleRequest) => void;
  onCancel: () => void;
  initialValues?: Partial<Article>;
}

export function ArticleForm({
  listId,
  onSubmit,
  onCancel,
  initialValues
}: ArticleFormProps) {
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [price, setPrice] = useState(initialValues?.price ?? 1);

  // Component logic...
}
```

## 3.3 Base de données

| Élément | Convention | Exemple |
|---------|------------|---------|
| Tables | snake_case, pluriel | `item_lists` |
| Colonnes | snake_case | `created_at` |
| Clés primaires | `id` | `id` |
| Clés étrangères | `{table}_id` | `edition_id` |
| Index | `idx_{table}_{columns}` | `idx_articles_list_id` |
| Contraintes | `{type}_{table}_{columns}` | `uk_users_email` |

### Exemple de migration Alembic

```python
# migrations/versions/001_create_editions_table.py

def upgrade():
    op.create_table(
        'editions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('status', sa.Enum('draft', 'configured', ...), nullable=False),
        sa.Column('start_datetime', sa.DateTime, nullable=False),
        sa.Column('end_datetime', sa.DateTime, nullable=False),
        sa.Column('commission_rate', sa.Numeric(5, 4), nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('created_by', sa.String(36), sa.ForeignKey('users.id')),
    )

    op.create_index('idx_editions_status', 'editions', ['status'])
    op.create_unique_constraint('uk_editions_name', 'editions', ['name'])
```

---

# 4. Structure du code

## 4.1 Backend (FastAPI)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # Point d'entrée FastAPI
│   ├── config.py                  # Configuration (Pydantic Settings)
│   ├── dependencies.py            # Dépendances FastAPI (auth, db)
│   │
│   ├── api/                       # Endpoints REST
│   │   ├── __init__.py
│   │   ├── auth.py               # /auth/*
│   │   ├── editions.py           # /editions/*
│   │   ├── item_lists.py         # /item-lists/*
│   │   ├── articles.py           # /articles/*
│   │   ├── sales.py              # /sales/*
│   │   └── payouts.py            # /payouts/*
│   │
│   ├── models/                    # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── edition.py
│   │   ├── item_list.py
│   │   ├── article.py
│   │   ├── sale.py
│   │   └── payout.py
│   │
│   ├── schemas/                   # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── edition.py
│   │   ├── item_list.py
│   │   ├── article.py
│   │   ├── sale.py
│   │   └── payout.py
│   │
│   ├── services/                  # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── edition_service.py
│   │   ├── item_list_service.py
│   │   ├── article_service.py
│   │   ├── sale_service.py
│   │   ├── payout_service.py
│   │   ├── label_service.py
│   │   └── email_service.py
│   │
│   ├── repositories/              # Data access layer
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user_repository.py
│   │   ├── edition_repository.py
│   │   └── ...
│   │
│   └── utils/                     # Helpers
│       ├── __init__.py
│       ├── security.py
│       ├── validators.py
│       └── formatters.py
│
├── migrations/                    # Alembic migrations
│   ├── versions/
│   └── env.py
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
│
├── requirements.txt
├── requirements-dev.txt
└── pytest.ini
```

## 4.2 Frontend (React + TypeScript)

```
frontend/
├── src/
│   ├── main.tsx                   # Point d'entrée
│   ├── App.tsx                    # Composant racine
│   ├── routes.tsx                 # Configuration routing
│   │
│   ├── api/                       # Client API
│   │   ├── client.ts             # Axios/fetch config
│   │   ├── auth.ts
│   │   ├── editions.ts
│   │   ├── itemLists.ts
│   │   ├── articles.ts
│   │   ├── sales.ts
│   │   └── payouts.ts
│   │
│   ├── components/                # Composants réutilisables
│   │   ├── ui/                   # Composants UI de base
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ...
│   │   ├── forms/                # Formulaires
│   │   │   ├── ArticleForm.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── ...
│   │   └── layout/               # Layout
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── ...
│   │
│   ├── features/                  # Feature modules
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ActivatePage.tsx
│   │   │   └── useAuth.ts
│   │   ├── editions/
│   │   │   ├── EditionListPage.tsx
│   │   │   ├── EditionDetailPage.tsx
│   │   │   └── useEdition.ts
│   │   ├── itemLists/
│   │   ├── sales/
│   │   └── payouts/
│   │
│   ├── hooks/                     # Hooks partagés
│   │   ├── useOfflineStatus.ts
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   │
│   ├── contexts/                  # React Contexts
│   │   ├── AuthContext.tsx
│   │   └── EditionContext.tsx
│   │
│   ├── types/                     # TypeScript types
│   │   ├── api.ts
│   │   ├── edition.ts
│   │   ├── itemList.ts
│   │   ├── article.ts
│   │   ├── sale.ts
│   │   └── payout.ts
│   │
│   ├── utils/                     # Helpers
│   │   ├── formatCurrency.ts
│   │   ├── formatDate.ts
│   │   └── validators.ts
│   │
│   ├── i18n/                      # Traductions
│   │   ├── fr.json
│   │   └── index.ts
│   │
│   └── styles/                    # Styles globaux
│       └── globals.css
│
├── public/
├── tests/
│   ├── components/
│   └── e2e/
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

# 5. Patterns architecturaux

## 5.1 Backend : Architecture en couches

```
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                           │
│                    (FastAPI Routers)                        │
│   Responsabilités: Validation entrée, sérialisation,        │
│                    gestion erreurs HTTP, auth               │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                      Service Layer                          │
│                   (Business Logic)                          │
│   Responsabilités: Règles métier, orchestration,            │
│                    transactions, validations complexes       │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    Repository Layer                         │
│                    (Data Access)                            │
│   Responsabilités: Requêtes DB, mappings,                   │
│                    abstraire l'ORM                          │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                      Model Layer                            │
│                  (SQLAlchemy Models)                        │
│   Responsabilités: Schéma DB, relations                     │
└─────────────────────────────────────────────────────────────┘
```

### Exemple d'implémentation

```python
# api/sales.py (API Layer)
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.sale import SaleCreate, SaleResponse
from app.services.sale_service import SaleService
from app.dependencies import get_current_user, get_sale_service

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(
    sale_data: SaleCreate,
    current_user: User = Depends(get_current_user),
    sale_service: SaleService = Depends(get_sale_service)
):
    """Record a new sale for an article."""
    try:
        sale = await sale_service.create_sale(
            article_id=sale_data.article_id,
            register_id=sale_data.register_id,
            seller_id=current_user.id
        )
        return sale
    except ArticleAlreadySoldError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
```

```python
# services/sale_service.py (Service Layer)
from decimal import Decimal
from datetime import datetime
from app.repositories.sale_repository import SaleRepository
from app.repositories.article_repository import ArticleRepository
from app.exceptions import ArticleAlreadySoldError, ArticleNotFoundError

class SaleService:
    def __init__(
        self,
        sale_repo: SaleRepository,
        article_repo: ArticleRepository
    ):
        self.sale_repo = sale_repo
        self.article_repo = article_repo

    async def create_sale(
        self,
        article_id: str,
        register_id: str,
        seller_id: str
    ) -> Sale:
        """Create a new sale with business validations."""
        # 1. Retrieve article
        article = await self.article_repo.get_by_id(article_id)
        if not article:
            raise ArticleNotFoundError(f"Article {article_id} not found")

        # 2. Check article status
        if article.status != ArticleStatus.ON_SALE:
            raise ArticleAlreadySoldError(
                f"Article {article_id} is not available for sale"
            )

        # 3. Create sale in transaction
        async with self.sale_repo.transaction():
            sale = await self.sale_repo.create(
                article_id=article_id,
                price=article.price,
                register_id=register_id,
                seller_id=seller_id,
                sold_at=datetime.utcnow()
            )

            await self.article_repo.update_status(
                article_id,
                ArticleStatus.SOLD
            )

        return sale
```

```python
# repositories/sale_repository.py (Repository Layer)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.sale import Sale
from app.repositories.base import BaseRepository

class SaleRepository(BaseRepository[Sale]):
    def __init__(self, session: AsyncSession):
        super().__init__(Sale, session)

    async def get_by_edition(self, edition_id: str) -> list[Sale]:
        """Get all sales for an edition."""
        query = (
            select(Sale)
            .where(Sale.edition_id == edition_id)
            .order_by(Sale.sold_at.desc())
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_sales_summary(self, edition_id: str) -> dict:
        """Get aggregated sales data for an edition."""
        query = """
            SELECT
                COUNT(*) as total_sales,
                SUM(price) as total_amount,
                payment_method,
                COUNT(*) as count_by_method
            FROM sales
            WHERE edition_id = :edition_id
            GROUP BY payment_method
        """
        # ...
```

## 5.2 Frontend : Feature-based structure

Chaque feature est autonome et contient :
- Pages (composants de page)
- Hooks (logique métier)
- Composants spécifiques à la feature

```typescript
// features/sales/useSale.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '@/api/sales';
import { Sale, CreateSaleRequest } from '@/types/sale';

export function useSales(editionId: string) {
  return useQuery({
    queryKey: ['sales', editionId],
    queryFn: () => salesApi.getByEdition(editionId),
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSaleRequest) => salesApi.create(data),
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ['sales', sale.editionId] });
      queryClient.invalidateQueries({ queryKey: ['articles', sale.articleId] });
    },
  });
}

export function useScanArticle() {
  return useMutation({
    mutationFn: (code: string) => salesApi.scanArticle(code),
  });
}
```

---

# 6. Gestion des erreurs

## 6.1 Backend

### Exceptions personnalisées

```python
# exceptions.py
class AppException(Exception):
    """Base exception for the application."""
    def __init__(self, message: str, code: str = "UNKNOWN_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)

class NotFoundError(AppException):
    """Resource not found."""
    def __init__(self, message: str):
        super().__init__(message, "NOT_FOUND")

class ValidationError(AppException):
    """Business validation failed."""
    def __init__(self, message: str, field: str | None = None):
        self.field = field
        super().__init__(message, "VALIDATION_ERROR")

class ArticleAlreadySoldError(AppException):
    """Article has already been sold."""
    def __init__(self, message: str):
        super().__init__(message, "ARTICLE_ALREADY_SOLD")

class EditionClosedError(AppException):
    """Edition is closed and cannot be modified."""
    def __init__(self, edition_id: str):
        super().__init__(
            f"Edition {edition_id} is closed",
            "EDITION_CLOSED"
        )
```

### Exception handlers

```python
# main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.exceptions import AppException, NotFoundError, ValidationError

app = FastAPI()

@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(
        status_code=404,
        content={"code": exc.code, "message": exc.message}
    )

@app.exception_handler(ValidationError)
async def validation_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "code": exc.code,
            "message": exc.message,
            "field": exc.field
        }
    )

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=400,
        content={"code": exc.code, "message": exc.message}
    )
```

## 6.2 Frontend

### Error Boundary

```typescript
// components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="error-page">
          <h1>Une erreur est survenue</h1>
          <p>Veuillez rafraîchir la page ou réessayer plus tard.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API Error handling

```typescript
// api/client.ts
import axios, { AxiosError } from 'axios';

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export class ApiException extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public field?: string
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      const { data, status } = error.response;
      throw new ApiException(
        data.code,
        data.message,
        status,
        data.field
      );
    }
    throw error;
  }
);

export default apiClient;
```

---

# 7. Commentaires et documentation

## 7.1 Quand commenter

| Commenter | Ne pas commenter |
|-----------|------------------|
| Logique métier complexe | Code évident |
| Décisions non triviales (avec le "pourquoi") | Ce que fait le code (le "quoi") |
| Workarounds temporaires avec ticket | Getter/setter simples |
| Algorithmes spécifiques | Imports |
| Formats de données externes | Code auto-documenté |

## 7.2 Format des commentaires

### Python (Docstrings Google style)

```python
def calculate_payout(
    sales: list[Sale],
    list_type: ListType,
    commission_rate: Decimal
) -> PayoutResult:
    """Calculate the payout for a depositor based on their sales.

    Applies the ALPE payout rules:
    - 20% commission on gross sales
    - List fees depending on list type (1000, 2000, standard)

    Args:
        sales: List of completed sales for the depositor.
        list_type: Type of list (STANDARD, LIST_1000, LIST_2000).
        commission_rate: Commission rate as decimal (0.20 for 20%).

    Returns:
        PayoutResult containing gross amount, commission, fees, and net amount.

    Raises:
        ValueError: If commission_rate is not between 0 and 1.

    Example:
        >>> sales = [Sale(price=Decimal("10.00")), Sale(price=Decimal("15.00"))]
        >>> result = calculate_payout(sales, ListType.STANDARD, Decimal("0.20"))
        >>> result.net_amount
        Decimal("20.00")
    """
```

### TypeScript (JSDoc)

```typescript
/**
 * Format a price in euros for display.
 *
 * @param amount - The amount in cents or as a Decimal string
 * @param options - Formatting options
 * @returns Formatted price string (e.g., "12,50 €")
 *
 * @example
 * formatCurrency(1250) // "12,50 €"
 * formatCurrency("12.50") // "12,50 €"
 */
export function formatCurrency(
  amount: number | string,
  options?: FormatOptions
): string {
  // Implementation
}
```

## 7.3 TODO et FIXME

```python
# TODO(#123): Implement batch label generation
# This is currently generating one by one, causing performance issues
# for large editions (>500 lists).

# FIXME: Race condition when two registers sell the same article
# simultaneously. Need to implement optimistic locking.
# See: https://github.com/alpe/bourse/issues/45
```

---

# 8. Git et versioning

## 8.1 Branches

| Branche | Usage |
|---------|-------|
| `main` | Production stable |
| `develop` | Intégration continue |
| `feature/{ticket}-{description}` | Nouvelles fonctionnalités |
| `fix/{ticket}-{description}` | Corrections de bugs |
| `hotfix/{ticket}-{description}` | Corrections urgentes prod |

### Exemples

```
feature/US-003-article-declaration
fix/BUG-042-price-validation
hotfix/SEC-01-xss-vulnerability
```

## 8.2 Commits (Conventional Commits)

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation |
| `style` | Formatage (pas de changement de logique) |
| `refactor` | Refactoring sans changement fonctionnel |
| `test` | Ajout/modification de tests |
| `chore` | Maintenance (deps, config) |
| `perf` | Amélioration de performance |

### Exemples

```
feat(sales): add offline sale sync mechanism

Implement IndexedDB storage for offline sales and background
sync when connection is restored.

Closes #45
```

```
fix(payout): correct commission calculation for list 1000

The 1€ fee was being applied per article instead of per list.

Fixes #123
```

## 8.3 Pull Requests

### Template

```markdown
## Description

Brief description of the changes.

## Type of change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)

## Related tickets

- Closes #123
- Related to #456

## Checklist

- [ ] Code follows project conventions
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No new warnings or errors
```

---

# 9. Sécurité du code

## 9.1 Règles générales

| Pratique | Description |
|----------|-------------|
| **Never trust user input** | Valider toutes les entrées |
| **Parameterized queries** | Utiliser l'ORM, jamais de SQL brut avec concaténation |
| **Escape output** | React échappe par défaut, attention aux dangerouslySetInnerHTML |
| **Secrets in env** | Variables d'environnement uniquement, jamais dans le code |
| **Least privilege** | Permissions minimales requises |
| **Fail securely** | En cas d'erreur, refuser l'accès |

## 9.2 Validation des entrées

### Backend

```python
from pydantic import BaseModel, Field, validator
from decimal import Decimal

class ArticleCreate(BaseModel):
    description: str = Field(..., min_length=3, max_length=100)
    price: Decimal = Field(..., ge=Decimal("1.00"), le=Decimal("150.00"))
    category: str

    @validator("description")
    def sanitize_description(cls, v: str) -> str:
        # Remove potential script tags
        return bleach.clean(v, tags=[], strip=True)

    @validator("category")
    def validate_category(cls, v: str) -> str:
        allowed = {"clothing", "shoes", "toys", "books", "nursery"}
        if v not in allowed:
            raise ValueError(f"Category must be one of: {allowed}")
        return v
```

### Frontend

```typescript
import { z } from 'zod';

const articleSchema = z.object({
  description: z.string()
    .min(3, "Description trop courte (min 3 caractères)")
    .max(100, "Description trop longue (max 100 caractères)"),
  price: z.number()
    .min(1, "Prix minimum : 1€")
    .max(150, "Prix maximum : 150€"),
  category: z.enum(["clothing", "shoes", "toys", "books", "nursery"]),
});

type ArticleFormData = z.infer<typeof articleSchema>;
```

## 9.3 Gestion des secrets

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str

    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15

    # Email
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
```

```
# .env.example (committed)
DATABASE_URL=mysql://user:password@localhost/bourse_dev
JWT_SECRET_KEY=your-secret-key-here
SMTP_HOST=smtp.example.com

# .env (NOT committed - in .gitignore)
DATABASE_URL=mysql://prod_user:S3cur3P@ss@prod-db/bourse
JWT_SECRET_KEY=actual-production-secret-key-256-bits
```

---

# 10. Performance

## 10.1 Backend

### Requêtes N+1

```python
# ❌ Mauvais - N+1 queries
async def get_lists_with_articles(edition_id: str):
    lists = await session.execute(
        select(ItemList).where(ItemList.edition_id == edition_id)
    )
    for lst in lists:
        # Query for each list!
        articles = await session.execute(
            select(Article).where(Article.list_id == lst.id)
        )

# ✅ Bon - Eager loading
async def get_lists_with_articles(edition_id: str):
    query = (
        select(ItemList)
        .options(selectinload(ItemList.articles))
        .where(ItemList.edition_id == edition_id)
    )
    result = await session.execute(query)
    return result.scalars().all()
```

### Pagination

```python
from fastapi import Query

@router.get("/articles")
async def list_articles(
    edition_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    offset = (page - 1) * page_size

    query = (
        select(Article)
        .where(Article.edition_id == edition_id)
        .offset(offset)
        .limit(page_size)
    )

    # Also get total count for pagination info
    count_query = (
        select(func.count())
        .where(Article.edition_id == edition_id)
    )

    # Return with pagination metadata
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size)
    }
```

## 10.2 Frontend

### React.memo et useMemo

```typescript
// Only re-render when props change
const ArticleRow = React.memo(function ArticleRow({
  article,
  onEdit,
  onDelete
}: ArticleRowProps) {
  return (
    <tr>
      <td>{article.description}</td>
      <td>{formatCurrency(article.price)}</td>
      <td>
        <button onClick={() => onEdit(article.id)}>Modifier</button>
        <button onClick={() => onDelete(article.id)}>Supprimer</button>
      </td>
    </tr>
  );
});

// Memoize expensive calculations
function PayoutSummary({ sales }: { sales: Sale[] }) {
  const totals = useMemo(() => {
    return {
      gross: sales.reduce((sum, s) => sum + s.price, 0),
      count: sales.length,
      byCategory: groupBy(sales, 'category'),
    };
  }, [sales]);

  return <div>...</div>;
}
```

### Lazy loading

```typescript
// routes.tsx
import { lazy, Suspense } from 'react';

const EditionDetailPage = lazy(() => import('./features/editions/EditionDetailPage'));
const PayoutPage = lazy(() => import('./features/payouts/PayoutPage'));

function Routes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        <Route path="/editions/:id" component={EditionDetailPage} />
        <Route path="/payouts" component={PayoutPage} />
      </Switch>
    </Suspense>
  );
}
```

---

# 11. Accessibilité (a11y)

## 11.1 Règles de base

| Règle | Application |
|-------|-------------|
| Labels explicites | Tous les inputs ont un label associé |
| Alt text | Toutes les images significatives |
| Contraste | Ratio minimum 4.5:1 pour le texte |
| Focus visible | Outline visible au clavier |
| Skip links | Lien "Aller au contenu" |
| ARIA | Roles et états pour composants custom |

## 11.2 Exemple de formulaire accessible

```tsx
function ArticleForm() {
  return (
    <form aria-labelledby="form-title">
      <h2 id="form-title">Ajouter un article</h2>

      <div className="form-group">
        <label htmlFor="description">
          Description <span aria-hidden="true">*</span>
          <span className="sr-only">(obligatoire)</span>
        </label>
        <input
          id="description"
          type="text"
          aria-required="true"
          aria-describedby="description-hint description-error"
        />
        <p id="description-hint" className="hint">
          Ex: "Pantalon bleu taille 8 ans"
        </p>
        {error && (
          <p id="description-error" className="error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="price">
          Prix (€) <span aria-hidden="true">*</span>
        </label>
        <input
          id="price"
          type="number"
          min="1"
          max="150"
          step="0.5"
          aria-required="true"
        />
      </div>

      <button type="submit">
        Ajouter l'article
      </button>
    </form>
  );
}
```

---

# 12. Checklist de review

## Code Review Checklist

### Général
- [ ] Le code est en anglais (variables, fonctions, commentaires)
- [ ] Le code suit les conventions de nommage
- [ ] Pas de code commenté ou de console.log
- [ ] Pas de secrets en dur

### Qualité
- [ ] Le code est lisible et bien structuré
- [ ] Les fonctions ont une seule responsabilité
- [ ] Pas de duplication de code
- [ ] Les erreurs sont gérées correctement

### Sécurité
- [ ] Les entrées utilisateur sont validées
- [ ] Pas d'injection possible (SQL, XSS)
- [ ] Les permissions sont vérifiées

### Performance
- [ ] Pas de requêtes N+1
- [ ] Les données sont paginées si nombreuses
- [ ] Les calculs lourds sont memoizés

### Tests
- [ ] Les nouveaux cas sont testés
- [ ] Les tests existants passent
- [ ] La couverture est maintenue

### Documentation
- [ ] Les fonctions complexes sont documentées
- [ ] Les décisions non triviales sont expliquées
- [ ] Le CHANGELOG est mis à jour

---

# 13. Références

- [PEP 8 - Python Style Guide](https://peps.python.org/pep-0008/)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [FastAPI Best Practices](https://fastapi.tiangolo.com/tutorial/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Conventional Commits](https://www.conventionalcommits.org/)
