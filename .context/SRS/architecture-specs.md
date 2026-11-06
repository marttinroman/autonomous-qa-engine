# SRS: Architecture Specifications - Autonomous QA & AI-TestOps Engine

> **Phase:** 2 - Architecture  
> **Document:** Software Requirements Specification (SRS) — Architecture Specifications  
> **Status:** Approved / Baseline  
> **Project Key:** `AQE`  

---

## 1. System Architecture (C4 Model)

The **Autonomous QA & AI-TestOps Engine** is engineered as an autonomous, serverless Quality Gate designed to run on ephemeral GitHub Actions runners and developer workstations. It evaluates the System Under Test (SUT) across three independent validation layers without requiring persistent cloud infrastructure.

### C4 Level 1: System Context Diagram

```mermaid
flowchart TD
    subgraph Actors ["Users & Triggers"]
        Dev["Full-Stack / AI Engineer<br/>(Marcus)"]
        SDET["Senior SDET<br/>(Alex)"]
        Lead["VP of Engineering<br/>(Sofia)"]
        Cron["Scheduled Trigger<br/>(Daily Cron / Webhook)"]
    end

    subgraph Engine ["Autonomous QA & AI-TestOps Engine"]
        Gate["Continuous Quality Gate<br/>(3-Layer Verification)"]
    end

    subgraph SUT ["System Under Test (SUT)"]
        UI["Web Frontend Application<br/>(React / Next.js / Vue)"]
        API["Backend REST API<br/>(Microservices / Gateway)"]
        RAG["Generative AI & RAG Pipeline<br/>(LLM / Vector DB)"]
    end

    subgraph Outputs ["Observability & Reporting ($0 Infra)"]
        Report["Living TestOps HTML Dashboard<br/>(Allure / Playwright)"]
        Pages["GitHub Pages Edge CDN<br/>(Public Showcase)"]
        GitCheck["GitHub Commit Status API<br/>(PR Quality Gate)"]
    end

    Dev -->|git push / open PR| Gate
    SDET -->|local execution / test authoring| Gate
    Cron -->|scheduled synthetic check| Gate

    Gate -->|Layer 1: Browser POM automation| UI
    Gate -->|Layer 2: OpenAPI & latency validation| API
    Gate -->|Layer 3: Cosine & faithfulness scoring| RAG

    Gate -->|publishes results| Report
    Report -->|hosted on| Pages
    Gate -->|blocks or approves PR| GitCheck
    Lead -->|reviews live health metrics| Pages
```

---

### C4 Level 2: Container & Engine Architecture

The engine is structured around the **KATA testing pattern**, isolating concerns into distinct architectural tiers to ensure maintainability, flake-resistance, and zero inter-test state leakage.

```mermaid
flowchart TD
    subgraph CI ["Serverless CI / Local Environment"]
        Trigger["GitHub Actions Workflow / Bun CLI"]

        subgraph KATA ["KATA Architecture Framework"]
            L1["Layer 1: TestContext<br/>• Configuration bootstrap<br/>• Dynamic .env loader<br/>• Faker synthetic data generators"]
            
            subgraph L2 ["Layer 2: Base Primitives"]
                UIBase["UiBase<br/>• Smart auto-waiting locators<br/>• Viewport & browser helpers<br/>• Zero static sleeps"]
                APIBase["ApiBase<br/>• HTTP client wrappers<br/>• Bearer auth injection<br/>• Latency SLA timer"]
            end

            subgraph L3 ["Layer 3: Domain Components (ATCs)"]
                POM["Page Objects<br/>(e.g., DashboardPage, LoginPage)"]
                APIComp["API Clients<br/>(e.g., AuthApi, UserProfileApi)"]
                AIEval["AI Evaluation Harness<br/>(Pytest + Dense Vector Embeddings)"]
            end

            subgraph L4 ["Layer 4: Unified Test Fixtures"]
                Fixture["TestFixture<br/>• Isolated dependency injection<br/>• Lazy browser context allocation"]
            end
        end

        subgraph SpecFiles ["Test Specifications"]
            E2ESpec["tests/e2e/*.spec.ts"]
            ApiSpec["tests/integration/*.spec.ts"]
            AISpec["tests/ai_eval/test_*.py"]
        end

        subgraph Reporters ["Reporting Engine"]
            Allure["Allure TestOps Compiler"]
            PWHtml["Playwright HTML Reporter"]
        end
    end

    Trigger --> KATA
    L1 --> UIBase
    L1 --> APIBase
    UIBase --> POM
    APIBase --> APIComp
    L1 --> AIEval

    POM --> Fixture
    APIComp --> Fixture
    Fixture --> SpecFiles
    AIEval --> AISpec

    SpecFiles --> Reporters
    AISpec --> Reporters
```

---

## 2. TestOps Data & Entity Model (ERD)

The engine models test execution, benchmark baselines, latency telemetry, and semantic metrics as structured relational entities stored as JSON artifacts and aggregated by Allure:

```mermaid
erDiagram
    TEST_RUN ||--o{ LAYER_EXECUTION : contains
    TEST_RUN {
        string run_id PK
        string git_commit_sha
        string branch_name
        timestamp start_time
        timestamp end_time
        string status
        string environment
    }

    LAYER_EXECUTION ||--o{ TEST_CASE : executes
    LAYER_EXECUTION {
        string layer_id PK
        string run_id FK
        string layer_type "UI | API | AI_EVAL"
        int duration_ms
        int total_count
        int passed_count
        int failed_count
    }

    TEST_CASE ||--o{ ARTIFACT : attaches
    TEST_CASE {
        string test_id PK
        string layer_id FK
        string test_name
        string suite_name
        string status "PASSED | FAILED | RETRIED"
        int duration_ms
        string error_message
    }

    TEST_CASE ||--o| API_METRIC : records
    API_METRIC {
        string metric_id PK
        string test_id FK
        string endpoint
        string http_method
        int status_code
        float latency_ms
        boolean schema_valid
        string schema_diff
    }

    TEST_CASE ||--o| SEMANTIC_EVALUATION : scores
    SEMANTIC_EVALUATION {
        string eval_id PK
        string test_id FK
        string prompt_id
        float cosine_similarity
        float faithfulness_score
        boolean passed_threshold
        string unsupported_claims
    }

    BENCHMARK_CASE ||--o{ SEMANTIC_EVALUATION : evaluates
    BENCHMARK_CASE {
        string benchmark_id PK
        string query
        string retrieved_context
        string ground_truth_answer
        float min_similarity_threshold
        float min_faithfulness_threshold
    }

    ARTIFACT {
        string artifact_id PK
        string test_id FK
        string artifact_type "SCREENSHOT | VIDEO | HAR | TRACE"
        string file_path
        int size_bytes
    }
```

---

## 3. Technology Stack Justification

| Component | Selected Technology | Architectural Advantages | Trade-offs & Mitigations |
| :--- | :--- | :--- | :--- |
| **Core UI Automation** | **Playwright (TypeScript)** | • Auto-waiting eliminates race conditions without `waitForTimeout`<br/>• Native Chromium, Firefox, WebKit execution<br/>• Built-in tracing, network HAR capture, and video recording | • Requires browser binary downloads (`~400MB`); mitigated by GitHub Actions binary caching. |
| **Runtime & Package Manager** | **Bun (v1.1+)** | • $3\times$ faster startup and script execution than Node.js<br/>• Native TypeScript execution without transpile step<br/>• Rapid dependency installation ($< 10\text{s}$) | • Node.js compatibility edge cases; mitigated by strictly avoiding non-standard Bun APIs in shared test code. |
| **API Contract Validation** | **Ajv / JSON Schema** | • Validates OpenAPI 3.0/3.1 specs against live payloads in $< 5\text{ms}$<br/>• Strict schema checking flags unexpected properties<br/>• Automatic TypeScript type generation via `bun run api:sync` | • Requires maintaining schema synchronicity; mitigated by automated OpenAPI sync script. |
| **AI Semantic Evaluation** | **Python 3.11+ & Pytest** | • Native access to high-performance vector math libraries (`numpy`, `scikit-learn`)<br/>• Extensive RAG evaluation ecosystem<br/>• Simple, readable parameterized test cases | • Introduces a dual-language repository (TypeScript + Python); mitigated by unified CLI execution (`bun run test:all`). |
| **Vector Embeddings** | **Fast Dense Embeddings (Local/API)** | • High-precision vector cosine similarity scoring ($[-1, 1]$)<br/>• Fast computation ($< 50\text{ms}$ per test pair)<br/>• Deterministic outputs under fixed seeds | • Embedding API rate limits or latency; mitigated by using lightweight cached models for CI runs. |
| **CI/CD Infrastructure** | **GitHub Actions** | • **$0.00 fixed infrastructure cost** on ephemeral Linux VMs<br/>• Native GitHub event triggers (`push`, `pull_request`, `cron`)<br/>• Out-of-the-box parallel matrix job spawning | • Standard runner CPU limits (2 vCPUs); mitigated by splitting layers across parallel matrix jobs. |
| **Living TestOps Showcase** | **GitHub Pages Edge CDN** | • $0 hosting spend with instant global distribution<br/>• Direct living URL embedded in `README.md`<br/>• Public visibility for stakeholders without login barriers | • Static hosting only (no dynamic server backend); mitigated by compiling rich static single-page apps (Allure). |
| **Visual Reporting** | **Allure TestOps / HTML** | • Rich interactive timelines, screenshots, and HAR attachments<br/>• Multi-language result aggregation (TypeScript + Python)<br/>• Clear visual diffs for AI faithfulness scores | • Additional compilation step; completed in $< 30$ seconds in the CI aggregation job. |

---

## 4. Execution & Data Flow Architecture

### Flow 1: 3-Layer Parallel CI/CD Quality Gate Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / Git Trigger
    participant GH as GitHub Repo
    participant Actions as GitHub Actions (Matrix)
    participant L1 as Layer 1: Playwright UI
    participant L2 as Layer 2: API Contract
    participant L3 as Layer 3: AI Semantic
    participant Report as Allure Reporter
    participant CDN as GitHub Pages

    Dev->>GH: Open Pull Request
    GH->>Actions: Trigger `.github/workflows/ci.yml`
    
    par Parallel Matrix Execution
        Actions->>L1: Run E2E tests (Chromium, Firefox, WebKit)
        L1-->>Actions: Layer 1 results (Screenshots, traces)
    and
        Actions->>L2: Validate OpenAPI schemas & p95 latency
        L2-->>Actions: Layer 2 results (HAR logs, SLA metrics)
    and
        Actions->>L3: Compute cosine similarity & context faithfulness
        L3-->>Actions: Layer 3 results (Semantic score diffs)
    end

    Actions->>Report: Consolidate multi-layer JSON artifacts
    Report->>Report: Compile static Allure single-page application
    Report->>CDN: Deploy bundle to `gh-pages` branch
    Actions-->>GH: Report status check: ALL LAYERS PASSED ✅
    GH-->>Dev: PR approved for merge
```

---

### Flow 2: Layer 3 RAG Semantic Evaluation & Faithfulness Fencing

```mermaid
sequenceDiagram
    autonumber
    participant Harness as Pytest Test Runner
    participant Benchmark as Benchmark Dataset
    participant Embedding as Embedding Engine
    participant Scorer as Faithfulness Evaluator

    Harness->>Benchmark: Load test query, context chunks, and ground truth
    Harness->>Embedding: Vectorize generated response & ground truth
    Embedding-->>Harness: Return normalized dense vectors (u, v)
    Harness->>Harness: Compute Cosine Similarity: dot(u, v) / (||u|| * ||v||)
    
    Harness->>Scorer: Deconstruct response into atomic statements
    loop For each atomic statement
        Scorer->>Scorer: Check entailment against retrieved context chunks
    end
    Scorer-->>Harness: Return Faithfulness Ratio: (supported claims / total claims)

    alt Both metrics exceed thresholds (Similarity >= 0.80, Faithfulness >= 0.85)
        Harness-->>Harness: Test PASSED ✅
    else Any threshold breached
        Harness-->>Harness: Test FAILED ❌ (Attach hallucinated claims diff)
    end
```

---

## 5. Security & Isolation Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   SECURITY & ISOLATION BOUNDARIES                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. EPHEMERAL VM ISOLATION                                       │
│     • GitHub Actions Ubuntu VM provisioned fresh per job         │
│     • Complete disk destruction post-run; zero cross-job leakage │
│                                                                  │
│  2. SECRET SANITIZATION GATEWAY                                  │
│     • Console stdout/stderr regex filter masks all API keys      │
│     • HAR network logs strip Authorization and Cookie headers    │
│     • Allure HTML reports scrub environment variables            │
│                                                                  │
│  3. LEAST-PRIVILEGE PERMISSIONS (GITHUB_TOKEN)                   │
│     • contents: write (strictly for gh-pages deployment branch)  │
│     • statuses: write (strictly for commit status check badges)  │
│     • pull-requests: write (for PR failure summary comments)     │
│     • All other repository permissions set to NONE               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

1. **Secret Masking:** Environment variables containing sensitive credentials (`OPENAI_API_KEY`, `AUTH_TOKEN`) are registered as masked secrets in GitHub Actions. Pre-reporting sanitizers scrub all tokens from network HAR logs, screenshots, and console traces before Allure report generation.
2. **Deterministic Isolation:** Each test case creates its own isolated browser context with distinct storage state and ephemeral faker credentials, guaranteeing that no cookies, local storage, or session tokens persist between tests.
3. **Reproducible AI Environments:** The Python evaluation virtual environment is pinned with exact dependency hashes in `requirements.txt`, preventing supply-chain regressions or mathematical drift in vector operations.
