# MaskLM

## Project Description
Privacy-first LLM middleware that detects and anonymizes PII
in sensitive documents before forwarding to external LLMs,
then re-injects original values into the response.

@import docs/PRD.md

## Tech Stack
- Python 3.11+
- FastAPI (REST API layer)
- presidio-analyzer (NER-based PII detection)
- presidio-anonymizer (PII replacement)
- pytest (testing framework)
- React (frontend, optional for MVP)

## Architecture Decisions
- Masking happens server-side only, never in the browser
- Original values stored in memory per session only
- Original values are NEVER written to disk or logged
- Each masking session gets a unique session ID
- Placeholders follow typed format: [NAME_1], [EMAIL_1],
  [PHONE_1], [EMPLOYER_1]

## Coding Conventions
- snake_case for all Python files and functions
- Type hints required on all function signatures
- Docstrings required on all public functions and classes
- Max line length: 88 characters (black formatter)
- All imports at top of file, grouped: stdlib, third-party, local

## Testing Strategy
- TDD: tests written before implementation
- pytest for all tests
- Minimum 80% code coverage
- /tests directory mirrors /src directory structure
- Test file naming: test_{module_name}.py

## Do's
- Always validate masking output before sending to LLM
- Use typed placeholders ([NAME_1], [EMAIL_1], etc.)
- Keep session mapping in memory only
- Log masked text only, never original PII

## Don'ts
- NEVER log raw PII to console or files
- NEVER hardcode API keys
- NEVER store original values to disk
- NEVER send unmasked text to external APIs
- NEVER reuse session IDs across different documents
