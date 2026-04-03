"""Failing tests for SessionStore.get_mapping retrieval."""

from src.models import SessionStore


class TestGetMappingHappyPath:
    """Retrieving a mapping that exists in the store."""

    def test_returns_mapping_for_existing_session(self) -> None:
        """get_mapping returns the stored dict for a known ID."""
        store = SessionStore()
        mapping = {"[NAME_1]": "Jane Doe"}
        store.create_session("sess-1", mapping)
        result = store.get_mapping("sess-1")
        assert result == {"[NAME_1]": "Jane Doe"}

    def test_returns_full_mapping_multiple_keys(self) -> None:
        """get_mapping returns all placeholder entries."""
        store = SessionStore()
        mapping = {
            "[NAME_1]": "Jane Doe",
            "[EMAIL_1]": "jane@example.com",
            "[PHONE_1]": "555-0100",
        }
        store.create_session("sess-2", mapping)
        result = store.get_mapping("sess-2")
        assert result == mapping

    def test_sessions_are_isolated(self) -> None:
        """Each session ID returns only its own mapping."""
        store = SessionStore()
        store.create_session("a", {"[NAME_1]": "Alice"})
        store.create_session("b", {"[NAME_1]": "Bob"})
        assert store.get_mapping("a") == {
            "[NAME_1]": "Alice"
        }
        assert store.get_mapping("b") == {
            "[NAME_1]": "Bob"
        }


class TestGetMappingMissing:
    """Retrieving a mapping for a non-existent session."""

    def test_returns_none_for_unknown_session(self) -> None:
        """get_mapping returns None when session ID not found."""
        store = SessionStore()
        result = store.get_mapping("does-not-exist")
        assert result is None

    def test_returns_none_after_deletion(self) -> None:
        """get_mapping returns None after session is deleted."""
        store = SessionStore()
        store.create_session("sess-x", {"[NAME_1]": "Jane"})
        store.delete_session("sess-x")
        result = store.get_mapping("sess-x")
        assert result is None


class TestGetMappingEdgeCases:
    """Edge cases for get_mapping."""

    def test_empty_mapping_returns_empty_dict(self) -> None:
        """A session with an empty mapping returns {}."""
        store = SessionStore()
        store.create_session("empty", {})
        result = store.get_mapping("empty")
        assert result == {}

    def test_empty_string_session_id(self) -> None:
        """Empty string is a valid session ID key."""
        store = SessionStore()
        store.create_session("", {"[NAME_1]": "Jane Doe"})
        result = store.get_mapping("")
        assert result == {"[NAME_1]": "Jane Doe"}

    def test_fresh_store_has_no_sessions(self) -> None:
        """A new SessionStore returns None for any lookup."""
        store = SessionStore()
        assert store.get_mapping("anything") is None
