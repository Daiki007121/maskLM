# Retrospective: Custom Skill + MCP Integration

**MaskLM — Privacy-first LLM Middleware**

## 1. How did the custom skill change your workflow? What tasks became easier?

Before building `/tdd-feature`, the TDD cycle for MaskLM was a manual, error-prone process. Each time I started a new feature, I had to remember to write tests first, run pytest to confirm failure, switch to implementation, run pytest again, then refactor — all while keeping CLAUDE.md constraints in mind (type hints on every function, no raw PII in logs, snake_case throughout, 88-character line limit). Without a skill, any one of these steps could be skipped or done out of order.

The `/tdd-feature` skill changed this by turning the entire cycle into a structured, gated workflow. When I invoked `/tdd-feature Add a validate_masked_text function`, Claude Code walked me through scope clarification before touching any code, wrote failing tests first and committed them with a `[RED]` prefix, then waited for my review before proceeding. The CLAUDE.md constraints were enforced automatically — type hints and docstrings appeared without me asking. What previously required active discipline became the default behavior.

The biggest practical improvement was the interactive scope clarification at the start of each cycle. Rather than starting to code based on a vague description, the skill prompted structured questions: what should the function return, what inputs should it accept, should matching be case-sensitive? These decisions were made explicitly before any test was written, which eliminated the most common source of wasted work — implementing the wrong thing and then rewriting.

Iterating to v2 revealed an additional gap: v1 had no connection to GitHub, so features were developed without any tracking ticket. The `/tdd-feature-v2` skill added Phase 0, which automatically created a GitHub Issue before writing a single line of code. During the second task, Issue #2 was created with acceptance criteria and a RED/GREEN/REFACTOR checklist, every commit referenced `refs #2`, and the issue was automatically closed with a comment linking all three commits when the REFACTOR phase completed. The entire feature lifecycle — from ticket creation to closure — happened inside a single Claude Code session without any manual GitHub interaction.

## 2. What did MCP integration enable that wasn't possible before?

Without the GitHub MCP, Claude Code was isolated from the rest of the development workflow. It could write and run code, but it had no awareness of the project's issue tracker, no ability to create tickets, and no way to close the feedback loop between code changes and project management.

The GitHub MCP server changed this in two concrete ways.

First, it enabled **Issue-driven development from the terminal**. During the manual demo, I asked Claude Code to create Issue #1 with a specific title and label — it called `create_issue` via MCP and the ticket appeared on GitHub within seconds, without me opening a browser. This seems small, but removing the context switch between terminal and GitHub UI meaningfully reduces friction. In a real workflow where multiple features are being tracked simultaneously, staying in the terminal matters.

Second, and more significantly, it enabled **automated issue lifecycle management**. The `/tdd-feature-v2` skill used MCP not just once but throughout the cycle: `create_issue` at the start, commit messages with `refs #issue` linking automatically, `add_issue_comment` with the three commit hashes at the end, and `update_issue` to close the ticket. This is the kind of workflow automation that previously required either a CI/CD bot or manual discipline. The MCP made it possible to encode it directly into a Claude Code skill.

The combination of the skill and MCP is what made the v2 workflow meaningful. Either alone would have been incremental; together, they created a self-contained TDD loop with full traceability from ticket to code to closure.

## 3. What would you build next?

**Hooks** are the most immediate next step. The current workflow still relies on me remembering to run `git push` after completing a cycle. A `PostToolUse` hook on `git commit` that automatically pushes to the remote would close that gap. More importantly, a `PreToolUse` hook that blocks any `print()` or `logging` call containing a variable likely to hold raw PII would enforce the no-PII-logging rule at the tool level rather than relying on the skill's instructions — a much harder guarantee.

A **security-reviewer sub-agent** would address MaskLM's most critical risk surface. Before any implementation is merged, a dedicated agent could scan the diff for PII safety violations: raw values being written to disk, unmasked text being passed to external APIs, session IDs being reused. This is exactly the kind of checklist that gets skipped under deadline pressure and exactly the kind of thing a sub-agent can verify mechanically.

A **`/create-pr` skill** that combines the GitHub MCP with a writer/reviewer pattern would complete the development loop. After a TDD cycle finishes, the skill would create a pull request, write a description summarizing what was implemented and what tests cover it, and then invoke a reviewer sub-agent to check the diff against CLAUDE.md constraints and the MaskLM security rules before the PR is submitted for human review.

These three additions — hooks for enforcement, a security sub-agent for PII safety, and a PR skill for the final step — would turn MaskLM's Claude Code setup from a development aid into a complete, auditable pipeline from feature request to merged code.
