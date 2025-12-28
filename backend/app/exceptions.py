"""Custom application exceptions."""


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


class AuthenticationError(AppException):
    """Authentication failed."""

    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(message, "AUTHENTICATION_ERROR")


class AuthorizationError(AppException):
    """Authorization failed (insufficient permissions)."""

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, "AUTHORIZATION_ERROR")


class ArticleAlreadySoldError(AppException):
    """Article has already been sold."""

    def __init__(self, article_id: str):
        super().__init__(
            f"Article {article_id} has already been sold",
            "ARTICLE_ALREADY_SOLD",
        )


class ArticleNotFoundError(NotFoundError):
    """Article not found."""

    def __init__(self, article_id: str):
        super().__init__(f"Article {article_id} not found")


class EditionNotFoundError(NotFoundError):
    """Edition not found."""

    def __init__(self, edition_id: str):
        super().__init__(f"Edition {edition_id} not found")


class EditionClosedError(AppException):
    """Edition is closed and cannot be modified."""

    def __init__(self, edition_id: str):
        super().__init__(
            f"Edition {edition_id} is closed",
            "EDITION_CLOSED",
        )


class DeclarationDeadlinePassedError(AppException):
    """Declaration deadline has passed."""

    def __init__(self, edition_id: str):
        super().__init__(
            f"Declaration deadline for edition {edition_id} has passed",
            "DECLARATION_DEADLINE_PASSED",
        )


class MaxArticlesExceededError(ValidationError):
    """Maximum number of articles exceeded."""

    def __init__(self, max_articles: int):
        super().__init__(
            f"Maximum of {max_articles} articles per list exceeded",
            field="articles",
        )


class MaxClothingExceededError(ValidationError):
    """Maximum number of clothing articles exceeded."""

    def __init__(self, max_clothing: int):
        super().__init__(
            f"Maximum of {max_clothing} clothing articles exceeded",
            field="category",
        )


class InvalidPriceError(ValidationError):
    """Price is invalid (too low or too high)."""

    def __init__(self, price: str, min_price: str, max_price: str):
        super().__init__(
            f"Price {price}€ must be between {min_price}€ and {max_price}€",
            field="price",
        )


class TokenExpiredError(AuthenticationError):
    """Token has expired."""

    def __init__(self):
        super().__init__("Token has expired")
        self.code = "TOKEN_EXPIRED"


class TokenInvalidError(AuthenticationError):
    """Token is invalid."""

    def __init__(self):
        super().__init__("Invalid token")
        self.code = "TOKEN_INVALID"
