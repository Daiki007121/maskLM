"""FastAPI application entry point for MaskLM."""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routes import router

app = FastAPI(title="MaskLM API", version="0.1.0")

_default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
_env_origins = os.environ.get("ALLOWED_ORIGINS", "")
_origins = [o.strip() for o in _env_origins.split(",") if o.strip()] if _env_origins else _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
