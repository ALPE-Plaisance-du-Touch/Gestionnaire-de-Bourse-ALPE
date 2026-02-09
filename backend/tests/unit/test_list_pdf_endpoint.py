"""Unit tests for list PDF download schema validation."""

from io import BytesIO

import pytest

from app.schemas.sale import SaleResponse


class TestSaleResponsePrivateSaleField:
    """Tests for is_private_sale field in SaleResponse."""

    def test_default_is_false(self):
        """is_private_sale defaults to False."""
        data = {
            "id": "test-id",
            "article_id": "art-1",
            "article_description": "Test article",
            "article_barcode": "ALP-001-001",
            "price": "10.00",
            "payment_method": "cash",
            "register_number": 1,
            "sold_at": "2026-02-13T10:00:00",
            "seller_name": "Volunteer One",
            "depositor_name": "Jean Dupont",
            "list_number": 100,
            "can_cancel": True,
        }
        response = SaleResponse(**data)
        assert response.is_private_sale is False

    def test_private_sale_true(self):
        """is_private_sale can be set to True."""
        data = {
            "id": "test-id",
            "article_id": "art-1",
            "article_description": "Test article",
            "article_barcode": "ALP-001-001",
            "price": "10.00",
            "payment_method": "cash",
            "register_number": 1,
            "sold_at": "2026-02-13T17:15:00",
            "seller_name": "Volunteer One",
            "depositor_name": "Jean Dupont",
            "list_number": 100,
            "can_cancel": True,
            "is_private_sale": True,
        }
        response = SaleResponse(**data)
        assert response.is_private_sale is True


class TestSlotOccupancySchema:
    """Tests for SlotOccupancy schema (from billetweb preview)."""

    def test_schema_validates(self):
        from app.schemas.billetweb import SlotOccupancy

        slot = SlotOccupancy(
            slot_id="slot-1",
            slot_description="Mercredi 20h-22h",
            current=10,
            incoming=5,
            max_capacity=20,
            over_capacity=False,
        )
        assert slot.current == 10
        assert slot.incoming == 5
        assert slot.over_capacity is False

    def test_over_capacity_flag(self):
        from app.schemas.billetweb import SlotOccupancy

        slot = SlotOccupancy(
            slot_id="slot-2",
            slot_description="Vendredi 9h-12h",
            current=18,
            incoming=5,
            max_capacity=20,
            over_capacity=True,
        )
        assert slot.over_capacity is True
