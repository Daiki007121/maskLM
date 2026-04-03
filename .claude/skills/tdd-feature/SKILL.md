---
name: tdd-feature
description: Guide a feature through the Red-Green-Refactor TDD cycle for the MaskLM project, enforcing CLAUDE.md constraints.
user_invocable: true
---

# /tdd-feature — Red-Green-Refactor TDD Cycle

Drive a new feature through the full TDD cycle for MaskLM.
The user provides a feature description; you execute each phase
in order, gating progression on explicit confirmation.

## Inputs

$ARGUMENTS — A short description of the feature to implement
(e.g., "POST /mask endpoint that accepts resume text").

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
6. **Commit** with prefix `[RED]` (e.g., `[RED] test: failing
   tests for POST /mask endpoint`).
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
4. **Run the tests** with `pytest` and confirm they all PASS.
   - If a test still fails, fix the implementation (not the
     test) until green.
5. **Commit** with prefix `[GREEN]` (e.g., `[GREEN] feat:
   minimal POST /mask endpoint`).
6. **Stop and ask the user** to review before proceeding to
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
4. **Commit** with prefix `[REFACTOR]` (e.g., `[REFACTOR]
   refactor: extract validation into helper`).
5. **Present a summary** to the user:
   - What was implemented
   - What tests cover it
   - Any open items or follow-up suggestions

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
