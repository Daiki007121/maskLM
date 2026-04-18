"""Pydantic request/response schemas for the MaskLM API."""

from __future__ import annotations

from pydantic import BaseModel


class MaskRequest(BaseModel):
    """Request body for POST /api/mask."""

    text: str


class MaskResponse(BaseModel):
    """Response body for POST /api/mask."""

    masked_text: str
    mapping: dict[str, str]
    session_id: str


class UnmaskRequest(BaseModel):
    """Request body for POST /api/unmask."""

    masked_text: str
    mapping: dict[str, str]


class UnmaskResponse(BaseModel):
    """Response body for POST /api/unmask."""

    text: str


class HealthResponse(BaseModel):
    """Response body for GET /api/health."""

    status: str
