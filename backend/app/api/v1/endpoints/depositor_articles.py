"""Depositor articles API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import CurrentActiveUser, DBSession
from app.exceptions import (
    ArticleNotFoundError,
    DeclarationDeadlinePassedError,
    InvalidPriceError,
    MaxArticlesExceededError,
    MaxClothingExceededError,
    ValidationError,
)
from app.schemas import (
    ArticleCreate,
    ArticleListResponse,
    ArticleResponse,
    ArticleUpdate,
)
from app.services import ArticleService
from app.services.article import (
    BlacklistedCategoryError,
    CategoryLimitExceededError,
    InvalidLotError,
)
from app.services.item_list import (
    ItemListNotFoundError,
    ListNotDraftError,
)

router = APIRouter()


def get_article_service(db: DBSession) -> ArticleService:
    """Get ArticleService instance."""
    return ArticleService(db)


ArticleServiceDep = Annotated[ArticleService, Depends(get_article_service)]


@router.get(
    "/lists/{list_id}/articles",
    response_model=ArticleListResponse,
    summary="Get articles for a list",
    description="Get all articles in a list, ordered by category.",
)
async def get_list_articles(
    list_id: str,
    article_service: ArticleServiceDep,
    current_user: CurrentActiveUser,
):
    """Get all articles for a list."""
    try:
        # Get summary with ownership verification
        summary = await article_service.get_list_article_summary(
            list_id, depositor_id=current_user.id
        )

        return ArticleListResponse(
            items=[ArticleResponse.model_validate(a) for a in summary["articles"]],
            total=summary["total"],
            clothing_count=summary["clothing_count"],
            category_counts=summary["category_counts"],
        )
    except ItemListNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Liste {list_id} non trouvée",
        )


@router.post(
    "/lists/{list_id}/articles",
    response_model=ArticleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add article to list",
    description="Add a new article to a list.",
)
async def add_article(
    list_id: str,
    request: ArticleCreate,
    article_service: ArticleServiceDep,
    current_user: CurrentActiveUser,
):
    """Add a new article to a list."""
    try:
        article = await article_service.add_article(
            list_id=list_id,
            depositor=current_user,
            data=request,
        )
        return ArticleResponse.model_validate(article)
    except ItemListNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Liste {list_id} non trouvée",
        )
    except DeclarationDeadlinePassedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La date limite de déclaration est dépassée",
        )
    except ListNotDraftError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette liste ne peut plus être modifiée",
        )
    except MaxArticlesExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )
    except MaxClothingExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )
    except CategoryLimitExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )
    except BlacklistedCategoryError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )
    except InvalidPriceError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )
    except InvalidLotError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )


@router.put(
    "/lists/{list_id}/articles/{article_id}",
    response_model=ArticleResponse,
    summary="Update article",
    description="Update an article in a list.",
)
async def update_article(
    list_id: str,
    article_id: str,
    request: ArticleUpdate,
    article_service: ArticleServiceDep,
    current_user: CurrentActiveUser,
):
    """Update an existing article."""
    try:
        article = await article_service.update_article(
            list_id=list_id,
            article_id=article_id,
            depositor=current_user,
            data=request,
        )
        return ArticleResponse.model_validate(article)
    except ItemListNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Liste {list_id} non trouvée",
        )
    except ArticleNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé",
        )
    except DeclarationDeadlinePassedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La date limite de déclaration est dépassée",
        )
    except ListNotDraftError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette liste ne peut plus être modifiée",
        )
    except InvalidPriceError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )
    except InvalidLotError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )


@router.delete(
    "/lists/{list_id}/articles/{article_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete article",
    description="Delete an article from a list.",
)
async def delete_article(
    list_id: str,
    article_id: str,
    article_service: ArticleServiceDep,
    current_user: CurrentActiveUser,
):
    """Delete an article from a list."""
    try:
        await article_service.delete_article(
            list_id=list_id,
            article_id=article_id,
            depositor=current_user,
        )
    except ItemListNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Liste {list_id} non trouvée",
        )
    except ArticleNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé",
        )
    except DeclarationDeadlinePassedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La date limite de déclaration est dépassée",
        )
    except ListNotDraftError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette liste ne peut plus être modifiée",
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )
