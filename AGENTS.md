# Project Memory

> **Purpose**: Operational context loaded every AI session.
> **Usage**: AI reads this file automatically at session start.
> **Customize**: Replace `[PLACEHOLDER]` values with your project specifics.
> **Note**: This is the **AI-Driven Project Starter** — a template covering DEV + QA + TAE workflows across 14 fases.

---

## Quick Start

```bash
# Run linting and formatting
bun run lint
bun run format

# Update template from upstream
bun run up

# Sync OpenAPI spec
bun run api:sync

# Xray TMS CLI
bun run xray
```

**Start a Dev Session:**

1. Load: `.prompts/us-dev-workflow.md`
2. Follow the 14-fase workflow (Fases 6-9 for dev)
3. Reference `.context/guidelines/DEV/` for coding standards

**Start a QA Session:**

1. Load: `.prompts/us-qa-workflow.md`
2. Follow Fases 10-12 (Exploratory → Documentation → Automation)
3. Reference `.context/guidelines/QA/` for testing standards

**Write a New Test:**

1. Load: `.context/guidelines/TAE/kata-ai-index.md`
2. Use prompt: `.prompts/fase-12-test-automation/e2e/e2e-coding.md` (E2E)
   or `.prompts/fase-12-test-automation/integration/integration-coding.md` (API)
3. Follow KATA patterns

**Generate/Update Project Documentation:**

```bash
# Use this prompt to regenerate README.md and update CLAUDE.md
@.prompts/project-doc-setup.md
```

---

## Project Identity

> Replace placeholders with your project details.

| Aspect             | Value                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| **Name**           | Autonomous QA & AI-TestOps Engine                                        |
| **Type**           | Automated Quality Gate & AI-TestOps Platform                             |
| **Stack**          | Playwright + TypeScript (FE/API), Python 3.11+ (AI Eval), GitHub Actions |
| **Target Repo**    | .                                                                        |
| **Starter Repo**   | /Users/marttinroman/projects/2026/publics/autonomous-qa-engine           |
| **Test Framework** | Playwright + KATA + Pytest + Allure                                      |

**TL;DR Flow:**

```
[User Action] → [System Process] → [Outcome]
```

---

## Fundamental Rules (Always in Memory)

### TypeScript Patterns

| Pattern        | Rule                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| **Parameters** | Max 2 positional. 3+ → use object parameter                               |
| **Utilities**  | Only agnostic utilities go to `tests/utils/`                              |
| **Locators**   | Inline in ATCs. Extract only if used 2+ times                             |
| **Imports**    | Always use aliases (`@api/`, `@schemas/`, `@utils/`). No relative imports |
| **Types**      | Define interfaces at top of file, after imports                           |
| **Errors**     | Public methods: fail fast. Utilities: silent fail (return null)           |

**DRY - Context Matters:**

- `api/schemas/` = OpenAPI type facades (`@schemas/{domain}.types`)
- `tests/utils/` = Agnostic utilities only (works for API + UI)
- `UiBase` = All Playwright/Page helpers
- `ApiBase` = All HTTP helpers
- `TestContext` = Shared across both (config, faker)

→ **Full details**: `.context/guidelines/TAE/typescript-patterns.md`

### KATA Architecture

```
TestContext (Layer 1) - Config, Faker, utilities
    ↓ extends
ApiBase / UiBase (Layer 2) - HTTP / Playwright helpers
    ↓ extends
YourApi / YourPage (Layer 3) - ATCs live here
    ↓ used by
TestFixture (Layer 4) - Dependency injection
    ↓ used by
Test Files - Orchestrate ATCs
```

**ATC Rules:**

- ATC = Complete test case (mini-flow), NOT single interaction
- ATCs are atomic: don't call other ATCs
- Use Steps module for reusable ATC chains
- Fixed assertions inside ATC, test-level assertions in test file
- Equivalence Partitioning: same output = one parameterized ATC

**Fixture Selection:**
| Test Type | Fixture | Browser? |
|-----------|---------|----------|
| API only | `{ api }` | No (lazy) |
| UI only | `{ ui }` | Yes |
| Hybrid | `{ test }` | Yes |

→ **Full details**: `.context/guidelines/TAE/kata-architecture.md`

### Git Flow

**Branches:**

```
main     ← Production (PRs from staging)
staging  ← Integration (AI commits here)
feature/* ← Task-specific branches
fix/*    ← Bug-fix branches
```

**Commit Prefixes:**
| Prefix | Use |
|--------|-----|
| `feat:` | New functionality |
| `fix:` | Bug correction |
| `test:` | Tests added/modified |
| `docs:` | Documentation only |
| `refactor:` | Code restructuring |
| `chore:` | Maintenance tasks |

**Rules:**

- One commit = one responsibility
- Clear messages (someone should understand without seeing code)
- Push to `main` only after user confirmation
- PRs for ticket work: `feature/TICKET-ID-desc` → staging/main
- NO AI attribution in commit messages

→ **Full details**: `.prompts/git-flow.md`

---

## Context Loading by Task

| Task                    | Load These Files                                                     |
| ----------------------- | -------------------------------------------------------------------- |
| **Develop a Feature**   | `project-dev-guide.md` + `guidelines/DEV/spec-driven-development.md` |
| **Write E2E Test**      | `kata-ai-index.md` + `e2e-testing-patterns.md`                       |
| **Write API Test**      | `kata-ai-index.md` + `api-testing-patterns.md`                       |
| **Write Unit Test**     | `guidelines/DEV/code-standards.md`                                   |
| **Exploratory Testing** | `project-test-guide.md` + `guidelines/QA/exploratory-testing.md`     |
| **Understand System**   | `business-data-map.md` + `PRD/user-journeys.md`                      |
| **Code Review**         | `.prompts/fase-8-code-review/review-pr.md`                           |

**Living Code Examples:**

- API Component: `tests/components/api/` (any `*Api.ts`)
- UI Component: `tests/components/ui/` (any `*Page.ts`)
- Test File: `tests/e2e/` or `tests/integration/`

---

## MCPs Available

| MCP            | When to Use                                |
| -------------- | ------------------------------------------ |
| **Playwright** | E2E testing, UI automation, screenshots    |
| **OpenAPI**    | API endpoint exploration, contract testing |
| **DBHub**      | Database queries, data validation          |
| **Atlassian**  | Jira/Xray test management                  |
| **Context7**   | Official library documentation             |
| **Tavily**     | Web search, troubleshooting                |

**Decision Rule:**

- Context7 for "how to use X" (official docs)
- Tavily for "how to solve X" (community solutions)

---

## CLI Tools

| Script             | Usage                              | Documentation                 |
| ------------------ | ---------------------------------- | ----------------------------- |
| `bun xray`         | TMS sync (import/export/sync)      | `cli/xray/` (self-documented) |
| `bun run api:sync` | Sync OpenAPI spec + generate types | `cli/sync-openapi.ts`         |
| `bun run up`       | Update template from upstream      | `cli/update-template.js`      |
| `bun run lint`     | Lint codebase with ESLint          | `eslint.config.js`            |
| `bun run format`   | Format with Prettier               | `.prettierrc`                 |

**Run `bun <script> --help`** for usage details.

---

## Skills (Claude Code)

> Pre-built skills available in `.claude/skills/`. These are loaded automatically by Claude Code.

| Skill                     | Trigger                  | Description                                                                                                     |
| ------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **playwright-cli**        | `/playwright-cli`        | Browser automation: screenshots, tracing, video recording, session management, request mocking, test generation |
| **xray-cli**              | `/xray-cli`              | Xray Cloud test management: create tests, manage executions, import results, backup/restore                     |
| **frontend-design**       | `/frontend-design`       | Create distinctive, production-grade frontend interfaces with high design quality                               |
| **next-best-practices**   | `/next-best-practices`   | Next.js best practices: file conventions, RSC boundaries, data patterns, metadata, error handling               |
| **next-cache-components** | `/next-cache-components` | Next.js Cache Components: PPR, use cache directive, cacheLife, cacheTag, updateTag                              |
| **next-upgrade**          | `/next-upgrade`          | Upgrade Next.js to latest version following official migration guides and codemods                              |

**Note:** Skills are committed to the repo so anyone who clones the project gets them out of the box. User-specific settings (`.claude/settings.local.json`) are gitignored.

---

## Test Project Structure

```
tests/
├── components/
│   ├── TestContext.ts        # Layer 1: Config + Faker
│   ├── TestFixture.ts        # Layer 4: Unified fixture
│   ├── api/
│   │   ├── ApiBase.ts        # Layer 2: HTTP client
│   │   └── [YourApi.ts]      # Layer 3: Domain components
│   ├── ui/
│   │   ├── UiBase.ts         # Layer 2: Page base
│   │   └── [YourPage.ts]     # Layer 3: Domain components
│   └── steps/                # Reusable step chains (preconditions)
├── e2e/                      # E2E tests
├── integration/              # API tests
└── data/fixtures/            # Test data JSON
```

---

## Critical Test Priorities

| Priority | Flow                                            | Business Impact                             | Status |
| -------- | ----------------------------------------------- | ------------------------------------------- | ------ |
| Critical | AQE-101 to AQE-106 (API Contracts & SLAs)       | Contract drift & SLA latency breach defense | [x]    |
| Critical | AQE-201 to AQE-207 (Web UI & AI Console)        | Authentication, session, and RAG UI flows   | [x]    |
| High     | Layer 3 AI Faithfulness & Similarity Benchmarks | Adversarial hallucination injection fencing | [x]    |

---

## Discovery Progress

| Phase                  | Status | Output Files                                                                       |
| ---------------------- | ------ | ---------------------------------------------------------------------------------- |
| Fase 1: Constitution   | Done   | `idea/*`                                                                           |
| Fase 2: Architecture   | Done   | `PRD/*`, `SRS/*`                                                                   |
| Fase 3: Infrastructure | Done   | `.prompts/fase-3-infrastructure/fase-3-plan.md`, `.github/workflows/ci.yml`        |
| Context Generators     | Done   | `business-data-map`, `api-architecture`, `project-dev-guide`, `project-test-guide` |

---

## Access Configuration

### Configured

- [x] Bun runtime (1.3+)
- [x] ESLint + Prettier
- [x] Husky pre-commit hooks
- [x] GitHub Actions CI/CD workflows
- [x] Playwright multi-browser engine (Chromium, Firefox, WebKit)
- [x] Python 3.11 evaluation harness (.venv + pytest)
- [x] Ajv OpenAPI contract validation
- [x] Allure TestOps reporting & GitHub Pages deployment
- [ ] Atlassian MCP (Jira integration)
- [ ] Database MCP (data validation)

### Pending

- [ ] Staging environment URLs in `.env`
- [ ] Test user credentials in `.env`
- [ ] TMS credentials (Xray)

---

## Testing Decisions

| Aspect        | Decision                                     | Rationale                              |
| ------------- | -------------------------------------------- | -------------------------------------- |
| **Priority**  | 3-Layer Parallel (UI + API + AI)             | Comprehensive Quality Gate coverage    |
| **Browsers**  | Multi-browser (Chromium, Firefox, WebKit)    | Cross-browser compatibility guarantee  |
| **Test Data** | Faker + JSON synthetic benchmark catalog     | Isolated, reproducible data generation |
| **Isolation** | Each test independent with isolated fixtures | Zero cross-test state leakage          |

---

## Known Issues & Blockers

| Issue | Severity | Status                                            |
| ----- | -------- | ------------------------------------------------- |
| None  | LOW      | Resolved (All 3 layers passing locally and in CI) |

---

## Session Log

### 2026-11-06 - Fase 3: Infrastructure Completion

- Track 1: Foundation & Tooling Setup (`68a061c`)
- Track 2: Layer 2 API & Contract Infrastructure (`4ec766e`)
- Track 3: Layer 3 AI Semantic Evaluation & RAG Harness (`bf5688d`)
- Track 4: Layer 1 Web UI Automation & Playwright POM Setup (`aa76e6a`)
- Track 5: Serverless CI/CD & Living Showcase Infrastructure (`d921595`)
- Track 6: Verification, Documentation & Phase 3 Sign-Off
- Result: 39 automated tests passing across 3 layers (100% green); GitHub Actions CI pipeline running with automated Allure reporting deployed to GitHub Pages Edge CDN.

---

## Next Actions

1. **Phase 4: Specification (Product Backlog)**
   - [ ] Execute `.prompts/fase-4-specification/fase-4-backlog-creation.md`
   - [ ] Define comprehensive Epics, User Stories, and ATCs in `.context/PBI/`

---

**Last Updated**: 2026-11-06
**Session Count**: 3
