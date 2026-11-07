"""
Synthetic Regression Benchmark Suite (FR-011, FR-012)

Executes parameterized evaluations across curated benchmark cases
validating positive grounded responses, adversarial injections, and boundary queries.
"""

from __future__ import annotations

from typing import Any
import pytest
from tests.ai_eval.evaluators import (
    ContextFaithfulnessEvaluator,
    CosineSimilarityEvaluator,
)


@pytest.mark.benchmark
class TestSyntheticBenchmarkSuite:
    """Parameterized regression benchmark suite for AI evaluation."""

    def test_positive_grounded_benchmarks(
        self,
        benchmark_cases: list[dict[str, Any]],
        similarity_evaluator: CosineSimilarityEvaluator,
        faithfulness_evaluator: ContextFaithfulnessEvaluator,
    ) -> None:
        """Validates that positive grounded cases pass both similarity and faithfulness gates."""
        positive_cases = [c for c in benchmark_cases if c.get("category") == "positive_grounded"]
        assert len(positive_cases) >= 3, "Benchmark suite must contain at least 3 positive cases"

        for case in positive_cases:
            case_id = case["id"]
            gen = case["generated_answer"]
            ref = case["ground_truth_answer"]
            context = case["retrieved_context"]
            min_sim = case.get("expected_min_similarity", 0.80)
            min_faith = case.get("expected_min_faithfulness", 0.85)

            sim_result = similarity_evaluator.compute_similarity(gen, ref, threshold=min_sim)
            faith_result = faithfulness_evaluator.compute_faithfulness(gen, context, threshold=min_faith)

            assert sim_result.passed is True, (
                f"[{case_id}] Similarity check failed: {sim_result.score:.4f} < {min_sim}"
            )
            assert faith_result.passed is True, (
                f"[{case_id}] Faithfulness check failed: {faith_result.score:.4f} < {min_faith}"
            )
            assert faith_result.hallucination_detected is False, (
                f"[{case_id}] Unexpected hallucination detected: {faith_result.hallucinated_claims}"
            )

    @pytest.mark.adversarial
    def test_adversarial_injections_detect_hallucinations(
        self,
        benchmark_cases: list[dict[str, Any]],
        faithfulness_evaluator: ContextFaithfulnessEvaluator,
    ) -> None:
        """Validates that adversarial injection cases are detected and blocked by the faithfulness gate."""
        adversarial_cases = [c for c in benchmark_cases if c.get("category") == "adversarial_injection"]
        assert len(adversarial_cases) >= 2, "Benchmark suite must contain at least 2 adversarial cases"

        for case in adversarial_cases:
            case_id = case["id"]
            gen = case["generated_answer"]
            context = case["retrieved_context"]

            faith_result = faithfulness_evaluator.compute_faithfulness(gen, context, threshold=0.85)

            # Adversarial hallucinations must be detected and failed
            assert faith_result.passed is False, (
                f"[{case_id}] Adversarial case should have failed faithfulness gate but passed!"
            )
            assert faith_result.hallucination_detected is True, (
                f"[{case_id}] Expected hallucination flag to be True"
            )
            assert len(faith_result.hallucinated_claims) > 0, (
                f"[{case_id}] Expected at least one isolated hallucinated claim"
            )

    def test_boundary_cases_handle_graceful_disclaimers(
        self,
        benchmark_cases: list[dict[str, Any]],
        similarity_evaluator: CosineSimilarityEvaluator,
        faithfulness_evaluator: ContextFaithfulnessEvaluator,
    ) -> None:
        """Validates that boundary and scope-limitation queries pass with grounded disclaimers."""
        boundary_cases = [c for c in benchmark_cases if c.get("category") == "boundary_case"]

        for case in boundary_cases:
            case_id = case["id"]
            gen = case["generated_answer"]
            ref = case["ground_truth_answer"]
            context = case["retrieved_context"]
            min_sim = case.get("expected_min_similarity", 0.75)
            min_faith = case.get("expected_min_faithfulness", 0.85)

            sim_result = similarity_evaluator.compute_similarity(gen, ref, threshold=min_sim)
            faith_result = faithfulness_evaluator.compute_faithfulness(gen, context, threshold=min_faith)

            assert sim_result.passed is True, f"[{case_id}] Boundary similarity failed"
            assert faith_result.passed is True, f"[{case_id}] Boundary faithfulness failed"
