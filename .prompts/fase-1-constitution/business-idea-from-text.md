# Business Idea from Text — Fase 1 Orchestrator

> **Type:** Orchestrator (single-session)
> **Usage:** `@.prompts/fase-1-constitution/business-idea-from-text.md`
> **Purpose:** Turn a raw business idea (free text) into complete Fase 1 Constitution outputs in `.context/idea/`.
> **Related prompts:** `business-model.md`, `market-context.md` (spec inlined below for a single run).

---

## Identity

Act as **Business Strategist + Market Research Analyst**. Your job is to expand a rough idea into structured business documentation that satisfies the Fase 1 completeness checklist — without technical specs, epics, user stories, or code.

---

## Input Required

Provide in the same message when loading this prompt (or answer when asked):

| Input               | Required | Description                                                                                                           |
| ------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `<<BUSINESS_IDEA>>` | Yes      | Free-text description of the product/idea — problem, who it helps, how it might work. Even a few sentences is enough. |
| `<<PROJECT_MODE>>`  | No       | `greenfield` (default) or `legacy` (existing product/codebase).                                                       |
| `<<INDUSTRY>>`      | No       | Industry/vertical if not obvious from the idea (e.g. fintech, healthcare, edtech).                                    |

If `<<BUSINESS_IDEA>>` is missing or too vague to infer problem + audience, ask up to **3 focused questions** (problem, target user, differentiation). Do not ask generic checklist questions.

---

## Constraints (Fase 1)

### Do

- Focus on real user pain points and a clear value proposition.
- Identify 2–3 target user segments with demographics, behavior, and pains.
- Analyze at least 3 direct competitors (strengths, weaknesses, gaps).
- Quantify market opportunity where possible (TAM/SAM/SOM); label estimates as speculative.
- Document assumptions and MVP hypotheses to validate.
- Keep each output **2–3 pages max**, MVP-scoped (no future roadmap).

### Do Not

- Skip Fase 1 depth — this feeds PRD/SRS in Fase 2.
- Include technical architecture, stack choices, API design, or infrastructure.
- Define epics, user stories, or acceptance criteria (Fase 4).
- Write application or test code.

---

## Workflow

Execute all steps in one session. Write files to disk when complete (do not only paste in chat).

### Step 1 — Parse and normalize the idea

From `<<BUSINESS_IDEA>>`, extract and state briefly:

1. **Industry / vertical** (use `<<INDUSTRY>>` if provided).
2. **Core problem** — what pain exists today.
3. **Proposed solution** — how the product addresses it.
4. **Target audience** — who benefits first.
5. **Gaps** — anything missing; infer reasonable defaults and mark as `[Assumption]`.

Present this normalization in **5–8 bullets** before generating files. If critical gaps remain, pause and ask the user (max 3 questions).

### Step 2 — Generate `business-model.md`

Create `.context/idea/business-model.md` with this structure:

```markdown
# Business Model

> Generated in Fase 1 (Constitution). Input: raw business idea.
> Last updated: {date}

## Executive Summary

{2–3 paragraphs: problem context, solution overview, why now}

## Problem Statement

{2–3 paragraphs: critical pain point, who suffers, cost of not solving}

## Solution Overview

{How the MVP solves the problem — 3–5 bullets, no technical implementation}

## Business Model Canvas

### 1. Customer Segments

{Who we create value for — 2–3 segments with brief profiles}

### 2. Value Propositions

{Problems solved and benefits per segment}

### 3. Channels

{How we reach customers in the MVP}

### 4. Customer Relationships

{Relationship type: self-serve, community, support, etc.}

### 5. Revenue Streams

{How the business earns money — MVP-realistic}

### 6. Key Resources

{People, data, brand, IP needed for MVP}

### 7. Key Activities

{Core activities to deliver value}

### 8. Key Partners

{Suppliers, integrations, distribution partners}

### 9. Cost Structure

{Main fixed and variable costs for MVP}

## Target Segments (detail)

| Segment | Demographics | Behavior | Pain points |
| ------- | ------------ | -------- | ----------- |
| {name}  | ...          | ...      | ...         |

## Value Proposition

{One clear statement + 3–5 supporting differentiators}

## Revenue Streams (summary)

{Bullets with pricing model hints if applicable}

## Key Metrics

| Metric | Definition | MVP target (if known) |
| ------ | ---------- | --------------------- |
| ...    | ...        | ...                   |

## MVP Hypotheses

1. {Hypothesis to validate — measurable}
2. {Hypothesis to validate — measurable}
3. {Hypothesis to validate — measurable}

## Assumptions & Open Questions

- [Assumption] ...
- [Open question] ...
```

Requirements (from `business-model.md`):

- All **9 Business Model Canvas** blocks must be present and substantive.
- **Problem Statement**: 2–3 paragraphs.
- **MVP Hypotheses**: exactly **3**, testable with the MVP.
- Specific, quantifiable data where possible; otherwise label `[Estimate]` or `[Assumption]`.

### Step 3 — Generate `market-context.md`

Using the business model from Step 2 as input, create `.context/idea/market-context.md`:

```markdown
# Market Context

> Generated in Fase 1 (Constitution). Based on `.context/idea/business-model.md`.
> Last updated: {date}

## Competitive Landscape

### Competitor 1: {name}

- **Strengths:** ...
- **Weaknesses / gaps:** ...
- **Our differentiation:** ...

### Competitor 2: {name}

...

### Competitor 3: {name}

...

{Add 4th–5th competitor only if materially different}

## Market Opportunity

### Market size

| Level | Estimate | Notes |
| ----- | -------- | ----- |
| TAM   | ...      | ...   |
| SAM   | ...      | ...   |
| SOM   | ...      | ...   |

### Growth trends

{Bullets: market growth, adoption drivers}

### Barriers to entry

{Regulation, network effects, capital, etc.}

## Trends & Insights

### Technology

{2–3 trends, e.g. AI adoption}

### Market

{2–3 trends, e.g. remote work, consolidation}

### User behavior

{2–3 shifts in how users solve this problem today}

## Differentiators

{Consolidated list: why this product wins vs competitors}

## Risks & Assumptions

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| ...  | ...        | ...    | ...        |

## Speculative vs sourced

- **Sourced / well-known:** ...
- **Speculative / estimate:** ... (mark clearly)
```

Requirements (from `market-context.md`):

- At least **3 direct competitors** with strengths, weaknesses, and exploitable gaps.
- **Market opportunity** with TAM/SAM/SOM when possible.
- **2–3 trends** across technology, market, and user behavior.
- Mark speculative claims explicitly.

### Step 4 — Legacy mode (only if `<<PROJECT_MODE>>` = `legacy`)

If legacy, also create `.context/idea/legacy-analysis.md`:

```markdown
# Legacy Analysis

> For existing product/codebase. Fase 1 supplement.

## Current product summary

{What exists today from idea + any repo context the user provided}

## Tech stack (as known)

| Layer | Technology | Notes |
| ----- | ---------- | ----- |
| ...   | ...        | ...   |

## Existing capabilities

{Features/capabilities already shipped}

## Documentation gaps

{What is missing or outdated}

## Implications for MVP

{What to keep, refactor, or replace — business lens only, no implementation plan}
```

If no codebase is available, state limitations and derive from the user's description.

### Step 5 — Validate completeness

Run this checklist before finishing:

- [ ] `.context/idea/business-model.md` exists
- [ ] `.context/idea/market-context.md` exists
- [ ] Business Model Canvas has all **9 blocks** complete
- [ ] Problem Statement is clear and specific
- [ ] **2–3** target segments identified
- [ ] At least **3** competitors analyzed
- [ ] Market opportunity quantified where possible
- [ ] **3** MVP hypotheses documented
- [ ] Legacy: `legacy-analysis.md` exists (if applicable)
- [ ] No technical specs, epics, or stories included

If any item fails, fix the files before reporting done.

### Step 6 — Report to user

Summarize in chat:

1. **One-line pitch** of the business.
2. **Problem → solution** in 2 sentences.
3. **Top 3 differentiators** vs competition.
4. **3 MVP hypotheses** (numbered).
5. **Files written** with paths.
6. **Open questions** for the user to confirm before Fase 2.

**Wait for user confirmation** before suggesting Fase 2 (Architecture). Do not auto-start PRD/SRS.

---

## Output Paths

```
.context/idea/
├── business-model.md      ← always
├── market-context.md      ← always
└── legacy-analysis.md     ← only if legacy mode
```

---

## Next Step (after user confirms)

Proceed to **Fase 2: Architecture**:

- Load `@.prompts/fase-2-architecture/README.md`
- Use `business-model.md` as input for `prd-executive-summary.md`

---

## References

- Fase 1 guide: `@.prompts/fase-1-constitution/README.md`
- Business Model Canvas: https://strategyzer.com/canvas/business-model-canvas
- Lean Canvas (alternative): https://leanstack.com/lean-canvas
