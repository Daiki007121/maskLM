# MaskLM

Privacy-first PII masking middleware for LLM pipelines. MaskLM
detects personally identifiable information in text, replaces it
with typed placeholders before the text reaches an external LLM,
and re-injects the original values into the LLM's response — so
raw PII never leaves your environment.

```
  ┌──────────┐   mask    ┌─────────┐   [NAME_1] works at [EMPLOYER_1]   ┌──────────┐
  │   Your   │──────────►│ MaskLM  │───────────────────────────────────►│ External │
  │   App    │           │ (local) │                                    │   LLM    │
  │          │◄──────────│         │◄───────────────────────────────────│ (OpenAI, │
  └──────────┘  unmask   └─────────┘   Summary: [NAME_1] leads...       │  Claude) │
                              ▲                                         └──────────┘
                              │
                     in-memory session map
                     { "[NAME_1]": "Alice Chen",
                       "[EMPLOYER_1]": "Acme Corp" }
```

## Why

Teams in recruiting, legal, healthcare, and compliance routinely
hit a wall: they want to use frontier LLMs on their documents, but
they can't send raw PII to a third-party API. MaskLM is the thin
layer that makes those workflows possible without building yet
another regex-based scrubber in each app.

## Privacy guarantees

- **Local only.** MaskLM runs in your process or on your machine.
  There is no hosted service. PII is never transmitted to a
  MaskLM-owned endpoint because no such endpoint exists.
- **Memory only.** Session mappings (placeholder → original value)
  live in a plain Python dict for the lifetime of the process.
  Nothing is written to disk, nothing is logged.
- **Typed placeholders.** Entities are replaced with stable,
  structured tokens like `[NAME_1]`, `[EMAIL_1]`, `[PHONE_1]`,
  `[EMPLOYER_1]`. Repeated values share the same placeholder, so
  the LLM can reason about coreference naturally.
- **Leak validation.** Every masked payload is scanned for
  residual originals before it leaves the masking boundary.

## Status

**Pre-release / MVP in progress.** The core pipeline (detection,
masking, session management, re-injection, leak validation) is
implemented and covered by 36 passing tests. Packaging, HTTP
interface, CLI, and PyPI publication are the current MVP scope —
see the roadmap at the bottom of this file.

## What gets detected

Today, MaskLM masks four entity types in English text, powered by
[Microsoft Presidio](https://github.com/microsoft/presidio) with
spaCy NER under the hood:

| Placeholder    | Entity               | Detector                    |
| -------------- | -------------------- | --------------------------- |
| `[NAME_n]`     | Person names         | Presidio `PERSON`           |
| `[EMAIL_n]`    | Email addresses      | Presidio `EMAIL_ADDRESS`    |
| `[PHONE_n]`    | Phone numbers        | Presidio `PHONE_NUMBER`     |
| `[EMPLOYER_n]` | Organizations        | Presidio `ORGANIZATION`     |

Organization detection is gated at a 0.7 confidence threshold to
cut false positives. Overlapping entities (e.g. "John Smith" vs.
"Smith") are resolved by keeping the wider, higher-confidence
span.

## Install

MaskLM ships two install modes — pick one.

**Library only** (in-process, Python-to-Python use):

```bash
pip install masklm
```

**Library + HTTP server** (local proxy, non-Python clients, CLI):

```bash
pip install "masklm[server]"
```

Requirements: Python 3.11+. The first invocation will download a
spaCy English model (~40 MB).

## Usage

### As a Python library

```python
from masklm import mask_resume, reinject

text = (
    "Alice Chen leads engineering at Acme Corp. "
    "Reach her at alice.chen@acme.com or 415-555-0134."
)

result = mask_resume(text)

print(result.masked_text)
# "[NAME_1] leads engineering at [EMPLOYER_1]. "
# "Reach her at [EMAIL_1] or [PHONE_1]."

print(result.mapping)
# {"[NAME_1]": "Alice Chen", "[EMPLOYER_1]": "Acme Corp",
#  "[EMAIL_1]": "alice.chen@acme.com", "[PHONE_1]": "415-555-0134"}

# ...send result.masked_text to your LLM of choice...
llm_response = call_your_llm(result.masked_text)

final = reinject(llm_response, result.mapping)
```

`mask_resume()` returns a `MaskingResult` with three fields:
`masked_text`, `mapping` (placeholder → original), and
`session_id`. If you want MaskLM to hold the mapping for you and
only hand out the session ID, the HTTP server does that by
default — see below.

### As a local HTTP server

Start the server (binds to loopback only):

```bash
masklm serve
# INFO: Uvicorn running on http://127.0.0.1:8000
```

Mask some text:

```bash
curl -s -X POST http://127.0.0.1:8000/mask \
  -H "Content-Type: application/json" \
  -d '{"text": "Alice Chen works at Acme Corp."}'
```

```json
{
  "masked_text": "[NAME_1] works at [EMPLOYER_1].",
  "session_id": "8f3c2b1e...",
  "entity_count": 2
}
```

Send `masked_text` to your LLM, then unmask the response:

```bash
curl -s -X POST http://127.0.0.1:8000/unmask \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "8f3c2b1e...",
    "masked_response": "Summary: [NAME_1] is a leader at [EMPLOYER_1]."
  }'
```

```json
{ "text": "Summary: Alice Chen is a leader at Acme Corp." }
```

When you're done with a session, release its mapping from memory:

```bash
curl -X DELETE http://127.0.0.1:8000/session/8f3c2b1e...
```

### API reference (HTTP)

| Method | Path                  | Body                                   | Returns                                    |
| ------ | --------------------- | -------------------------------------- | ------------------------------------------ |
| POST   | `/mask`               | `{ "text": str }`                      | `{ masked_text, session_id, entity_count }` |
| POST   | `/unmask`             | `{ "session_id": str, "masked_response": str }` | `{ "text": str }`                          |
| DELETE | `/session/{id}`       | —                                      | `204 No Content`                           |
| GET    | `/health`             | —                                      | `{ "status": "ok" }`                       |

Error responses:
- `400` — input contains a placeholder-like pattern (prevents
  double-masking attacks)
- `404` — unknown session ID
- `500` — leak validation caught residual PII in the masked
  output (should never happen; fail-loud invariant check)

## How it fits in your pipeline

The typical integration is a three-step hop around whatever LLM
client you already use:

```
your request → POST /mask → your LLM call → POST /unmask → your response
```

Because MaskLM binds to `127.0.0.1` by default, it is accessible
only from processes on the same machine. Treat it the same way
you would treat a local cache or a sidecar daemon.

## Development

MaskLM uses [uv](https://github.com/astral-sh/uv) for dependency
management.

```bash
# One-time setup
uv sync --extra dev

# Run the full test suite
uv run pytest

# With coverage report
uv run pytest --cov=src --cov-report=term-missing

# Start the dev server
uv run masklm serve
```

### Project layout

```
maskLM/
├── src/
│   ├── masker.py         # detection, masking, re-injection
│   ├── models.py         # data classes + in-memory SessionStore
│   ├── validation.py     # leak-detection safety net
│   ├── api.py            # FastAPI HTTP layer (MVP)
│   └── cli.py            # `masklm serve` entrypoint (MVP)
├── tests/                # pytest suite, mirrors src/
├── docs/PRD.md           # product requirements
├── pyproject.toml        # packaging (MVP)
└── README.md
```

### Coding conventions

Set by `CLAUDE.md` and enforced in review:

- Python 3.11+, `snake_case`, type hints required
- Max line length 88 (black)
- Imports grouped stdlib / third-party / local, top of file
- Docstrings on all public functions and classes
- TDD: tests written before implementation, ≥80% coverage
- Raw PII must never be logged, written to disk, or returned to
  the caller unmasked

## Roadmap

The MVP focuses on making the existing pipeline installable and
reachable. The following are deliberately deferred and tracked as
post-MVP work:

- **Fuzzy re-injection** — recover when an LLM rewrites
  `[NAME_1]` as `NAME_1`, `[Name 1]`, or worse
- **Streaming unmask** — stateful re-injector for SSE / token
  streams where placeholders can split across chunks
- **Multilingual NER** — Chinese and other non-English detection
  via custom recognizers or GLiNER
- **k-anonymity checks** — catch quasi-identifier combinations
  that uniquely identify a person even after masking
- **Fidelity-preserving substitutes** — swap `[NAME_1]` for a
  Faker-generated realistic stand-in to keep pronoun agreement
- **LLM proxy endpoint** (`/chat`) — one-shot pass-through that
  masks, forwards to OpenAI/Anthropic, and unmasks
- **Structure-aware masking** — JSON, Markdown, and code blocks
- **Eval harness** — pass@k / pass^k metrics plus LLM-judge
  semantic-fidelity scoring
- **Red-team evaluation** — adversarial attempts to reconstruct
  original PII from masked output

## License

MIT (see `LICENSE` — to be added with the MVP release).

## Acknowledgements

MaskLM stands on top of [Microsoft Presidio](https://microsoft.github.io/presidio/)
for PII detection and [spaCy](https://spacy.io/) for the
underlying NER models.
