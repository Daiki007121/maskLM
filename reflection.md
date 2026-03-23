# Reflection: Structured Workflows with Claude Code

## Q1: How Does Explore-Plan-Implement-Commit Compare to How I Wrote Code Before?

The biggest shift is **when decisions happen**. In my previous approach, I would open a file and start coding — architectural decisions emerged implicitly as side effects of whatever got written first. The structured workflow forces those decisions to be explicit, reviewable, and made *before* any implementation exists.

A concrete example from this session: during the Plan phase, I had to decide between regex-only PII detection and Presidio's NER engine. In my old workflow, I would have started with regex (simpler, no dependencies), hit limitations when trying to detect employer names (which require world knowledge, not pattern matching), then refactored to Presidio after already building infrastructure around regex. The Plan phase forced that tradeoff analysis upfront — the decision to use Presidio's hybrid approach (NER for names and organizations, built-in regex for emails and phones) was documented and committed (`707de90`) before a single line of implementation existed. Changing that decision at plan time cost nothing; changing it after implementation would have meant a rewrite.

The Explore phase also prevented a subtle mistake: **assuming** the codebase was empty rather than **verifying** it. Running Glob and Grep first produced evidence — no `.py` files, no masking utilities, all grep hits came from docs only. On a real team codebase, this step would catch existing utilities, naming conventions, or patterns that should be reused.

The commit-per-phase discipline created a git history that reads like a story:

```
e00db57 explore: analyze existing project structure
707de90 plan: design PII masking pipeline
52e00df feat: implement resume PII masking
24ab0a9 [RED] test: failing tests for re-injection
5b89453 [GREEN] feat: minimum re-injection implementation
de54f98 [REFACTOR] refactor: extract re-injection logic
```

Six months from now, when someone asks "why Presidio instead of regex?", the plan commit has the answer. When someone asks "were tests written first?", the `[RED]` timestamp before `[GREEN]` proves it. The git history is both documentation and audit trail — my old approach produced none of this.

The TDD Red-Green-Refactor cycle added another layer of discipline. Writing 7 test cases first (`[RED]`) forced me to define `reinject()` through concrete examples — including edge cases like unknown placeholders and empty input — before thinking about implementation. The GREEN phase had a clear, finite target: make exactly those tests pass with minimal code (a 4-line `str.replace()` loop). The REFACTOR phase (extracting `PLACEHOLDER_PATTERN`, switching to `re.sub()`) was verifiably safe because all 7 tests passed before and after. Without tests, refactoring always carries risk; with them, it's a mechanical process.

**Bottom line:** my old approach was faster for the first 30 minutes and slower for everything after. The structured workflow invests upfront time in understanding and design, which pays off in fewer rewrites, safer refactoring, and code that someone else can actually follow.

---

## Q2: Which Context Management Strategies Worked Best and When Did I Use Them?

### CLAUDE.md as Persistent Project Memory

The single most effective strategy was front-loading project rules into `CLAUDE.md`. By specifying coding conventions (snake_case, type hints, docstrings, 88-char max line length), architecture constraints (server-side masking only, in-memory sessions, never log PII), and the testing strategy (TDD, pytest, 80% coverage) in one file, every subsequent prompt could focus on *what* to build rather than *how* to build it.

This paid off immediately: Claude Code applied type hints and docstrings to every function automatically because `CLAUDE.md` required them. The "Don'ts" section (never log raw PII, never store original values to disk) acted as guardrails during implementation — the session store was correctly implemented as in-memory-only without me having to repeat that constraint in each prompt. Without `CLAUDE.md`, I would have needed to restate these rules in every prompt, and some would inevitably be forgotten.

### PRD.md via @import

Importing the product requirements document into `CLAUDE.md` with `@import docs/PRD.md` meant user personas and stories were always loaded during implementation. When designing the `EntityType` enum (`NAME`, `EMAIL`, `PHONE`, `EMPLOYER`), the connection to user stories (recruiter masking candidate PII, lawyer masking client names, physician replacing patient info) was in context without re-pasting. This kept implementation decisions grounded in actual use cases rather than abstract engineering.

### Plan Mode for Architecture Decisions

Using Claude Code's Plan mode during the design phase was critical for preventing premature implementation. The plan file captured data structures (the `DetectedEntity` and `MaskingResult` dataclasses), function signatures (`detect_entities`, `mask_text`, `reinject`), edge cases (overlapping entities, duplicate values, placeholder-like input), and the complete file layout — all in a reviewable format before any code was written.

The plan also served as a contract between prompts: the Implement phase (Prompt 4) referenced "follow the exact function signatures from the plan," which meant Claude Code had an unambiguous spec to implement against. This eliminated the common failure mode where an AI assistant invents its own API surface that doesn't match what you expected.

### Phase-Labeled Commits as Workflow Anchors

Prefixing commits with tags (`explore:`, `plan:`, `feat:`, `[RED]`, `[GREEN]`, `[REFACTOR]`) turned the git log into both documentation and accountability. Each commit marks a clean boundary between phases, which helped in two ways:

1. **During the session:** I could always run `git log --oneline` to confirm I was in the right phase before issuing the next prompt.
2. **After the session:** Anyone reviewing the repo sees proof that tests preceded implementation (the `[RED]` commit timestamp is before `[GREEN]`), that design preceded coding (`plan:` before `feat:`), and that the explore step actually happened first.

### What I Would Do Differently

The one gap was **not using `/clear` between phases**. Each prompt accumulated the full conversation history, which meant later prompts carried context from earlier phases that was no longer relevant. For a longer session, using `/clear` before each new phase and relying on `CLAUDE.md` + git history to rebuild context would have kept the working context leaner and reduced the chance of Claude Code referencing stale decisions.

---

## Annotated Session Summary

| Step | Prompt | Phase | Key Outcome | Commit |
|------|--------|-------|-------------|--------|
| 1 | Setup | Init | Created CLAUDE.md, PRD.md, settings.json | `e00db57` |
| 2 | Explore | Explore | Glob/Grep confirmed greenfield — no .py files exist | `e00db57` |
| 3 | Plan | Plan | Chose Presidio over regex; designed data structures, function signatures, edge cases | `707de90` |
| 4 | Implement | Implement | Built `src/masker.py` and `src/models.py` following plan exactly | `52e00df` |
| 5 | TDD Red | Red | 7 failing tests for `reinject()` — proves tests came first | `24ab0a9` |
| 6 | TDD Green | Green | Added 4-line `reinject()` function — all 7 tests pass | `5b89453` |
| 7 | TDD Refactor | Refactor | Extracted `PLACEHOLDER_PATTERN` constant, switched to `re.sub()` — tests still pass | `de54f98` |
| 8 | Verify | Final | `git log --oneline` confirms correct commit sequence | — |

The full annotated session log with screenshot placeholders is in `session_log.md`.
