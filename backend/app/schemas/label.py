"""Pydantic schemas for label generation."""

from enum import Enum

from pydantic import BaseModel, Field, model_validator


class LabelGenerationMode(str, Enum):
    """Mode for label generation."""

    SLOT = "slot"
    SELECTION = "selection"
    INDIVIDUAL = "individual"
    COMPLETE = "complete"


class LabelGenerationRequest(BaseModel):
    """Request body for label generation."""

    mode: LabelGenerationMode = Field(
        default=LabelGenerationMode.COMPLETE,
        description="Generation mode: slot, selection, individual, or complete",
    )
    slot_id: str | None = Field(
        default=None,
        description="Deposit slot ID (required for mode=slot)",
    )
    depositor_ids: list[str] | None = Field(
        default=None,
        description="Depositor IDs (required for mode=selection or individual)",
    )

    @model_validator(mode="after")
    def validate_mode_params(self):
        if self.mode == LabelGenerationMode.SLOT and not self.slot_id:
            raise ValueError("slot_id is required when mode is 'slot'")
        if self.mode in (LabelGenerationMode.SELECTION, LabelGenerationMode.INDIVIDUAL):
            if not self.depositor_ids:
                raise ValueError("depositor_ids is required when mode is 'selection' or 'individual'")
        return self


class LabelStatsResponse(BaseModel):
    """Response for label statistics."""

    total_depositors: int = Field(description="Number of depositors with validated lists")
    total_lists: int = Field(description="Number of validated lists")
    total_labels: int = Field(description="Total number of articles/labels")
    labels_generated: int = Field(description="Number of lists with labels already generated")
    labels_pending: int = Field(description="Number of lists pending label generation")
