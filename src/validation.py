"""Validation utilities for masked text PII leak detection."""

from __future__ import annotations

from src.models import ValidationResult


def validate_masked_text(
    masked_text: str, mapping: dict[str, str]
) -> ValidationResult:
    """Check that no original PII values appear in masked text.

    Performs case-insensitive substring matching of each
    original value from the mapping against the masked text.
    Returns a ValidationResult indicating whether the text is
    safe and listing any leaked placeholder keys.
    """
    leaked: list[str] = []
    lower_text = masked_text.lower()

    for placeholder, original_value in mapping.items():
        if original_value.lower() in lower_text:
            leaked.append(placeholder)

    return ValidationResult(
        is_valid=len(leaked) == 0,
        leaked_placeholders=leaked,
    )
