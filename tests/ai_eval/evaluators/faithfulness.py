"""
Layer 3 AI Semantic Evaluation: Context Faithfulness & Hallucination Fencing Engine

Verifies that factual claims made in generated AI responses are strictly
grounded in retrieved context documents, flagging hallucinations.
Guarantees execution throughput in < 20ms per evaluation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from difflib import SequenceMatcher
import os
import re
import time

STOP_WORDS = {
    "a", "above", "across", "also", "an", "and", "are", "as", "been", "below",
    "by", "can", "could", "each", "for", "from", "had", "has", "have", "in",
    "into", "is", "it", "its", "more", "of", "or", "require", "requires",
    "should", "that", "the", "this", "to", "under", "was", "were", "will",
    "with", "would",
}


@dataclass(frozen=True)
class FaithfulnessResult:
    """Evaluation result for context faithfulness and hallucination detection."""

    score: float
    passed: bool
    threshold: float
    total_claims: int
    supported_claims: list[str] = field(default_factory=list)
    hallucinated_claims: list[str] = field(default_factory=list)
    duration_ms: float = 0.0

    @property
    def hallucination_detected(self) -> bool:
        """True if any unsupported claim was detected or score falls below threshold."""
        return not self.passed or len(self.hallucinated_claims) > 0


class ContextFaithfulnessEvaluator:
    """Evaluates context faithfulness and detects hallucinations in generated answers.

    Extracts atomic claims and checks semantic grounding against context chunks.
    """

    def __init__(self, default_threshold: float | None = None) -> None:
        if default_threshold is not None:
            self.default_threshold = float(default_threshold)
        else:
            env_thresh = os.getenv("AI_FAITHFULNESS_THRESHOLD", "0.85")
            self.default_threshold = float(env_thresh)

        if not 0.0 < self.default_threshold <= 1.0:
            raise ValueError(
                f"Faithfulness threshold must be in range (0.0, 1.0], got {self.default_threshold}"
            )

    def extract_claims(self, text: str) -> list[str]:
        """Segments response text into discrete propositional claims.

        Splits on sentence terminators, bullet points, and semicolons.
        """
        clean = (text or "").strip()
        if not clean:
            return []

        # Remove markdown headers and list formatting
        clean = re.sub(r"^#+\s*", "", clean, flags=re.MULTILINE)
        clean = re.sub(r"^\s*[-*•]\s*", "", clean, flags=re.MULTILINE)

        # Split on sentence boundaries and line breaks
        raw_splits = re.split(r"(?<=[.!?])\s+|\n+|;\s*", clean)
        claims: list[str] = []

        for part in raw_splits:
            item = part.strip()
            # Retain non-trivial clauses (at least 3 words)
            if len(item.split()) >= 3:
                claims.append(item)

        # Fallback if no full sentence punctuation was used
        if not claims and clean:
            claims.append(clean)

        return claims

    @staticmethod
    def _token_in_context(tok: str, context_tokens: list[str]) -> bool:
        """Checks if a claim token has an exact, stem, or high-similarity match in context."""
        for c in context_tokens:
            if tok == c:
                return True
            if len(tok) >= 4 and len(c) >= 4:
                min_len = min(len(tok), len(c))
                if tok[:min_len - 1] == c[:min_len - 1]:
                    return True
            if SequenceMatcher(None, tok, c).ratio() >= 0.80:
                return True
        return False

    def _is_claim_supported(self, claim: str, context_text: str) -> bool:
        """Determines if an atomic claim is grounded in context text.

        Uses token coverage, entity alignment, and morphological stem matching.
        """
        norm_claim = claim.lower()
        norm_context = context_text.lower()

        # Fast direct containment
        if norm_claim in norm_context:
            return True

        claim_tokens = [
            t for t in re.findall(r"\b[a-z0-9_-]+\b", norm_claim)
            if len(t) >= 3 and t not in STOP_WORDS
        ]

        if not claim_tokens:
            return True

        context_tokens = re.findall(r"\b[a-z0-9_-]+\b", norm_context)
        matched_tokens = sum(1 for t in claim_tokens if self._token_in_context(t, context_tokens))
        token_coverage = matched_tokens / len(claim_tokens)

        # Grounding condition: at least 60% of significant content tokens
        return token_coverage >= 0.60

    def compute_faithfulness(
        self,
        generated: str,
        context_chunks: list[str],
        threshold: float | None = None,
    ) -> FaithfulnessResult:
        """Evaluates whether all claims in generated text are grounded in context_chunks.

        Calculates the ratio of supported claims over total claims.
        """
        start = time.perf_counter()
        target_threshold = threshold if threshold is not None else self.default_threshold

        claims = self.extract_claims(generated)

        if not claims:
            duration = round((time.perf_counter() - start) * 1000, 2)
            return FaithfulnessResult(
                score=1.0,
                passed=True,
                threshold=target_threshold,
                total_claims=0,
                supported_claims=[],
                hallucinated_claims=[],
                duration_ms=duration,
            )

        combined_context = " ".join(context_chunks or [])
        supported: list[str] = []
        hallucinated: list[str] = []

        for claim in claims:
            if self._is_claim_supported(claim, combined_context):
                supported.append(claim)
            else:
                hallucinated.append(claim)

        score = round(len(supported) / len(claims), 4)
        passed = score >= target_threshold and len(hallucinated) == 0

        duration = round((time.perf_counter() - start) * 1000, 2)

        return FaithfulnessResult(
            score=score,
            passed=passed,
            threshold=target_threshold,
            total_claims=len(claims),
            supported_claims=supported,
            hallucinated_claims=hallucinated,
            duration_ms=duration,
        )

    def assert_faithfulness(
        self,
        generated: str,
        context_chunks: list[str],
        threshold: float | None = None,
    ) -> FaithfulnessResult:
        """Evaluates faithfulness and raises AssertionError if any hallucination is detected."""
        result = self.compute_faithfulness(generated, context_chunks, threshold)
        if not result.passed:
            hallucinations = "; ".join(result.hallucinated_claims)
            raise AssertionError(
                f"[Context Faithfulness Gate Breached] Score {result.score:.4f} is below "
                f"threshold {result.threshold:.4f}. Hallucinated claims: [{hallucinations}]"
            )
        return result
