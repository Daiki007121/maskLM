"""FastAPI application entry point for MaskLM."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider

from backend.app.routes import router
import src.masker as masker_mod


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-load spaCy en_core_web_sm so Presidio doesn't download en_core_web_lg."""
    provider = NlpEngineProvider(nlp_configuration={
        "nlp_engine_name": "spacy",
        "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
    })
    masker_mod._analyzer = AnalyzerEngine(nlp_engine=provider.create_engine())
    yield


app = FastAPI(title="MaskLM API", version="0.1.0", lifespan=lifespan)

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
