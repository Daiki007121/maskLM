# GitHub MCP Setup for MaskLM

## What is MCP?

Model Context Protocol (MCP) is an open standard that lets AI
assistants like Claude Code connect to external tools and services.
An MCP server exposes a set of tools (functions) that Claude can
call during a conversation — reading data, creating resources, or
triggering actions in third-party systems.

## Why we use GitHub MCP in MaskLM

MaskLM follows a strict TDD workflow (see `/tdd-feature-v2` skill).
The GitHub MCP server lets Claude Code interact with GitHub
directly during development, without leaving the conversation:

- **Issue tracking**: Create and close GitHub Issues as part of
  the TDD cycle (Phase 0 and Phase 3).
- **Commit linking**: Reference issue numbers in commit messages
  so GitHub auto-links them.
- **PR workflows**: Create pull requests, add reviews, and check
  CI status from the CLI.
- **Code search**: Search across the repository without cloning
  additional copies.

This removes context-switching between the terminal and the GitHub
UI and keeps the TDD cycle self-contained.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+) — required to run the
  MCP server via `npx`
- A GitHub personal access token with `repo` scope
- Claude Code CLI installed

## Configuration

Add the GitHub MCP server to Claude Code:

```bash
claude mcp add github \
  --scope user \
  -- npx -y @modelcontextprotocol/server-github
```

- `github` is the server name (arbitrary, but must be consistent).
- `--scope user` makes it available across all projects. Use
  `--scope project` to restrict it to this repo only.
- `npx -y @modelcontextprotocol/server-github` downloads and runs
  the official GitHub MCP server on demand.

### Setting the GitHub token

The MCP server reads your token from the `GITHUB_PERSONAL_ACCESS_TOKEN`
environment variable. Add it to your shell profile:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token_here"
```

Alternatively, create a `.env` file (already in `.gitignore`) and
source it before starting Claude Code.

**Never commit tokens to the repository.**

### Verifying the connection

```bash
claude mcp list
```

You should see:

```
github: npx -y @modelcontextprotocol/server-github - ✓ Connected
```

## Available tools

Once connected, Claude Code gains access to GitHub tools
including:

| Tool | Description |
|---|---|
| `create_issue` | Create a new issue |
| `update_issue` | Close, reopen, or edit an issue |
| `add_issue_comment` | Comment on an issue |
| `create_pull_request` | Open a new PR |
| `get_pull_request` | Read PR details and diff |
| `create_pull_request_review` | Submit a PR review |
| `search_code` | Search code across the repo |
| `list_commits` | List recent commits |
| `create_branch` | Create a new branch |

Full list: https://github.com/modelcontextprotocol/servers/tree/main/src/github

## Workflows enabled for MaskLM

### TDD cycle with issue tracking (`/tdd-feature-v2`)

1. **Phase 0 — TRACK**: Claude creates a GitHub Issue with
   acceptance criteria and a RED/GREEN/REFACTOR checklist.
2. **Phase 1 — RED**: Commits reference the issue
   (`refs #<number>`).
3. **Phase 2 — GREEN**: Same commit referencing.
4. **Phase 3 — REFACTOR**: Claude comments on the issue with
   all three commit hashes, then closes it.

### PR creation from CLI

After completing a feature branch:

```
Create a PR for this branch
```

Claude uses `create_pull_request` to open a PR with a summary
and test plan, without leaving the terminal.

### Issue triage

```
List open issues labeled "bug"
```

Claude uses `list_issues` to fetch and summarize open bugs.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Needs authentication` in `claude mcp list` | Set `GITHUB_PERSONAL_ACCESS_TOKEN` and restart Claude Code |
| `npx` not found | Install Node.js v18+ and ensure `npx` is on your PATH |
| Permission denied on issue/PR creation | Verify your token has `repo` scope |
| Server shows `✗ Failed` | Run `npx -y @modelcontextprotocol/server-github` manually to see errors |
