"""Data models for the MaskLM PII masking pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class EntityType(Enum):
    """Supported PII entity types for detection and masking."""

    NAME = "NAME"
    EMAIL = "EMAIL"
    PHONE = "PHONE"
    EMPLOYER = "EMPLOYER"


# Map Presidio entity types to our internal EntityType enum.
PRESIDIO_ENTITY_MAP: dict[str, EntityType] = {
    "PERSON": EntityType.NAME,
    "EMAIL_ADDRESS": EntityType.EMAIL,
    "PHONE_NUMBER": EntityType.PHONE,
    "ORGANIZATION": EntityType.EMPLOYER,
}


@dataclass
class DetectedEntity:
    """A single PII entity found in the text."""

    entity_type: EntityType
    start: int
    end: int
    original_value: str
    score: float


@dataclass
class MaskingResult:
    """Output of the masking pipeline."""

    masked_text: str
    mapping: dict[str, str]
    session_id: str


@dataclass
class SessionStore:
    """In-memory store of all active session mappings."""

    sessions: dict[str, dict[str, str]] = field(
        default_factory=dict
    )

    def create_session(
        self, session_id: str, mapping: dict[str, str]
    ) -> None:
        """Store a mapping under the given session ID."""
        self.sessions[session_id] = mapping

    def get_mapping(
        self, session_id: str
    ) -> dict[str, str] | None:
        """Retrieve the placeholder-to-original mapping for a session."""
        return self.sessions.get(session_id)

    def delete_session(self, session_id: str) -> bool:
        """Remove a session mapping from memory.

        Returns True if the session existed and was removed.
        """
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False
