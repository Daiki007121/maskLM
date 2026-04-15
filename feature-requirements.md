# MaskLM MVP — Feature Requirements

## Goal

Package the existing PII masking core as an installable Python
tool and ship it to PyPI as `pip install masklm`. Expose both a
library API (in-process Python use) and a local HTTP API
(FastAPI, for non-Python clients and the local-proxy pattern).

## Non-goals for this iteration

- No modifications to `src/masker.py`, `src/models.py`,
  `src/validation.py`, or any existing file in `tests/`
- No SaaS deployment — MaskLM is self-hosted only
- No CI/CD, no Docker image, no frontend
- No `/chat` LLM proxy endpoint (deferred to post-MVP)
- None of the 12 future challenges recorded in the plan file
  (fuzzy re-injection, streaming, multilingual NER, etc.)

## Source of truth

Full plan: [`.claude/plans/floating-squishing-marble.md`](.claude/plans/floating-squishing-marble.md).

## Tasks

- [x] Task 1: Write `README.md` covering what MaskLM is, privacy
  guarantees, both install modes, Python and HTTP usage examples,
  API reference, development setup, and post-MVP roadmap —
  verified by: file exists at repo root and contains sections
  "Install", "Usage", "API reference", "Development", "Roadmap"

- [ ] Task 2: Create `pyproject.toml` declaring the `masklm`
  package (version 0.1.0, Python ≥3.11), core dependencies
  (`presidio-analyzer`, `presidio-anonymizer`, `spacy`), a
  `[server]` extra (`fastapi`, `uvicorn[standard]`), a `[dev]`
  extra (`pytest`, `pytest-cov`, `httpx`, transitively `[server]`),
  the `masklm` console script entrypoint, and a hatchling build
  config that ships `src/` — verified by: `uv sync --extra dev`
  completes without error

- [ ] Task 3: Create `.gitignore` covering standard Python
  artifacts (`__pycache__/`, `*.pyc`, `.venv/`, `dist/`, `build/`,
  `*.egg-info/`, `.pytest_cache/`, `.coverage`, `htmlcov/`) —
  verified by: `git status` shows no stray build artifacts after
  a test run

- [ ] Task 4: Create `src/__init__.py` re-exporting the public
  surface (`mask_resume`, `reinject`, `get_mapping`,
  `delete_session`, `validate_masked_text`, `EntityType`,
  `MaskingResult`, `DetectedEntity`, `ValidationResult`) plus
  `__version__` — verified by: `uv run python -c "from src import
  mask_resume, reinject, EntityType; print(mask_resume('test'))"`
  succeeds

- [ ] Task 5: Create `src/api.py` — a FastAPI app exposing
  `POST /mask`, `POST /unmask`, `DELETE /session/{id}`, and
  `GET /health`. All routes delegate to existing functions from
  `src.masker` and `src.validation`; no new business logic.
  Maps `ValueError` → 400, missing session → 404, leak
  invariant breach → 500 — verified by: the new endpoint tests
  in Task 7 all pass

- [ ] Task 6: Create `src/cli.py` providing a `masklm` command
  with a `serve` subcommand that runs uvicorn on
  `127.0.0.1:8000` by default, with `--host` and `--port`
  overrides — verified by: `uv run masklm serve` starts the
  server and `curl http://127.0.0.1:8000/health` returns
  `{"status":"ok"}`

- [ ] Task 7: Create `tests/test_api.py` with ~10 tests using
  `fastapi.testclient.TestClient` covering: `/mask` happy path,
  empty text, double-mask rejection; `/unmask` happy path,
  unknown session 404, unknown-placeholder tolerance; `/session`
  DELETE happy path + 404; `/health`; end-to-end mask → fake
  LLM response → unmask round-trip; session isolation between
  concurrent sessions — verified by: `uv run pytest
  tests/test_api.py -v` all green

- [ ] Task 8: Full-suite verification — existing 36 tests plus
  new API tests pass together, coverage on `src/` is ≥80% per
  CLAUDE.md — verified by: `uv run pytest --cov=src
  --cov-report=term-missing` shows all tests pass and coverage
  ≥80%

- [ ] Task 9: Build verification — `uv build` produces a wheel
  and sdist, and the wheel installs cleanly into a throwaway
  venv with the library importable — verified by: `uv build &&
  ls dist/masklm-0.1.0-py3-none-any.whl && uv venv /tmp/masklm-
  verify && /tmp/masklm-verify/bin/pip install dist/masklm-0.1.0*
  .whl && /tmp/masklm-verify/bin/python -c "from src import
  mask_resume; print(mask_resume('test').session_id)"`

## Out of scope (explicit reminders)

- PyPI upload itself is a manual step after Task 9 passes
  (register account, generate token, confirm name availability,
  `uv publish`). Not tracked as a Ralph task.
- Adding a `masklm/` shim package that re-exports from `src` is
  a cosmetic follow-up deferred until after Task 9 reveals
  whether the `from src import ...` style is acceptable.
