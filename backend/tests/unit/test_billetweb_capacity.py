"""Unit tests for Billetweb import slot capacity and list type breakdown."""

from unittest.mock import MagicMock

import pytest

from app.models import DepositSlot
from app.models.item_list import ListType
from app.schemas.billetweb import ListTypeBreakdown, SlotOccupancy


class TestSlotOccupancySchema:
    """Tests for SlotOccupancy schema."""

    def test_under_capacity(self):
        occ = SlotOccupancy(
            slot_id="s1",
            slot_description="Mercredi 20h-22h",
            current=10,
            incoming=5,
            max_capacity=20,
            over_capacity=False,
        )
        assert occ.over_capacity is False
        assert occ.current + occ.incoming <= occ.max_capacity

    def test_over_capacity(self):
        occ = SlotOccupancy(
            slot_id="s1",
            slot_description="Mercredi 20h-22h",
            current=18,
            incoming=5,
            max_capacity=20,
            over_capacity=True,
        )
        assert occ.over_capacity is True
        assert occ.current + occ.incoming > occ.max_capacity

    def test_exact_capacity(self):
        occ = SlotOccupancy(
            slot_id="s1",
            slot_description="Mercredi 20h-22h",
            current=15,
            incoming=5,
            max_capacity=20,
            over_capacity=False,
        )
        assert occ.over_capacity is False
        assert occ.current + occ.incoming == occ.max_capacity


class TestListTypeBreakdown:
    """Tests for ListTypeBreakdown schema."""

    def test_default_values(self):
        breakdown = ListTypeBreakdown()
        assert breakdown.standard == 0
        assert breakdown.list_1000 == 0
        assert breakdown.list_2000 == 0

    def test_with_values(self):
        breakdown = ListTypeBreakdown(standard=10, list_1000=3, list_2000=2)
        assert breakdown.standard == 10
        assert breakdown.list_1000 == 3
        assert breakdown.list_2000 == 2

    def test_increment(self):
        breakdown = ListTypeBreakdown()
        breakdown.standard += 5
        breakdown.list_1000 += 2
        assert breakdown.standard == 5
        assert breakdown.list_1000 == 2
        assert breakdown.list_2000 == 0


class TestTarifToListTypeMapping:
    """Tests for tarif to list type mapping used in capacity calculations."""

    def test_standard_tarifs_count_correctly(self):
        from app.services.billetweb_import import BilletwebImportService

        standard_tarifs = ["Standard", "Normal", "Classique", "Unknown"]
        for tarif in standard_tarifs:
            result = BilletwebImportService._map_tarif_to_list_type(tarif)
            assert result == ListType.STANDARD.value

    def test_list_1000_tarifs(self):
        from app.services.billetweb_import import BilletwebImportService

        local_tarifs = ["Adhérent", "Adhérent ALPE", "Plaisançois"]
        for tarif in local_tarifs:
            result = BilletwebImportService._map_tarif_to_list_type(tarif)
            assert result == ListType.LIST_1000.value

    def test_list_2000_tarifs(self):
        from app.services.billetweb_import import BilletwebImportService

        family_tarifs = ["Famille", "Ami", "Famille/Ami"]
        for tarif in family_tarifs:
            result = BilletwebImportService._map_tarif_to_list_type(tarif)
            assert result == ListType.LIST_2000.value
