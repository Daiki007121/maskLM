# MaskLM

Privacy-first PII masking tool for LLM workflows. Paste sensitive
text into the web UI, get a sanitized version you can safely send
to any LLM, then paste the LLM's response back to restore the
original information — all without PII ever touching a third-party
service.

```
  ┌──────────────────────────────────────────────────────────┐
  │                MaskLM (your browser)                     │
  │                                                          │
  │  ┌─────────────┐          ┌─────────────────────────┐   │
  │  │ Paste text   │          │ Paste LLM response      │   │
  │  │ with PII     │          │ with [NAME_1] tokens     │   │
  │  │  [ Mask ]    │          │  [ Unmask ]              │   │
  │  └──────┬──────┘          └──────────┬──────────────┘   │
  │         │                            │                   │
  │         ▼                            ▼                   │
  │  "[NAME_1] works at          "Alice Chen works at        │
  │   [EMPLOYER_1]."              Acme Corp."                │
  │         │                            ▲                   │
  │         │  copy                      │  restored         │
  └─────────┼────────────────────────────┼───────────────────┘
            │                            │
            ▼                            │
       ┌─────────┐                       │
       │ ChatGPT │  ── LLM response ─────┘
       │ Claude  │     with [NAME_1] tokens
       │ etc.    │
       └─────────┘
```

## Why

Doctors, lawyers, recruiters, and compliance teams need to use
frontier LLMs on sensitive documents — but they can't send raw PII
to a third-party API. MaskLM sits in the middle: it detects and
replaces personal information before the text leaves your
environment, then restores it when the LLM responds.

## Privacy design

- **PII stays client-side.** The mapping between placeholders and
  original values lives in your browser (React state +
  localStorage). The backend is stateless — it processes your text
  and forgets it immediately.
- **No database.** MaskLM stores nothing on the server. Session
  history is kept in your browser's localStorage and never
  transmitted anywhere.
- **Typed placeholders.** Entities are replaced with structured
  tokens like `[NAME_1]`, `[EMAIL_1]`, `[PHONE_1]`,
  `[EMPLOYER_1]`. Repeated values share the same placeholder, so
  the LLM can reason about coreference naturally.
- **Leak validation.** Every masked payload is scanned for residual
  originals before it's returned to you.

## What gets detected

MaskLM masks four entity types in English text, powered by
[Microsoft Presidio](https://github.com/microsoft/presidio) with
spaCy NER:

| Placeholder    | Entity               | Detector                    |
| -------------- | -------------------- | --------------------------- |
| `[NAME_n]`     | Person names         | Presidio `PERSON`           |
| `[EMAIL_n]`    | Email addresses      | Presidio `EMAIL_ADDRESS`    |
| `[PHONE_n]`    | Phone numbers        | Presidio `PHONE_NUMBER`     |
| `[EMPLOYER_n]` | Organizations        | Presidio `ORGANIZATION`     |

Organization detection is gated at a 0.7 confidence threshold to
cut false positives. Overlapping entities are resolved by keeping
the wider, higher-confidence span.

## How to use

1. Open MaskLM in your browser
2. **Paste** sensitive text into the left panel
3. Click **Mask** — detected PII is replaced with tokens
4. **Copy** the masked text and paste it into ChatGPT, Claude, etc.
5. Copy the LLM's response (it will contain `[NAME_1]`, etc.)
6. **Paste** the response into the right panel
7. Click **Unmask** — original values are restored

Session history is saved in your browser so you can revisit past
masking sessions, re-edit original text, or unmask new LLM
responses against a previous mapping.

## API reference

The backend exposes a stateless REST API. The frontend calls these
endpoints; you can also use them directly.

| Method | Path           | Body                                      | Returns                                          |
| ------ | -------------- | ----------------------------------------- | ------------------------------------------------ |
| POST   | `/api/mask`    | `{ "text": str }`                         | `{ "masked_text", "mapping", "session_id" }`     |
| POST   | `/api/unmask`  | `{ "masked_text": str, "mapping": dict }` | `{ "text": str }`                                |
| GET    | `/api/health`  | —                                         | `{ "status": "ok" }`                             |

**Stateless design:** The server does not store sessions. The
`mapping` is returned to the client on mask and must be sent back
on unmask. This means server restarts never lose data, and multiple
workers just work.

Error responses:
- `400` — input contains a placeholder-like pattern (prevents
  double-masking) or empty/invalid request body
- `500` — leak validation caught residual PII in the masked output
  (invariant breach — should never happen)

## Development

### Prerequisites

- Python 3.11+
- Node.js 20+
- [uv](https://github.com/astral-sh/uv) (Python package manager)

### Setup

```bash
# Backend
uv sync
uv run python -m spacy download en_core_web_sm

# Frontend
cd frontend && npm install
```

### Running locally

Start both servers in separate terminals:

```bash
# Terminal 1 — Backend (port 8000)
uv run uvicorn backend.app.main:app --reload

# Terminal 2 — Frontend (port 5173, proxies /api → :8000)
cd frontend && npm run dev
```

Open http://localhost:5173 in your browser.

### Running tests

```bash
# All Python tests (core + backend)
uv run pytest

# With coverage
uv run pytest --cov=src --cov-report=term-missing

# Frontend type check
cd frontend && npx tsc --noEmit
```

### Project layout

```
maskLM/
├── src/
│   ├── masker.py         # PII detection, masking, re-injection
│   ├── models.py         # data classes + SessionStore
│   └── validation.py     # leak-detection safety net
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI app, CORS, security headers
│   │   ├── routes.py     # /api/mask, /api/unmask, /api/health
│   │   └── schemas.py    # Pydantic request/response models
│   ├── tests/            # backend API tests
│   └── Dockerfile        # Railway deployment
├── frontend/
│   ├── src/
│   │   ├── pages/        # MaskPage (main UI)
│   │   ├── components/   # Navbar, TextInput, MaskResult, etc.
│   │   ├── hooks/        # useLocalHistory
│   │   ├── api/          # API client
│   │   └── types/        # TypeScript interfaces
│   ├── vite.config.ts    # dev proxy /api → :8000
│   └── vercel.json       # Vercel deployment + CSP headers
├── tests/                # core pipeline tests
├── pyproject.toml
└── .github/workflows/    # CI pipeline
```

### Coding conventions

- Python 3.11+, `snake_case`, type hints required
- TypeScript strict mode, functional React components
- Max line length 88 (black)
- TDD: tests written before implementation, ≥80% coverage
- Raw PII must never be logged, written to disk, or stored
  server-side

## Deployment

- **Frontend** → [Vercel](https://vercel.com) (static SPA)
- **Backend** → [Railway](https://railway.app) (Docker container)

The backend Dockerfile uses `python:3.11-slim` with `en_core_web_sm`
(~12 MB spaCy model). Vercel config includes strict CSP headers
(`script-src 'self'`).

## Roadmap

The MVP delivers a working mask/unmask web UI. The following are
tracked as post-MVP work:

- **Supabase auth** — user accounts (no PII stored in Supabase)
- **localStorage encryption** — AES-GCM for session history
- **Fuzzy re-injection** — recover when an LLM rewrites
  `[NAME_1]` as `NAME_1` or `[Name 1]`
- **Streaming unmask** — stateful re-injector for SSE / token
  streams
- **Multilingual NER** — Chinese and other non-English detection
- **Manual entity editing** — let users add missed PII or remove
  false positives directly in the UI
- **`/chat` LLM proxy** — one-shot endpoint that masks, forwards
  to OpenAI/Anthropic, and unmasks
- **Eval harness** — pass@k / pass^k metrics plus LLM-judge
  scoring

## License

MIT (see `LICENSE`).

## Acknowledgements

MaskLM is built on [Microsoft Presidio](https://microsoft.github.io/presidio/)
for PII detection and [spaCy](https://spacy.io/) for the
underlying NER models.
