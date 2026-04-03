"""Failing tests for the validate_masked_text feature."""

from src.models import ValidationResult
from src.validation import validate_masked_text


class TestValidateMaskedTextClean:
    """Masked text that contains no leaked PII."""

    def test_clean_text_is_valid(self) -> None:
        """Fully masked text with no original values returns valid."""
        masked = "Candidate [NAME_1] works at [EMPLOYER_1]."
        mapping = {
            "[NAME_1]": "Jane Doe",
            "[EMPLOYER_1]": "Acme Corp",
        }
        result = validate_masked_text(masked, mapping)
        assert result.is_valid is True
        assert result.leaked_placeholders == []

    def test_empty_text_is_valid(self) -> None:
        """Empty masked text is trivially valid."""
        result = validate_masked_text("", {})
        assert result.is_valid is True
        assert result.leaked_placeholders == []

    def test_empty_mapping_is_valid(self) -> None:
        """Text with no mapping to check is valid."""
        result = validate_masked_text("Some plain text.", {})
        assert result.is_valid is True
        assert result.leaked_placeholders == []


class TestValidateMaskedTextLeaked:
    """Masked text that still contains raw PII values."""

    def test_leaked_name_detected(self) -> None:
        """Original name appearing in text is flagged."""
        masked = "Candidate Jane Doe works at [EMPLOYER_1]."
        mapping = {
            "[NAME_1]": "Jane Doe",
            "[EMPLOYER_1]": "Acme Corp",
        }
        result = validate_masked_text(masked, mapping)
        assert result.is_valid is False
        assert "[NAME_1]" in result.leaked_placeholders

    def test_leaked_email_detected(self) -> None:
        """Original email appearing in text is flagged."""
        masked = "Contact jane@example.com for details."
        mapping = {"[EMAIL_1]": "jane@example.com"}
        result = validate_masked_text(masked, mapping)
        assert result.is_valid is False
        assert "[EMAIL_1]" in result.leaked_placeholders

    def test_multiple_leaks_all_reported(self) -> None:
        """All leaked values are reported, not just the first."""
        masked = "Jane Doe at Acme Corp can be reached."
        mapping = {
            "[NAME_1]": "Jane Doe",
            "[EMPLOYER_1]": "Acme Corp",
        }
        result = validate_masked_text(masked, mapping)
        assert result.is_valid is False
        assert "[NAME_1]" in result.leaked_placeholders
        assert "[EMPLOYER_1]" in result.leaked_placeholders


class TestValidateMaskedTextCaseInsensitive:
    """Case-insensitive detection of leaked PII."""

    def test_lowercase_leak_detected(self) -> None:
        """Lowercase version of original value is caught."""
        masked = "Candidate jane doe is qualified."
        mapping = {"[NAME_1]": "Jane Doe"}
        result = validate_masked_text(masked, mapping)
        assert result.is_valid is False
        assert "[NAME_1]" in result.leaked_placeholders

    def test_uppercase_leak_detected(self) -> None:
        """Uppercase version of original value is caught."""
        masked = "Contact JANE@EXAMPLE.COM for info."
        mapping = {"[EMAIL_1]": "jane@example.com"}
        result = validate_masked_text(masked, mapping)
        assert result.is_valid is False
        assert "[EMAIL_1]" in result.leaked_placeholders


class TestValidationResultModel:
    """ValidationResult dataclass behaves correctly."""

    def test_valid_result_defaults(self) -> None:
        """A valid result has is_valid=True and empty leaks."""
        result = ValidationResult(
            is_valid=True, leaked_placeholders=[]
        )
        assert result.is_valid is True
        assert result.leaked_placeholders == []

    def test_invalid_result_holds_placeholders(self) -> None:
        """An invalid result stores the leaked placeholder keys."""
        result = ValidationResult(
            is_valid=False,
            leaked_placeholders=["[NAME_1]", "[EMAIL_1]"],
        )
        assert result.is_valid is False
        assert len(result.leaked_placeholders) == 2
