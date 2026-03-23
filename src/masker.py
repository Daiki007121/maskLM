"""PII detection, masking, and session management for resumes."""

import re
import uuid

from presidio_analyzer import AnalyzerEngine

from src.models import (
    PRESIDIO_ENTITY_MAP,
    DetectedEntity,
    EntityType,
    MaskingResult,
    SessionStore,
)

# Module-level session store (in-memory, never persisted).
_session_store = SessionStore()

# Presidio entity types we ask the analyzer to detect.
_PRESIDIO_ENTITIES: list[str] = list(PRESIDIO_ENTITY_MAP.keys())

# Minimum confidence for ORG entities to reduce false positives.
_ORG_SCORE_THRESHOLD: float = 0.7


# ---------------------------------------------------------------------------
# Detection
# ---------------------------------------------------------------------------

def create_analyzer() -> AnalyzerEngine:
    """Initialize and return a configured Presidio AnalyzerEngine."""
    return AnalyzerEngine()


def detect_entities(
    text: str, analyzer: AnalyzerEngine
) -> list[DetectedEntity]:
    """Detect all PII entities in the input text.

    Returns entities sorted by start position. Overlapping
    entities are resolved by keeping the longer (or higher-
    confidence) match. Presidio's ORGANIZATION results below
    the confidence threshold are discarded.
    """
    if not text or text.isspace():
        return []

    raw_results = analyzer.analyze(
        text=text,
        entities=_PRESIDIO_ENTITIES,
        language="en",
    )

    mapped: list[DetectedEntity] = []
    for r in raw_results:
        entity_type = PRESIDIO_ENTITY_MAP.get(r.entity_type)
        if entity_type is None:
            continue
        if (
            entity_type == EntityType.EMPLOYER
            and r.score < _ORG_SCORE_THRESHOLD
        ):
            continue
        mapped.append(
            DetectedEntity(
                entity_type=entity_type,
                start=r.start,
                end=r.end,
                original_value=text[r.start : r.end],
                score=r.score,
            )
        )

    mapped.sort(key=lambda e: e.start)
    return _resolve_overlaps(mapped)


def _resolve_overlaps(
    entities: list[DetectedEntity],
) -> list[DetectedEntity]:
    """Remove overlapping entities, keeping the longer span.

    When two entities share character offsets, the one with the
    wider span wins. On ties, the higher confidence score wins.
    Input must be sorted by start position.
    """
    if not entities:
        return []

    resolved: list[DetectedEntity] = [entities[0]]
    for current in entities[1:]:
        prev = resolved[-1]
        if current.start < prev.end:
            prev_len = prev.end - prev.start
            curr_len = current.end - current.start
            if curr_len > prev_len or (
                curr_len == prev_len
                and current.score > prev.score
            ):
                resolved[-1] = current
        else:
            resolved.append(current)
    return resolved


# ---------------------------------------------------------------------------
# Masking
# ---------------------------------------------------------------------------

def mask_text(
    text: str, entities: list[DetectedEntity]
) -> MaskingResult:
    """Replace detected entities with typed placeholders.

    Assigns sequential IDs per type: [NAME_1], [NAME_2], etc.
    Duplicate original values receive the same placeholder so
    the mapping stays bijective. Processes entities in reverse
    offset order to preserve character positions.

    Returns a MaskingResult with a new unique session ID.
    """
    value_to_placeholder: dict[str, str] = {}
    type_counters: dict[EntityType, int] = {}
    mapping: dict[str, str] = {}

    # First pass: assign placeholders (forward order for
    # deterministic numbering).
    for entity in entities:
        if entity.original_value in value_to_placeholder:
            continue
        entity_type = entity.entity_type
        type_counters[entity_type] = (
            type_counters.get(entity_type, 0) + 1
        )
        idx = type_counters[entity_type]
        placeholder = f"[{entity_type.value}_{idx}]"
        value_to_placeholder[entity.original_value] = placeholder
        mapping[placeholder] = entity.original_value

    # Second pass: replace in reverse offset order so earlier
    # offsets stay valid.
    masked = text
    for entity in reversed(entities):
        placeholder = value_to_placeholder[entity.original_value]
        masked = (
            masked[: entity.start]
            + placeholder
            + masked[entity.end :]
        )

    session_id = uuid.uuid4().hex
    return MaskingResult(
        masked_text=masked,
        mapping=mapping,
        session_id=session_id,
    )


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------

def create_session(mapping: dict[str, str]) -> str:
    """Store a mapping under a new unique session ID.

    Returns the session_id.
    """
    session_id = uuid.uuid4().hex
    _session_store.create_session(session_id, mapping)
    return session_id


def get_mapping(session_id: str) -> dict[str, str] | None:
    """Retrieve the placeholder-to-original mapping for a session."""
    return _session_store.get_mapping(session_id)


def delete_session(session_id: str) -> bool:
    """Remove a session mapping from memory.

    Returns True if the session existed and was removed.
    """
    return _session_store.delete_session(session_id)


# ---------------------------------------------------------------------------
# Pipeline orchestrator
# ---------------------------------------------------------------------------

# Lazily initialized analyzer (spaCy model is expensive to load).
_analyzer: AnalyzerEngine | None = None


def _get_analyzer() -> AnalyzerEngine:
    """Return the shared AnalyzerEngine, creating it on first use."""
    global _analyzer
    if _analyzer is None:
        _analyzer = create_analyzer()
    return _analyzer


def mask_resume(text: str) -> MaskingResult:
    """End-to-end: detect PII in resume text, mask it, store the
    session, and return the result.

    Handles edge cases:
    - Empty / whitespace-only input returns unchanged text with
      an empty mapping.
    - Input containing placeholder-like patterns raises a
      ValueError.
    """
    if not text or text.isspace():
        session_id = uuid.uuid4().hex
        return MaskingResult(
            masked_text=text,
            mapping={},
            session_id=session_id,
        )

    if re.search(r"\[[A-Z]+_\d+\]", text):
        raise ValueError(
            "Input text contains placeholder-like patterns "
            "(e.g. [NAME_1]). Pre-mask the input or remove "
            "these patterns before calling mask_resume()."
        )

    analyzer = _get_analyzer()
    entities = detect_entities(text, analyzer)
    result = mask_text(text, entities)

    _session_store.create_session(
        result.session_id, result.mapping
    )
    return result
