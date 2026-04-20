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

## Hooks

Two hooks are configured in `.claude/settings.json` for this project:

### PostToolUse: auto-format Python files

After any `Write`, `Edit`, or `MultiEdit` tool call, if the edited file has 
a `.py` extension, the hook runs `uv run ruff format` on that file. The hook 
is wrapped with `|| true` and exits 0 unconditionally, so formatting failures 
(e.g., `uv` unavailable) never block Claude Code. Non-Python edits are 
untouched.

**Purpose**: consistent Python formatting across Daiki and Jason without 
either of us having to remember to run `ruff format` manually.

### Stop: run test suite at session end

When Claude Code finishes responding (the `Stop` event), the hook runs 
`uv run pytest tests/ backend/tests/ --cov=src -q` in the background 
(`async: true`) and prints the last 20 lines of output. It checks the 
`stop_hook_active` field to avoid infinite loops, and exits 0 regardless 
of test outcome — the hook reports, it does not force a re-run.

**Purpose**: keep the test suite top-of-mind between sessions. If a test 
broke during a long refactor, we see it before pushing.

## Skills

Two custom skills live in `.claude/skills/`:

### `/tdd-feature` (v1)

Drives a feature through the Red-Green-Refactor TDD cycle. Enforces 
CLAUDE.md conventions (snake_case, type hints, 88-char lines, no PII in 
logs) at each phase. Commits with `[RED]`, `[GREEN]`, `[REFACTOR]` prefixes.

See: `.claude/skills/tdd-feature/SKILL.md`

### `/tdd-feature-v2` (v2)

Iterated version of `/tdd-feature`. The v2 header "What changed from v1 and 
why" documents the evolution:

1. **Phase 0 (TRACK)** added — creates a GitHub Issue via MCP before the 
   RED phase, so every feature has a discoverable, linkable ticket.
2. **Auto-generated commit messages** — derived from the staged diff in a 
   consistent `[PHASE] type: description (refs #issue)` format.
3. **PII safety check on test fixtures** — scans fixture strings for 
   realistic-looking PII during GREEN, not just implementation code.

See: `.claude/skills/tdd-feature-v2/SKILL.md`

The v1 → v2 iteration is real — v1 was used on the first TDD cycle for 
MaskLM, the gaps it exposed (no issue tracking, inconsistent commits, 
test-fixture PII leaks) drove the v2 design. Screenshots of both versions 
in use are in `screenshots/hw5/`.

## MCP Servers

Project-scoped MCP server configuration lives in `.mcp.json` at the repo 
root. Two servers are registered:

### GitHub MCP (`@modelcontextprotocol/server-github`)

Enables issue-driven development from Claude Code. The `/tdd-feature-v2` 
skill calls `mcp__github__create_issue` at Phase 0, `add_issue_comment` at 
the end of REFACTOR, and `update_issue` to close the ticket — the full 
lifecycle happens inside Claude Code.

Auth: the config references `${GITHUB_PERSONAL_ACCESS_TOKEN}` via shell 
env var expansion. No token is committed.

Full setup instructions in `docs/mcp-setup.md`.

### Playwright MCP (`@executeautomation/playwright-mcp-server`)

Used during the frontend work for E2E verification. The full mask → unmask 
flow was verified through Playwright MCP at the end of Phase 3 of the web 
app pivot (see Task 6, 7, 8 in `feature-requirements.md`). Also used for 
responsive-layout screenshots at desktop + mobile viewports.

## Sub-Agents

### `security-reviewer` (.claude/agents/security-reviewer.md)

A sub-agent that reviews staged diffs for:

1. **MaskLM-specific PII safety invariants** — no raw PII written to disk, 
   logs, or external services; no server-side session storage; typed 
   placeholder format preserved.
2. **OWASP Top 10** — scoped to categories that apply to MaskLM 
   (A01, A02, A03, A05, A07, A09).

Invoke before committing any change to `backend/app/routes.py`, the 
auth flow (`frontend/src/contexts/AuthContext.tsx`, 
`frontend/src/lib/supabase.ts`), or any file that handles user text.

Output: a structured report with `APPROVE | REQUEST_CHANGES | NEEDS_DISCUSSION` 
verdict.
