"""Failing tests for the placeholder re-injection feature."""

from src.masker import reinject


class TestReinjectSinglePlaceholders:
    """Single placeholder replacement per type."""

    def test_name_placeholder_replaced(self) -> None:
        """[NAME_1] in text is replaced with original name."""
        text = "Candidate [NAME_1] is a strong fit."
        mapping = {"[NAME_1]": "Jane Doe"}
        result = reinject(text, mapping)
        assert result == "Candidate Jane Doe is a strong fit."

    def test_email_placeholder_replaced(self) -> None:
        """[EMAIL_1] in text is replaced with original email."""
        text = "Contact: [EMAIL_1]"
        mapping = {"[EMAIL_1]": "jane@example.com"}
        result = reinject(text, mapping)
        assert result == "Contact: jane@example.com"


class TestReinjectMultiplePlaceholders:
    """Multiple placeholders of the same type."""

    def test_multiple_name_placeholders(self) -> None:
        """[NAME_1] and [NAME_2] map to different values."""
        text = "[NAME_1] referred [NAME_2] for the role."
        mapping = {
            "[NAME_1]": "Jane Doe",
            "[NAME_2]": "John Smith",
        }
        result = reinject(text, mapping)
        assert result == "Jane Doe referred John Smith for the role."

    def test_same_placeholder_appears_twice(self) -> None:
        """Same placeholder used in two locations."""
        text = "[NAME_1] submitted a resume. [NAME_1] is qualified."
        mapping = {"[NAME_1]": "Jane Doe"}
        result = reinject(text, mapping)
        assert result == (
            "Jane Doe submitted a resume. Jane Doe is qualified."
        )


class TestReinjectEdgeCases:
    """Edge cases for re-injection."""

    def test_unknown_placeholder_left_unchanged(self) -> None:
        """A placeholder not in the mapping stays in the output."""
        text = "[NAME_1] works at [EMPLOYER_1]."
        mapping = {"[NAME_1]": "Jane Doe"}
        result = reinject(text, mapping)
        assert result == "Jane Doe works at [EMPLOYER_1]."

    def test_empty_input_returns_empty(self) -> None:
        """Empty input string returns empty output string."""
        result = reinject("", {})
        assert result == ""

    def test_no_placeholders_returns_original(self) -> None:
        """Text with no placeholders returns original text."""
        text = "No sensitive data here."
        mapping = {"[NAME_1]": "Jane Doe"}
        result = reinject(text, mapping)
        assert result == "No sensitive data here."
