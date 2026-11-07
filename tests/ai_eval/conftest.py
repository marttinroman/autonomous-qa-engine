"""
Pytest Fixtures for Layer 3 AI Semantic Evaluation Suite
"""

from __future__ import annotations

import json
from pathlib import Path
import sys
from typing import Any
import pytest
from dotenv import load_dotenv

# Ensure project root is on sys.path for absolute imports
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

load_dotenv(ROOT_DIR / ".env")

from tests.ai_eval.evaluators import (
    ContextFaithfulnessEvaluator,
    CosineSimilarityEvaluator,
)


@pytest.fixture(scope="session")
def similarity_evaluator() -> CosineSimilarityEvaluator:
    """Provides a configured CosineSimilarityEvaluator instance."""
    return CosineSimilarityEvaluator()


@pytest.fixture(scope="session")
def faithfulness_evaluator() -> ContextFaithfulnessEvaluator:
    """Provides a configured ContextFaithfulnessEvaluator instance."""
    return ContextFaithfulnessEvaluator()


@pytest.fixture(scope="session")
def benchmark_cases() -> list[dict[str, Any]]:
    """Loads the curated synthetic benchmark test catalog."""
    data_file = Path(__file__).resolve().parent / "data" / "benchmark_cases.json"
    with open(data_file, "r", encoding="utf-8") as f:
        return json.load(f)
