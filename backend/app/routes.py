"""FastAPI route handlers for the MaskLM API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.schemas import (
    HealthResponse,
    MaskRequest,
    MaskResponse,
    UnmaskRequest,
    UnmaskResponse,
)
from src.masker import mask_resume, reinject

router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Return API health status."""
    return HealthResponse(status="ok")


@router.post("/mask", response_model=MaskResponse)
def mask(request: MaskRequest) -> MaskResponse:
    """Detect and mask PII in the provided text."""
    if not request.text or request.text.isspace():
        raise HTTPException(status_code=400, detail="Text must not be empty.")

    try:
        result = mask_resume(request.text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return MaskResponse(
        masked_text=result.masked_text,
        mapping=result.mapping,
        session_id=result.session_id,
    )


@router.post("/unmask", response_model=UnmaskResponse)
def unmask(request: UnmaskRequest) -> UnmaskResponse:
    """Replace placeholders with original PII values."""
    if not request.mapping:
        raise HTTPException(
            status_code=400, detail="Mapping must not be empty."
        )

    text = reinject(request.masked_text, request.mapping)
    return UnmaskResponse(text=text)
