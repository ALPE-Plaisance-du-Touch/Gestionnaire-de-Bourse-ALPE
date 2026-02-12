"""Unit tests for label generation service."""

import pytest
from decimal import Decimal
from unittest.mock import MagicMock

from app.models import Edition, ItemList, User
from app.models.article import Article
from app.services.label import (
    generate_label_code,
    generate_qr_code,
    get_label_color_hex,
    format_price,
    generate_labels_pdf,
    LABEL_COLOR_HEX,
)


def _make_article(line_number: int, **kwargs) -> MagicMock:
    """Create a mock article."""
    article = MagicMock(spec=Article)
    article.line_number = line_number
    article.description = kwargs.get("description", f"Article test {line_number}")
    article.category = kwargs.get("category", "clothing")
    article.subcategory = kwargs.get("subcategory", None)
    article.size = kwargs.get("size", "4 ans")
    article.brand = kwargs.get("brand", None)
    article.price = kwargs.get("price", Decimal("5.00"))
    article.is_lot = kwargs.get("is_lot", False)
    article.lot_quantity = kwargs.get("lot_quantity", None)
    article.is_clothing = kwargs.get("is_clothing", True)
    article.barcode = kwargs.get("barcode", f"012{line_number:02d}")
    return article


def _make_item_list(number: int, depositor: MagicMock, edition: MagicMock, articles: list) -> MagicMock:
    """Create a mock item list."""
    item_list = MagicMock(spec=ItemList)
    item_list.id = f"list-{number}"
    item_list.number = number
    item_list.list_type = "standard"
    item_list.label_color = "sky_blue"
    item_list.status = "validated"
    item_list.is_validated = True
    item_list.depositor_id = depositor.id
    item_list.depositor = depositor
    item_list.edition_id = edition.id
    item_list.edition = edition
    item_list.articles = articles
    item_list.labels_printed = False
    return item_list


@pytest.fixture
def mock_depositor():
    user = MagicMock(spec=User)
    user.id = "user-abc123"
    user.first_name = "Marie"
    user.last_name = "Dupont"
    user.email = "marie@example.com"
    return user


@pytest.fixture
def mock_edition():
    edition = MagicMock(spec=Edition)
    edition.id = "edition-12345678-abcd"
    edition.name = "Bourse Printemps 2025"
    edition.status = "registrations_open"
    return edition


class TestGenerateLabelCode:
    def test_format(self):
        code = generate_label_code("abcdef12-3456-7890", 245, 3)
        assert code == "EDI-abcdef12-L245-A03"

    def test_double_digit_line(self):
        code = generate_label_code("abcdef12-3456-7890", 100, 15)
        assert code == "EDI-abcdef12-L100-A15"

    def test_single_digit_line_padded(self):
        code = generate_label_code("abcdef12-3456-7890", 100, 1)
        assert code == "EDI-abcdef12-L100-A01"


class TestGenerateQrCode:
    def test_returns_base64_string(self):
        result = generate_qr_code("EDI-abcdef12-L245-A03")
        assert isinstance(result, str)
        assert len(result) > 100  # Base64 PNG should be substantial

    def test_different_codes_different_qr(self):
        qr1 = generate_qr_code("EDI-abcdef12-L245-A01")
        qr2 = generate_qr_code("EDI-abcdef12-L245-A02")
        assert qr1 != qr2


class TestGetLabelColorHex:
    def test_all_colors_mapped(self):
        for color_name, hex_value in LABEL_COLOR_HEX.items():
            assert get_label_color_hex(color_name) == hex_value

    def test_none_returns_white(self):
        assert get_label_color_hex(None) == "#FFFFFF"

    def test_unknown_returns_white(self):
        assert get_label_color_hex("unknown_color") == "#FFFFFF"


class TestFormatPrice:
    def test_format(self):
        result = format_price(Decimal("5.00"))
        assert "5.00" in result
        assert "\u20ac" in result  # Euro sign

    def test_no_decimals_adds_zeros(self):
        result = format_price(Decimal("10"))
        assert "10.00" in result


class TestGenerateLabelsPdf:
    def test_empty_lists_returns_empty(self):
        result = generate_labels_pdf([], MagicMock(), None)
        assert result == b""

    def test_returns_pdf_bytes(self, mock_depositor, mock_edition):
        articles = [_make_article(1), _make_article(2)]
        item_list = _make_item_list(100, mock_depositor, mock_edition, articles)
        result = generate_labels_pdf([item_list], mock_edition, None)
        assert isinstance(result, bytes)
        assert len(result) > 0
        # PDF files start with %PDF
        assert result[:5] == b"%PDF-"

    def test_single_list_pdf_size(self, mock_depositor, mock_edition):
        articles = [_make_article(1)]
        item_list = _make_item_list(100, mock_depositor, mock_edition, articles)
        result = generate_labels_pdf([item_list], mock_edition, None)
        # PDF with cover + separator + article list + labels should be substantial
        assert len(result) > 5000

    def test_multiple_lists(self, mock_depositor, mock_edition):
        articles1 = [_make_article(1)]
        articles2 = [_make_article(1), _make_article(2)]
        list1 = _make_item_list(100, mock_depositor, mock_edition, articles1)
        list2 = _make_item_list(101, mock_depositor, mock_edition, articles2)
        result = generate_labels_pdf([list1, list2], mock_edition, "Mercredi 9h30-11h30")
        assert isinstance(result, bytes)
        assert result[:5] == b"%PDF-"

    def test_with_slot_label(self, mock_depositor, mock_edition):
        articles = [_make_article(1)]
        item_list = _make_item_list(100, mock_depositor, mock_edition, articles)
        result = generate_labels_pdf([item_list], mock_edition, "Mercredi 9h30-11h30")
        assert isinstance(result, bytes)
        assert len(result) > 0
