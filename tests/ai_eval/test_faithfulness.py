"""
Unit & Contract Tests for Context Faithfulness & Hallucination Fencing (FR-010, NFR-REL-005)
"""

from __future__ import annotations

import pytest
from tests.ai_eval.evaluators import ContextFaithfulnessEvaluator


@pytest.mark.faithfulness
class TestContextFaithfulness:
    """Tests the context faithfulness and hallucination detection engine."""

    def test_fully_grounded_answer_achieves_perfect_faithfulness(
        self, faithfulness_evaluator: ContextFaithfulnessEvaluator
    ) -> None:
        context = [
            "Playwright supports Chromium, Firefox, and WebKit rendering engines.",
            "Test execution occurs in headless parallel worker processes.",
        ]
        generated = (
            "Playwright supports Chromium, Firefox, and WebKit. "
            "Tests execute in headless parallel worker processes."
        )

        result = faithfulness_evaluator.compute_faithfulness(generated, context)

        assert result.score == 1.0
        assert result.passed is True
        assert result.hallucination_detected is False
        assert len(result.hallucinated_claims) == 0
        assert result.duration_ms < 50.0

    def test_hallucinated_claims_are_detected_and_isolated(
        self, faithfulness_evaluator: ContextFaithfulnessEvaluator
    ) -> None:
        context = [
            "Autonomous QA Engine validates REST APIs and enforces p95 response time budgets below 500ms.",
        ]
        # Includes a fabricated claim about quantum computing clusters
        generated = (
            "Autonomous QA Engine validates REST APIs and enforces p95 response times under 500ms. "
            "The system deploys proprietary quantum computing hardware to optimize neural vector search."
        )

        result = faithfulness_evaluator.compute_faithfulness(generated, context, threshold=0.85)

        assert result.score < 0.85
        assert result.passed is False
        assert result.hallucination_detected is True
        assert any("quantum computing" in claim.lower() for claim in result.hallucinated_claims)

    def test_assert_faithfulness_raises_on_hallucination(
        self, faithfulness_evaluator: ContextFaithfulnessEvaluator
    ) -> None:
        context = [
            "The starter repository is available free on GitHub under the MIT open-source license."
        ]
        generated = "Enterprise licenses cost $10,000 per month with proprietary terms."

        with pytest.raises(AssertionError, match="Context Faithfulness Gate Breached"):
            faithfulness_evaluator.assert_faithfulness(generated, context, threshold=0.85)

    def test_claim_extraction_segmentation(
        self, faithfulness_evaluator: ContextFaithfulnessEvaluator
    ) -> None:
        text = (
            "- Layer 1 executes web automation.\n"
            "- Layer 2 performs API testing.\n"
            "- Layer 3 handles semantic evaluations."
        )
        claims = faithfulness_evaluator.extract_claims(text)

        assert len(claims) == 3
        assert any("Layer 1" in c for c in claims)
        assert any("Layer 2" in c for c in claims)
        assert any("Layer 3" in c for c in claims)
