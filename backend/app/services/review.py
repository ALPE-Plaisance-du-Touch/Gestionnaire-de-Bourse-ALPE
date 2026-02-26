"""Review service for deposit article verification (US-013)."""

from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import (
    ArticleNotFoundError,
    EditionNotFoundError,
    ValidationError,
)
from app.models import Article, ItemList, User
from app.models.article import ArticleStatus
from app.models.edition import EditionStatus
from app.models.item_list import ListStatus
from app.repositories import ArticleRepository, EditionRepository, ItemListRepository
from app.schemas.article import ArticleUpdate
from app.services.article import ArticleService


class ReviewService:
    """Service for deposit review business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.article_repo = ArticleRepository(db)
        self.list_repo = ItemListRepository(db)
        self.edition_repo = EditionRepository(db)
        self.article_service = ArticleService(db)

    async def get_review_lists(
        self,
        edition_id: str,
        *,
        review_status: str | None = None,
    ) -> list[dict]:
        """Get all lists for an edition with review statistics.

        Args:
            edition_id: Edition ID
            review_status: Filter by review state (pending, in_progress, reviewed)

        Returns:
            List of dicts with list info and review stats
        """
        edition = await self.edition_repo.get_by_id(edition_id)
        if not edition:
            raise EditionNotFoundError(edition_id)

        lists = await self.list_repo.list_by_edition_with_articles(edition_id)

        result = []
        for item_list in lists:
            # Only include validated/checked_in/reviewed lists (not draft or not_finalized)
            if item_list.status in (ListStatus.DRAFT.value, ListStatus.NOT_FINALIZED.value):
                continue

            stats = self._compute_review_stats(item_list.articles)
            list_review_status = self._get_list_review_status(item_list, stats)

            if review_status and list_review_status != review_status:
                continue

            depositor = item_list.depositor
            depositor_name = (
                f"{depositor.first_name} {depositor.last_name}"
                if depositor
                else "Inconnu"
            )

            result.append({
                "id": item_list.id,
                "number": item_list.number,
                "list_type": item_list.list_type,
                "status": item_list.status,
                "depositor_name": depositor_name,
                "article_count": len(item_list.articles),
                "review_stats": stats,
                "review_status": list_review_status,
                "reviewed_at": item_list.reviewed_at,
                "reviewed_by_name": (
                    f"{item_list.reviewed_by.first_name} {item_list.reviewed_by.last_name}"
                    if item_list.reviewed_by
                    else None
                ),
            })

        return result

    async def get_review_list_detail(
        self,
        edition_id: str,
        list_id: str,
    ) -> dict:
        """Get a list with all its articles for review.

        Args:
            edition_id: Edition ID
            list_id: List ID

        Returns:
            Dict with list info and articles
        """
        item_list = await self.list_repo.get_by_id(list_id, load_articles=True)
        if not item_list or item_list.edition_id != edition_id:
            raise ValidationError("Liste non trouvée", field="list_id")

        articles = await self.article_repo.get_by_list_id(list_id)
        stats = self._compute_review_stats(articles)

        depositor = item_list.depositor
        depositor_name = (
            f"{depositor.first_name} {depositor.last_name}"
            if depositor
            else "Inconnu"
        )

        return {
            "id": item_list.id,
            "number": item_list.number,
            "list_type": item_list.list_type,
            "status": item_list.status,
            "depositor_id": item_list.depositor_id,
            "depositor_name": depositor_name,
            "article_count": len(articles),
            "articles": articles,
            "review_stats": stats,
            "reviewed_at": item_list.reviewed_at,
        }

    async def accept_article(
        self,
        article_id: str,
        user: User,
    ) -> Article:
        """Accept an article during review.

        Args:
            article_id: Article ID
            user: Volunteer performing the review

        Returns:
            Updated article
        """
        article = await self._get_reviewable_article(article_id)

        article.status = ArticleStatus.ACCEPTED.value
        article.reviewed_at = datetime.utcnow()
        article.reviewed_by_user_id = user.id

        await self.db.commit()
        await self.db.refresh(article)
        return article

    async def reject_article(
        self,
        article_id: str,
        user: User,
        rejection_reason: str | None = None,
    ) -> Article:
        """Reject an article during review.

        Args:
            article_id: Article ID
            user: Volunteer performing the review
            rejection_reason: Optional reason for rejection (max 200 chars)

        Returns:
            Updated article
        """
        article = await self._get_reviewable_article(article_id)

        article.status = ArticleStatus.REJECTED.value
        article.rejection_reason = rejection_reason
        article.rejected_at = datetime.utcnow()
        article.rejected_by_user_id = user.id
        article.reviewed_at = datetime.utcnow()
        article.reviewed_by_user_id = user.id

        await self.db.commit()
        await self.db.refresh(article)
        return article

    async def edit_article_in_review(
        self,
        article_id: str,
        data: ArticleUpdate,
        user: User,
    ) -> Article:
        """Edit an article during review (same validations as declaration).

        Args:
            article_id: Article ID
            data: Update data
            user: Volunteer performing the edit

        Returns:
            Updated article
        """
        article = await self._get_reviewable_article(article_id)

        # Apply the same validation logic as regular article update
        new_category = data.category.value if data.category else article.category
        new_subcategory = (
            data.subcategory
            if "subcategory" in data.model_fields_set
            else article.subcategory
        )

        if data.price is not None:
            self.article_service._validate_price(
                data.price, new_category, new_subcategory
            )

        is_lot = data.is_lot if data.is_lot is not None else article.is_lot
        lot_qty = (
            data.lot_quantity if data.lot_quantity is not None else article.lot_quantity
        )
        size = data.size if data.size is not None else article.size
        if is_lot and lot_qty:
            self.article_service._validate_lot(lot_qty, size, new_subcategory)

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        if "gender" in update_data and update_data["gender"] is not None:
            update_data["gender"] = update_data["gender"].value
        if "category" in update_data and update_data["category"] is not None:
            update_data["category"] = update_data["category"].value

        article = await self.article_repo.update(article, **update_data)

        return article

    async def finalize_review(
        self,
        list_id: str,
        user: User,
    ) -> ItemList:
        """Finalize the review of a list.

        All articles must be accepted or rejected (none in 'validated' state).

        Args:
            list_id: List ID
            user: Volunteer finalizing the review

        Returns:
            Updated list
        """
        item_list = await self.list_repo.get_by_id(list_id, load_articles=True)
        if not item_list:
            raise ValidationError("Liste non trouvée", field="list_id")

        # Check edition is in deposit status
        edition = await self.edition_repo.get_by_id(item_list.edition_id)
        if not edition or edition.status != EditionStatus.DEPOSIT.value:
            raise ValidationError(
                "La revue n'est possible que lorsque l'édition est en statut dépôt",
                field="status",
            )

        # Check all articles are reviewed
        articles = await self.article_repo.get_by_list_id(list_id)
        pending = [
            a for a in articles if a.status == ArticleStatus.VALIDATED.value
        ]
        if pending:
            raise ValidationError(
                f"{len(pending)} article(s) n'ont pas encore été traité(s)",
                field="articles",
            )

        item_list.status = ListStatus.REVIEWED.value
        item_list.reviewed_at = datetime.utcnow()
        item_list.reviewed_by_user_id = user.id

        await self.db.commit()
        await self.db.refresh(item_list)
        return item_list

    async def get_review_summary(self, edition_id: str) -> dict:
        """Get review progress summary for an edition.

        Args:
            edition_id: Edition ID

        Returns:
            Dict with review progress statistics
        """
        edition = await self.edition_repo.get_by_id(edition_id)
        if not edition:
            raise EditionNotFoundError(edition_id)

        lists = await self.list_repo.list_by_edition_with_articles(edition_id)

        # Only count lists that have been validated (not draft)
        eligible_lists = [
            l for l in lists if l.status != ListStatus.DRAFT.value
        ]

        total_lists = len(eligible_lists)
        reviewed_lists = sum(
            1 for l in eligible_lists
            if l.status == ListStatus.REVIEWED.value
        )

        total_articles = 0
        accepted = 0
        rejected = 0
        pending = 0

        for item_list in eligible_lists:
            for article in item_list.articles:
                total_articles += 1
                if article.status == ArticleStatus.ACCEPTED.value:
                    accepted += 1
                elif article.status == ArticleStatus.REJECTED.value:
                    rejected += 1
                elif article.status == ArticleStatus.VALIDATED.value:
                    pending += 1

        return {
            "total_lists": total_lists,
            "reviewed_lists": reviewed_lists,
            "pending_lists": total_lists - reviewed_lists,
            "total_articles": total_articles,
            "accepted_articles": accepted,
            "rejected_articles": rejected,
            "pending_articles": pending,
        }

    async def _get_reviewable_article(self, article_id: str) -> Article:
        """Get an article and validate it can be reviewed.

        Checks:
        - Article exists
        - Article is in 'validated' status
        - Edition is in 'deposit' status
        """
        article = await self.article_repo.get_by_id(article_id)
        if not article:
            raise ArticleNotFoundError(article_id)

        if article.status != ArticleStatus.VALIDATED.value:
            raise ValidationError(
                "Seuls les articles en statut 'validé' peuvent être traités lors de la revue",
                field="status",
            )

        # Check edition status
        item_list = article.item_list
        edition = await self.edition_repo.get_by_id(item_list.edition_id)
        if not edition or edition.status != EditionStatus.DEPOSIT.value:
            raise ValidationError(
                "La revue n'est possible que lorsque l'édition est en statut dépôt",
                field="status",
            )

        return article

    @staticmethod
    def _compute_review_stats(articles: list[Article]) -> dict:
        """Compute review statistics for a list of articles."""
        pending = 0
        accepted = 0
        rejected = 0

        for article in articles:
            if article.status == ArticleStatus.ACCEPTED.value:
                accepted += 1
            elif article.status == ArticleStatus.REJECTED.value:
                rejected += 1
            elif article.status == ArticleStatus.VALIDATED.value:
                pending += 1

        return {
            "pending": pending,
            "accepted": accepted,
            "rejected": rejected,
        }

    @staticmethod
    def _get_list_review_status(item_list: ItemList, stats: dict) -> str:
        """Determine the review status of a list.

        Returns: 'reviewed', 'in_progress', or 'pending'
        """
        if item_list.status == ListStatus.REVIEWED.value:
            return "reviewed"
        if stats["accepted"] > 0 or stats["rejected"] > 0:
            return "in_progress"
        return "pending"
