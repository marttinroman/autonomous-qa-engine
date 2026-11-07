"""
Unit & Contract Tests for Cosine Similarity Evaluator (FR-009, NFR-PERF-006)
"""

from __future__ import annotations

import pytest
from tests.ai_eval.evaluators import CosineSimilarityEvaluator


@pytest.mark.similarity
class TestCosineSimilarity:
    """Tests the vector cosine similarity engine."""

    def test_identical_texts_yield_perfect_score(
        self, similarity_evaluator: CosineSimilarityEvaluator
    ) -> None:
        text = "Autonomous QA Engine continuously validates web interfaces and REST APIs."
        result = similarity_evaluator.compute_similarity(text, text)

        assert result.score == 1.0
        assert result.passed is True
        assert result.duration_ms < 50.0

    def test_paraphrased_texts_exceed_similarity_threshold(
        self, similarity_evaluator: CosineSimilarityEvaluator
    ) -> None:
        gen = "The engine performs automated end-to-end web testing using Playwright across multiple browsers."
        ref = "The system runs automated E2E tests across web browsers utilizing the Playwright automation framework."

        result = similarity_evaluator.compute_similarity(gen, ref, threshold=0.60)

        assert result.score >= 0.60
        assert result.passed is True
        assert result.duration_ms < 50.0

    def test_unrelated_texts_fail_similarity_threshold(
        self, similarity_evaluator: CosineSimilarityEvaluator
    ) -> None:
        gen = "Chocolate chip cookies require unsalted butter, brown sugar, and flour."
        ref = "Playwright test runner executes parallel end-to-end browser specifications."

        result = similarity_evaluator.compute_similarity(gen, ref, threshold=0.70)

        assert result.score < 0.40
        assert result.passed is False

    def test_assert_similarity_raises_on_threshold_breach(
        self, similarity_evaluator: CosineSimilarityEvaluator
    ) -> None:
        gen = "Cooking recipes for Italian pasta carbonara."
        ref = "Software testing architecture with KATA patterns."

        with pytest.raises(AssertionError, match="Semantic Similarity Gate Breached"):
            similarity_evaluator.assert_similarity(gen, ref, threshold=0.80)

    def test_empty_string_handling(
        self, similarity_evaluator: CosineSimilarityEvaluator
    ) -> None:
        result = similarity_evaluator.compute_similarity("", "Sample text")
        assert result.score == 0.0
        assert result.passed is False

        both_empty = similarity_evaluator.compute_similarity("", "")
        assert both_empty.score == 1.0
        assert both_empty.passed is True
