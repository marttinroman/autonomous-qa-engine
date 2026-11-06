# SRS: Functional Specifications - Autonomous QA & AI-TestOps Engine

> **Phase:** 2 - Architecture  
> **Document:** Software Requirements Specification (SRS) — Functional Specifications  
> **Status:** Approved / Baseline  
> **Project Key:** `AQE`  

---

## 1. Overview & Traceability Matrix

This document maps every User Story from the PRD MVP Scope ([.context/PRD/mvp-scope.md](file:///Users/marttinroman/projects/2026/publics/autonomous-qa-engine/.context/PRD/mvp-scope.md)) to formal, non-ambiguous Functional Requirements (`FR-001` through `FR-023`).

| Epic ID | Functional Category | User Stories | Functional Requirements |
| :--- | :--- | :--- | :--- |
| **`EPIC-AQE-001`** | Test Automation Core & KATA Architectural Harness | US 1.1 – US 1.4 | `FR-001` to `FR-004` |
| **`EPIC-AQE-002`** | Layer 2: API Contract Validation & Latency SLA Guard | US 2.1 – US 2.4 | `FR-005` to `FR-008` |
| **`EPIC-AQE-003`** | Layer 3: AI Semantic Evaluation (RAG Harness) | US 3.1 – US 3.4 | `FR-009` to `FR-012` |
| **`EPIC-AQE-004`** | Serverless CI/CD Quality Gate (GitHub Actions) | US 4.1 – US 4.4 | `FR-013` to `FR-016` |
| **`EPIC-AQE-005`** | Living TestOps Reporting & Showcase (GitHub Pages) | US 5.1 – US 5.4 | `FR-017` to `FR-020` |
| **`EPIC-AQE-006`** | Developer Ergonomics & CLI Tooling | US 6.1 – US 6.3 | `FR-021` to `FR-023` |

---

## 2. Functional Requirements Specifications

### EPIC-AQE-001: Test Automation Core & KATA Architectural Harness

#### FR-001: The system must enforce a layered KATA architecture separating configuration, base helpers, domain components, and unified fixtures
* **Related to:** `EPIC-AQE-001`, US 1.1
* **Input:**
  * Test execution trigger (CLI or CI).
  * `playwright.config.ts` configuration file.
  * Target environment variables (`TEST_ENV`, `BASE_URL`, `API_URL`).
* **Processing:**
  1. Bootstraps `TestContext` (Layer 1) to load environment configuration, faker data generators, and diagnostic utilities.
  2. Extends `TestContext` into `UiBase` and `ApiBase` (Layer 2) encapsulating low-level Playwright and HTTP client primitives.
  3. Instantiates Domain Page Objects and API clients (Layer 3) housing atomic Acceptance Test Cases (ATCs).
  4. Injects dependencies into test specifications via `TestFixture` (Layer 4) with lazy browser context initialization.
* **Output:**
  * Isolated, strongly-typed execution context for test specs.
* **Validations:**
  * Test specs must never instantiate raw Playwright `page` or `request` objects directly.
  * Imports must strictly use path aliases (`@ui/`, `@api/`, `@schemas/`, `@utils/`).

#### FR-002: The system must provide resilient Page Object Model (POM) abstractions utilizing auto-waiting locators
* **Related to:** `EPIC-AQE-001`, US 1.2
* **Input:**
  * Target selector queries (accessible roles, text, `data-testid`).
  * Action payloads (text to fill, click coordinates, keyboard keystrokes).
  * Maximum action timeout (default: 5,000ms).
* **Processing:**
  1. Resolves DOM elements via Playwright smart locators (`page.getByRole()`, `page.getByTestId()`).
  2. Awaits element actionability criteria automatically (attached to DOM, visible, stable, enabled, editable).
  3. Executes requested user interaction.
* **Output:**
  * Resolved locator handles; updated DOM application state; trace event logs.
* **Validations:**
  * Prohibits arbitrary static sleeps (`page.waitForTimeout` / `sleep`).
  * If element is not actionable within timeout, throws actionable error with selector metadata.

#### FR-003: The system must execute browser automation concurrently across Chromium, Firefox, and WebKit
* **Related to:** `EPIC-AQE-001`, US 1.3
* **Input:**
  * Project configuration flags: `--project=chromium`, `--project=firefox`, `--project=webkit`.
  * Parallel worker thread count (e.g., `workers: 4` or `100% CPU`).
* **Processing:**
  1. Spawns independent OS browser processes for each selected engine in headless mode.
  2. Distributes test specs evenly across worker threads with isolated browser contexts.
  3. Consolidates test execution results and screenshots across all engines.
* **Output:**
  * Unified cross-browser test report with engine-specific breakdown.
* **Validations:**
  * Zero cross-worker state contamination.
  * 100% test pass parity across Chromium, Firefox, and WebKit.

#### FR-004: The system must enforce atomic Acceptance Test Cases (ATCs) with isolated state fixtures
* **Related to:** `EPIC-AQE-001`, US 1.4
* **Input:**
  * Test case parameters and generated test data fixtures.
  * Isolated session credentials.
* **Processing:**
  1. Executes a single, self-contained end-to-end mini-flow.
  2. Evaluates fixed assertions directly within the ATC component.
  3. Returns control to test file for scenario-level assertions.
  4. Tears down ephemeral state upon completion.
* **Output:**
  * ATC execution result object (`{ success: boolean, durationMs: number, data?: T }`).
* **Validations:**
  * ATCs must be atomic; an ATC must never invoke another ATC directly. Multi-step chaining must be managed via the `Steps` module.

---

### EPIC-AQE-002: Layer 2: API Contract Validation & Latency SLA Guard

#### FR-005: The system must validate REST API response payloads against strict JSON Schemas
* **Related to:** `EPIC-AQE-002`, US 2.1
* **Input:**
  * HTTP response body (`application/json`).
  * Target compiled JSON Schema or TypeScript type facade from `@schemas/{domain}.types`.
* **Processing:**
  1. Parses raw JSON response payload.
  2. Executes JSON Schema validation against registered endpoint schema.
  3. Detects missing mandatory properties, type violations, and unannounced extra fields.
* **Output:**
  * Validation result (`{ isValid: boolean, errors?: SchemaValidationError[] }`).
* **Validations:**
  * Strict schema enforcement: fails build on undocumented breaking changes or omitted required fields.

#### FR-006: The system must enforce percentile latency SLA budgets on API endpoint execution
* **Related to:** `EPIC-AQE-002`, US 2.2
* **Input:**
  * API endpoint URL and payload.
  * SLA budget thresholds ($p95 \le 500\text{ms}$, $p99 \le 1000\text{ms}$).
  * Warmup probe iterations (default: 3).
* **Processing:**
  1. Executes warmup probes to eliminate cold-start outliers.
  2. Executes benchmark request iterations, recording round-trip duration in milliseconds.
  3. Calculates $p90$, $p95$, and $p99$ percentiles.
  4. Compares $p95$ metric against configured SLA budget.
* **Output:**
  * Latency distribution report; assertion failure if $p95 > \text{threshold}$.
* **Validations:**
  * Distinguishes client-side network connection delays from server-side TTFB (Time to First Byte).

#### FR-007: The system must synchronize OpenAPI schemas and generate TypeScript type definitions
* **Related to:** `EPIC-AQE-002`, US 2.3
* **Input:**
  * OpenAPI 3.0 / 3.1 specification (local path or remote URL).
  * Execution command: `bun run api:sync`.
* **Processing:**
  1. Downloads/reads specification file.
  2. Parses endpoints, request bodies, and response schemas.
  3. Generates strongly typed TypeScript type definitions inside `tests/schemas/`.
* **Output:**
  * Synchronized type files (`*.types.ts`) with zero manual editing.
* **Validations:**
  * Validates OpenAPI syntax integrity before overwriting local schema files.

#### FR-008: The system must provide reusable HTTP client primitives in `ApiBase`
* **Related to:** `EPIC-AQE-002`, US 2.4
* **Input:**
  * HTTP method, endpoint path, query parameters, headers, and request body.
* **Processing:**
  1. Automatically attaches environment-specific base URL and authorization bearer tokens.
  2. Dispatches request via Playwright `APIRequestContext`.
  3. Measures latency and logs request/response metadata.
* **Output:**
  * Strongly-typed `ApiResponse<T>` object containing status, headers, body, and latency.
* **Validations:**
  * Fails fast on unexpected HTTP 5xx responses; surfaces readable error if response is not JSON.

---

### EPIC-AQE-003: Layer 3: AI Semantic Evaluation & RAG Faithfulness Harness

#### FR-009: The system must compute vector embedding cosine similarity between generated responses and ground truth
* **Related to:** `EPIC-AQE-003`, US 3.1
* **Input:**
  * Generated text string (from LLM/RAG endpoint).
  * Ground-truth reference string.
  * Embedding model (local fast embeddings or API).
* **Processing:**
  1. Encodes both text strings into normalized dense vector embeddings $\vec{u}, \vec{v}$.
  2. Computes cosine similarity: $\cos(\theta) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\|_2 \|\vec{v}\|_2}$.
  3. Evaluates if $\cos(\theta) \ge \text{AI\_SIMILARITY\_THRESHOLD}$ (default: $0.80$).
* **Output:**
  * Cosine similarity score $\in [0.0, 1.0]$; test pass/fail assertion.
* **Validations:**
  * Input strings must be non-empty; vector dimensionality must match.

#### FR-010: The system must evaluate Context Faithfulness to detect and block hallucinated statements
* **Related to:** `EPIC-AQE-003`, US 3.2
* **Input:**
  * Generated response text.
  * Retrieved context chunks (array of reference text strings).
* **Processing:**
  1. Segments response text into atomic propositional statements.
  2. Checks each statement for factual entailment against retrieved context.
  3. Calculates faithfulness score: $\frac{\text{Supported Claims}}{\text{Total Claims}}$.
  4. Evaluates if score $\ge \text{AI\_FAITHFULNESS\_THRESHOLD}$ (default: $0.85$).
* **Output:**
  * Faithfulness ratio $\in [0.0, 1.0]$; list of hallucinated claims; assertion failure if score $< 0.85$.
* **Validations:**
  * Fails build if generated response makes factual commitments unsupported by context documents.

#### FR-011: The system must manage a curated synthetic regression benchmark dataset for AI evaluation
* **Related to:** `EPIC-AQE-003`, US 3.3
* **Input:**
  * Benchmark test suite file (`tests/ai_eval/data/benchmark_cases.json`).
* **Processing:**
  1. Loads parameterized test cases with queries, context chunks, and expected baselines.
  2. Executes queries against target AI pipeline under test.
  3. Evaluates similarity and faithfulness metrics across all benchmark cases.
* **Output:**
  * Pytest summary table displaying per-case similarity and faithfulness scores.
* **Validations:**
  * Dataset must contain standard positive test cases, boundary queries, and adversarial prompt tests.

#### FR-012: The system must support configurable semantic evaluation thresholds via environment variables
* **Related to:** `EPIC-AQE-003`, US 3.4
* **Input:**
  * Environment variables: `AI_SIMILARITY_THRESHOLD`, `AI_FAITHFULNESS_THRESHOLD`.
* **Processing:**
  1. Reads environment variables at test runner initialization.
  2. Applies values as global assertion gates across Layer 3 tests.
* **Output:**
  * Active threshold values recorded in test execution metadata.
* **Validations:**
  * Float values must be strictly within range $(0.0, 1.0]$.

---

### EPIC-AQE-004: Serverless CI/CD Quality Gate (GitHub Actions)

#### FR-013: The system must orchestrate parallel 3-layer execution on ephemeral GitHub Actions runners
* **Related to:** `EPIC-AQE-004`, US 4.1
* **Input:**
  * GitHub event (`push`, `pull_request`, or `workflow_dispatch`).
* **Processing:**
  1. Triggers `.github/workflows/ci.yml`.
  2. Dispatches parallel matrix jobs on `ubuntu-latest`:
     * `layer1-ui`: Playwright multi-browser test execution.
     * `layer2-api`: OpenAPI schema and SLA latency checks.
     * `layer3-ai`: Python Pytest semantic evaluation suite.
  3. Gathers execution artifacts and reports in a downstream aggregation job.
* **Output:**
  * Global CI workflow status (green/red) with $0 dedicated server spend.
* **Validations:**
  * Enforces maximum job timeout of 10 minutes per layer.

#### FR-014: The system must cache dependencies and browser binaries to optimize CI execution duration
* **Related to:** `EPIC-AQE-004`, US 4.2
* **Input:**
  * Lockfiles: `bun.lock`, `requirements.txt`.
* **Processing:**
  1. Checks GitHub Actions cache for matching cache keys.
  2. Restores `~/.bun/install/cache`, `~/.cache/ms-playwright`, and Python virtual environment.
  3. Updates cache upon lockfile modification.
* **Output:**
  * Cold-start dependency installation reduced to $< 30$ seconds; pipeline completes in $< 5$ minutes.
* **Validations:**
  * Automatically invalidates cache when dependencies change.

#### FR-015: The system must execute scheduled synthetic health checks via GitHub Actions cron
* **Related to:** `EPIC-AQE-004`, US 4.3
* **Input:**
  * Scheduled cron trigger: `0 2 * * *` (02:00 UTC daily).
* **Processing:**
  1. Wakes up ephemeral GitHub Actions runner.
  2. Runs Layer 2 (API) and critical Layer 1 (UI) monitors against live endpoints.
  3. Publishes health status to GitHub Pages.
* **Output:**
  * Continuous synthetic monitoring verification with zero server hosting costs.
* **Validations:**
  * Cancels redundant concurrent runs if previous cron job is still executing.

#### FR-016: The system must enforce GitHub branch protection rules requiring Quality Gate approval
* **Related to:** `EPIC-AQE-004`, US 4.4
* **Input:**
  * Status check results from GitHub Actions jobs.
* **Processing:**
  1. Submits status check events (`quality-gate/layer1`, `quality-gate/layer2`, `quality-gate/layer3`) to GitHub Commit Status API.
  2. Blocks PR merge if any layer check fails.
* **Output:**
  * Green "Ready to merge" checkmark or red "Merge blocked" state in PR.
* **Validations:**
  * Requires branches to be up to date before merging.

---

### EPIC-AQE-005: Living TestOps Reporting & Showcase (GitHub Pages)

#### FR-017: The system must compile and publish Allure and Playwright HTML reports to GitHub Pages
* **Related to:** `EPIC-AQE-005`, US 5.1
* **Input:**
  * Raw test execution results (`allure-results/`, `playwright-report/`).
* **Processing:**
  1. Consolidates multi-layer results into Allure single-page application.
  2. Deploys compiled static HTML bundle to `gh-pages` branch via GitHub Pages action.
* **Output:**
  * Live report deployed at `https://marttinroman.github.io/autonomous-qa-engine`.
* **Validations:**
  * All static asset paths must be relative; strips private secrets or API keys from reports.

#### FR-018: The system must capture visual screenshots, DOM snapshots, and network HAR traces on test failure
* **Related to:** `EPIC-AQE-005`, US 5.2
* **Input:**
  * Test step failure or assertion error.
* **Processing:**
  1. Captures full-page PNG screenshot of browser viewport.
  2. Records video of user session leading to failure.
  3. Dumps HTTP HAR request/response logs.
  4. Embeds media into Allure report step attachment.
* **Output:**
  * Actionable failure artifacts attached to failed test case in report.
* **Validations:**
  * Generates media artifacts on failure/retry only to optimize artifact storage.

#### FR-019: The system must generate visual AI evaluation metric diffs in test reports
* **Related to:** `EPIC-AQE-005`, US 5.3
* **Input:**
  * Layer 3 Pytest evaluation outputs (faithfulness score, cosine similarity, claim diffs).
* **Processing:**
  1. Formats score comparison tables and highlights unsupported statements.
  2. Generates Markdown / HTML attachments in Allure results.
* **Output:**
  * Visual diff viewer showing ground truth vs. generated text with color-coded faithfulness badges.
* **Validations:**
  * Accurately displays percentage scores against configured threshold boundaries.

#### FR-020: The system must maintain live status badges and showcase links in project documentation
* **Related to:** `EPIC-AQE-005`, US 5.4
* **Input:**
  * GitHub Actions workflow status and GitHub Pages deployment URL.
* **Processing:**
  1. Serves real-time CI status badge in `README.md`.
  2. Links badge directly to live Allure report on GitHub Pages.
* **Output:**
  * Publicly verifiable showcase of production-grade SDET mastery.
* **Validations:**
  * Badges update automatically within 60 seconds of CI pipeline completion.

---

### EPIC-AQE-006: Developer Ergonomics & CLI Tooling

#### FR-021: The system must execute all three verification layers via a unified local command
* **Related to:** `EPIC-AQE-006`, US 6.1
* **Input:**
  * Command line execution: `bun run test:all`.
* **Processing:**
  1. Verifies prerequisites (`bun`, `python3`, `playwright`).
  2. Executes Layer 1 (`bun run test:e2e`), Layer 2 (`bun run test:api`), and Layer 3 (`python -m pytest tests/ai_eval/`).
  3. Aggregates exit codes.
* **Output:**
  * Unified console summary; exit code `0` on success, `1` on any failure.
* **Validations:**
  * Fails with clear diagnostic instructions if required runtimes or dependencies are missing.

#### FR-022: The system must enforce automated code linting and formatting via pre-commit hooks
* **Related to:** `EPIC-AQE-006`, US 6.2
* **Input:**
  * `git commit` invocation.
* **Processing:**
  1. Husky triggers `lint-staged`.
  2. Executes ESLint with `--fix` on TypeScript files.
  3. Executes Prettier on JSON, YAML, and Markdown files.
* **Output:**
  * Clean, formatted code staged into commit; aborts commit if syntax/lint errors cannot be auto-fixed.
* **Validations:**
  * Runs on staged files only; executes in $< 2$ seconds.

#### FR-023: The system must provide multi-environment configuration switching
* **Related to:** `EPIC-AQE-006`, US 6.3
* **Input:**
  * `TEST_ENV` environment variable (`local`, `staging`, `production`) and `.env` files.
* **Processing:**
  1. `TestContext` reads active target environment.
  2. Dynamically sets base URLs, API endpoints, timeouts, and credentials across all test components.
* **Output:**
  * Test suite routes requests to target environment without altering test logic.
* **Validations:**
  * Fails fast on startup if required environment variables for the selected target are missing.
