---
name: tdd-feature-v2
description: Guide a feature through the Red-Green-Refactor TDD cycle for the MaskLM project with GitHub Issue tracking, auto-generated commit messages, and PII safety checks on test fixtures.
user_invocable: true
---

# /tdd-feature-v2 — Red-Green-Refactor TDD Cycle (v2)

Drive a new feature through the full TDD cycle for MaskLM.
The user provides a feature description; you execute each phase
in order, gating progression on explicit confirmation.

## What changed from v1 and why

1. **GitHub Issue creation before RED phase** (new Phase 0).
   v1 had no issue tracking — features were developed without
   a corresponding ticket. v2 creates a GitHub Issue via MCP
   before any code is written so the feature is discoverable,
   linkable in commits/PRs, and closable on completion.

2. **Auto-generated commit messages with TDD prefixes.**
   v1 said "commit with prefix [RED]" but left message content
   to the author's discretion, leading to inconsistent messages.
   v2 adds an explicit step to auto-generate a conventional
   commit message from the staged diff, enforcing the format:
   `[PHASE] type: description (refs #issue)`.

3. **PII safety check on test fixtures in GREEN phase.**
   v1 enforced PII rules only in implementation code. But test
   files can contain realistic PII in fixtures (names, emails,
   phones) that might leak into logs or CI output. v2 adds a
   step that runs `validate_masked_text` against any test
   fixture strings that contain PII-like data, ensuring tests
   use obviously-fake values or properly masked placeholders.

## Inputs

$ARGUMENTS — A short description of the feature to implement
(e.g., "POST /mask endpoint that accepts resume text").

## Phase 0: TRACK — Create GitHub Issue

1. **Derive issue title** from the user's feature description.
   Keep it concise (under 70 characters).
2. **Create a GitHub Issue** using the `mcp__github__create_issue`
   tool with:
   - `owner` / `repo`: inferred from the git remote
   - `title`: the derived title
   - `body`: a short description including:
     - What the feature does
     - Acceptance criteria (derived from scope discussion)
     - A checklist: `- [ ] RED`, `- [ ] GREEN`, `- [ ] REFACTOR`
   - `labels`: `["enhancement"]` (add `"pii-safety"` if the
     feature touches PII handling)
3. **Record the issue number** (e.g., `#42`) — reference it in
   every commit message for the rest of the cycle.
4. Proceed to RED.

## Phase 1: RED — Write Failing Tests

1. **Clarify scope**: Confirm with the user what the feature
   should do. Identify inputs, outputs, edge cases, and error
   conditions before writing any code.
2. **Create test file**: Place tests in `/tests/` mirroring
   `/src/` structure. File name: `test_{module_name}.py`.
3. **Write pytest tests** that cover:
   - Happy-path behavior
   - Edge cases (empty input, missing fields, etc.)
   - Error / validation paths
4. **Enforce CLAUDE.md conventions in test code**:
   - snake_case for all functions and file names
   - Type hints on all function signatures
   - Docstrings on all public test helpers and fixtures
   - Max line length: 88 characters
   - Imports grouped: stdlib, third-party, local
5. **Run the tests** with `pytest` and confirm they FAIL.
   - If any test passes unexpectedly, flag it — the feature
     may already exist or the test is wrong.
6. **Auto-generate commit message and commit**:
   - Run `git diff --cached` to inspect staged changes.
   - Generate a message following this format:
     ```
     [RED] test: <what the tests cover> (refs #<issue>)
     ```
   - Example: `[RED] test: failing tests for POST /mask endpoint (refs #42)`
   - Commit with the generated message.
7. **Stop and ask the user** to review before proceeding to
   GREEN.

## Phase 2: GREEN — Minimal Implementation

1. **Write the minimum code** in `/src/` to make every RED
   test pass. Do not add functionality beyond what the tests
   require.
2. **Enforce CLAUDE.md conventions in implementation code**:
   - snake_case for all functions and file names
   - Type hints on all function signatures
   - Docstrings on all public functions and classes
   - Max line length: 88 characters
   - Imports grouped: stdlib, third-party, local
3. **Enforce CLAUDE.md security rules**:
   - NEVER log raw PII — only log masked text
   - NEVER write original values to disk
   - NEVER hardcode API keys
   - NEVER send unmasked text to external APIs
   - Keep session mapping in memory only
   - Use typed placeholders: `[NAME_1]`, `[EMAIL_1]`, etc.
4. **PII safety check on test fixtures**:
   - Scan all test files touched in this cycle for string
     literals that look like real PII (names, emails, phone
     numbers, addresses).
   - For each suspicious fixture string, run
     `validate_masked_text(fixture_value, {})` with a fresh
     Presidio detection pass to confirm the value is either:
     - Obviously fake (e.g., "Jane Doe", "test@example.com")
       and acceptable for tests, OR
     - A typed placeholder like `[NAME_1]`.
   - If a fixture contains a realistic PII value that could
     be mistaken for real data (e.g., a plausible real phone
     number, a non-example-domain email), flag it and suggest
     replacing with an obviously-fake alternative.
   - This step ensures test output and CI logs never
     accidentally surface realistic PII.
5. **Run the tests** with `pytest` and confirm they all PASS.
   - If a test still fails, fix the implementation (not the
     test) until green.
6. **Auto-generate commit message and commit**:
   - Run `git diff --cached` to inspect staged changes.
   - Generate a message following this format:
     ```
     [GREEN] feat: <what was implemented> (refs #<issue>)
     ```
   - Example: `[GREEN] feat: minimal POST /mask endpoint (refs #42)`
   - Commit with the generated message.
7. **Stop and ask the user** to review before proceeding to
   REFACTOR.

## Phase 3: REFACTOR — Improve Without Changing Behavior

1. **Review the GREEN implementation** for:
   - Duplicated logic that can be extracted
   - Naming clarity (snake_case, descriptive names)
   - Missing or weak type hints
   - Missing or incomplete docstrings
   - Import ordering (stdlib, third-party, local)
   - Any PII safety violations introduced during GREEN
2. **Refactor** the code. Do not change external behavior —
   all existing tests must continue to pass.
3. **Run the tests** with `pytest` and confirm they still PASS.
4. **Auto-generate commit message and commit**:
   - Run `git diff --cached` to inspect staged changes.
   - Generate a message following this format:
     ```
     [REFACTOR] refactor: <what changed> (refs #<issue>)
     ```
   - Example: `[REFACTOR] refactor: extract validation helper (refs #42)`
   - Commit with the generated message.
5. **Close the GitHub Issue** by updating it with a comment
   that links the three commits (RED, GREEN, REFACTOR).
6. **Present a summary** to the user:
   - What was implemented
   - What tests cover it
   - GitHub Issue link
   - Any open items or follow-up suggestions

## Commit Message Auto-Generation Rules

All commits in this cycle MUST follow this format:

```
[PHASE] type: short description (refs #<issue>)
```

- **PHASE**: `RED`, `GREEN`, or `REFACTOR`
- **type**: `test` (RED), `feat` or `fix` (GREEN),
  `refactor` (REFACTOR)
- **short description**: derived from `git diff --cached`,
  summarizing what changed in ≤50 characters
- **refs #issue**: the GitHub Issue number from Phase 0

To generate the message:
1. Stage the files: `git add <files>`
2. Run `git diff --cached --stat` to see what changed.
3. Compose the message from the diff summary.
4. Commit: `git commit -m "<generated message>"`

## Guard Rails (enforced in every phase)

- **No PII logging**: If any `print()`, `logging.*`, or
  `logger.*` call references a variable that could hold raw
  PII, reject it and use the masked version instead.
- **Type hints required**: Every function signature must have
  full parameter and return type annotations.
- **Docstrings required**: Every public function and class
  must have a docstring.
- **snake_case only**: All Python file names, functions, and
  variables must use snake_case.
- **Line length**: No line may exceed 88 characters.
- **Test isolation**: Tests must not depend on external
  services or persistent state.
- **Test fixture PII safety**: Test fixtures must use
  obviously-fake PII values or typed placeholders. Run
  `validate_masked_text` on suspicious fixtures during GREEN.
- **Issue tracking**: Every TDD cycle must have a
  corresponding GitHub Issue created before RED phase.
