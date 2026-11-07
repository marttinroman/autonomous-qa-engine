import type { Server } from 'bun';

export interface MockServerInstance {
  port: number
  url: string
  stop: () => Promise<void> | void
}

let activeServer: Server | null = null;

const VALID_TOKEN = 'mock_bearer_jwt_token_for_local_testing';

function makeErrorResponse(code: string, message: string, details?: string[]) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}

// ============================================================================
// HTML Page Templates (Self-Contained SUT Web Showcase)
// ============================================================================

function renderLoginPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login — Autonomous QA & AI-TestOps Engine</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1.5rem; }
    .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2.5rem; width: 100%; max-width: 440px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: #38bdf8; }
    p.sub { font-size: 0.875rem; color: #94a3b8; margin-bottom: 2rem; }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: #cbd5e1; }
    input { width: 100%; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #475569; background-color: #0f172a; color: #f8fafc; font-size: 0.95rem; }
    input:focus { outline: none; border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2); }
    button { width: 100%; padding: 0.875rem; border-radius: 8px; border: none; background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff; font-weight: 600; font-size: 1rem; cursor: pointer; transition: opacity 0.2s; margin-top: 0.5rem; }
    button:hover { opacity: 0.9; }
    .error-box { background-color: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 0.75rem; border-radius: 6px; font-size: 0.875rem; margin-bottom: 1.25rem; display: none; }
  </style>
</head>
<body>
  <div class="card" data-testid="login-card">
    <h1>Autonomous QA Engine</h1>
    <p class="sub">Continuous Quality Gate Authentication</p>
    <div id="auth-error" data-testid="auth-error" class="error-box"></div>
    <form id="login-form">
      <div class="form-group">
        <label for="email">SDET / Tester Email</label>
        <input type="email" id="email" data-testid="email-input" placeholder="alex.sdet@example.com" required value="alex.sdet@example.com" />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" data-testid="password-input" placeholder="••••••••••••" required value="SecurePassword123!" />
      </div>
      <button type="submit" data-testid="login-submit">Sign In to Quality Gate</button>
    </form>
  </div>
  <script>
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errBox = document.getElementById('auth-error');
      errBox.style.display = 'none';

      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          sessionStorage.setItem('token', data.accessToken);
          sessionStorage.setItem('email', data.user.email);
          window.location.href = '/dashboard';
        } else {
          errBox.textContent = data.error?.message || 'Authentication failed. Please verify credentials.';
          errBox.style.display = 'block';
        }
      } catch (err) {
        errBox.textContent = 'Server connection error. Ensure mockServer is running.';
        errBox.style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
}

function renderDashboardPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Quality Gate Dashboard — Autonomous QA Engine</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #0f172a; color: #f8fafc; min-height: 100vh; padding: 2rem; }
    .container { max-width: 1024px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid #334155; }
    .brand h1 { font-size: 1.5rem; font-weight: 700; color: #38bdf8; }
    .brand p { font-size: 0.875rem; color: #94a3b8; }
    .user-nav { display: flex; align-items: center; gap: 1rem; }
    .badge { background-color: #1e293b; border: 1px solid #334155; padding: 0.4rem 0.8rem; border-radius: 9999px; font-size: 0.85rem; color: #38bdf8; font-weight: 500; }
    .btn-outline { background: transparent; border: 1px solid #475569; color: #cbd5e1; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; text-decoration: none; font-size: 0.875rem; }
    .btn-outline:hover { background-color: #1e293b; color: #ffffff; }
    .banner { background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 95, 70, 0.3)); border: 1px solid #10b981; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; }
    .banner-title { font-size: 1.25rem; font-weight: 700; color: #34d399; margin-bottom: 0.25rem; }
    .banner-desc { font-size: 0.875rem; color: #a7f3d0; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; }
    .card-tag { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8; margin-bottom: 0.5rem; }
    .card-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; }
    .status-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; background-color: rgba(16, 185, 129, 0.2); color: #34d399; }
    .metrics { margin-top: 1rem; font-size: 0.85rem; color: #94a3b8; line-height: 1.5; }
    .nav-card { background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px dashed #38bdf8; border-radius: 12px; padding: 2rem; text-align: center; }
    .btn-primary { background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff; padding: 0.75rem 1.5rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <h1>Autonomous QA & AI-TestOps Engine</h1>
        <p>Continuous Quality Gate Control Plane</p>
      </div>
      <div class="user-nav">
        <span class="badge" data-testid="user-profile-badge">alex.sdet@example.com (sdet)</span>
        <button id="logout-btn" data-testid="logout-button" class="btn-outline">Log Out</button>
      </div>
    </header>

    <div class="banner" data-testid="quality-gate-banner">
      <div>
        <div class="banner-title">Quality Gate: ALL 3 LAYERS PASSING (100% Green)</div>
        <div class="banner-desc">Zero regressions detected across UI, REST APIs, and Semantic AI Embeddings</div>
      </div>
      <span class="status-pill">PASSED</span>
    </div>

    <div class="cards-grid">
      <div class="card" data-testid="layer1-status">
        <div class="card-tag">Layer 1 Validation</div>
        <div class="card-title">Web UI & Cross-Browser Automation</div>
        <span class="status-pill">PASSED</span>
        <div class="metrics">
          • Multi-browser: Chromium, Firefox, WebKit<br />
          • Auto-waiting POM Locators<br />
          • Zero flaky static sleeps
        </div>
      </div>

      <div class="card" data-testid="layer2-status">
        <div class="card-tag">Layer 2 Validation</div>
        <div class="card-title">REST API Contracts & SLA Guard</div>
        <span class="status-pill">PASSED</span>
        <div class="metrics">
          • Strict OpenAPI & JSON Schema Validation<br />
          • p95 Latency: 14.2ms (SLA Budget: &lt; 500ms)<br />
          • Zero contract drift detected
        </div>
      </div>

      <div class="card" data-testid="layer3-status">
        <div class="card-tag">Layer 3 Validation</div>
        <div class="card-title">AI Semantic Evaluation (RAG Harness)</div>
        <span class="status-pill">PASSED</span>
        <div class="metrics">
          • Cosine Similarity: 0.94 (Threshold: &ge; 0.80)<br />
          • Context Faithfulness: 0.98 (Threshold: &ge; 0.85)<br />
          • Zero hallucinated claims detected
        </div>
      </div>
    </div>

    <div class="nav-card">
      <h2>Explore Interactive AI Evaluation</h2>
      <p style="color: #94a3b8; margin-top: 0.5rem;">Test live RAG retrieval and evaluate answer faithfulness in real time.</p>
      <a href="/ai-testing" data-testid="nav-ai-testing" class="btn-primary">Launch AI Evaluation Console</a>
    </div>
  </div>

  <script>
    document.getElementById('logout-btn').addEventListener('click', () => {
      sessionStorage.clear();
      window.location.href = '/login';
    });
  </script>
</body>
</html>`;
}

function renderAiTestingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AI Semantic Evaluation Console — Autonomous QA Engine</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #0f172a; color: #f8fafc; min-height: 100vh; padding: 2rem; }
    .container { max-width: 900px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #334155; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #38bdf8; }
    .btn-back { background: transparent; border: 1px solid #475569; color: #cbd5e1; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; text-decoration: none; font-size: 0.875rem; }
    .panel { background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.75rem; margin-bottom: 1.5rem; }
    label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: #cbd5e1; }
    textarea { width: 100%; height: 90px; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #475569; background-color: #0f172a; color: #f8fafc; font-size: 0.95rem; resize: vertical; margin-bottom: 1rem; }
    .btn-query { background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff; padding: 0.75rem 1.5rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; }
    .btn-eval { background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; padding: 0.65rem 1.25rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; margin-top: 1rem; }
    .result-box { margin-top: 1.25rem; background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 1rem; }
    .result-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.5rem; }
    .metrics-panel { display: none; margin-top: 1.25rem; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 8px; padding: 1.25rem; }
    .metrics-row { display: flex; gap: 2rem; margin-bottom: 0.75rem; }
    .metric-item { font-size: 0.95rem; font-weight: 600; color: #34d399; }
    .eval-badge { display: inline-block; padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 700; font-size: 0.85rem; background-color: #10b981; color: #0f172a; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Layer 3: AI Semantic Evaluation Console</h1>
      <a href="/dashboard" data-testid="nav-dashboard" class="btn-back">← Back to Dashboard</a>
    </header>

    <div class="panel">
      <label for="prompt">Conversational Query (RAG Pipeline Test)</label>
      <textarea id="prompt" data-testid="prompt-input">What are the core validation layers of the Autonomous QA Engine?</textarea>
      <button id="btn-submit" data-testid="submit-prompt" class="btn-query">Submit Query to RAG Assistant</button>

      <div id="response-container" style="display: none;">
        <div class="result-box">
          <div class="result-title">Generated Answer</div>
          <div id="ai-answer" data-testid="ai-answer" style="color: #f8fafc; line-height: 1.5;"></div>
        </div>

        <div class="result-box">
          <div class="result-title">Retrieved Grounding Context</div>
          <div id="context-source" data-testid="context-source" style="color: #94a3b8; font-size: 0.875rem;"></div>
        </div>

        <button id="btn-eval" data-testid="evaluate-semantic-btn" class="btn-eval">Execute Semantic Evaluation Check</button>

        <div id="eval-metrics" data-testid="eval-metrics-panel" class="metrics-panel">
          <div class="metrics-row">
            <div id="sim-score" data-testid="similarity-score" class="metric-item">Cosine Similarity: 0.93</div>
            <div id="faith-score" data-testid="faithfulness-score" class="metric-item">Context Faithfulness: 0.97</div>
          </div>
          <div id="eval-badge" data-testid="semantic-eval-badge" class="eval-badge">Status: PASSED (Zero Hallucinations Detected)</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    document.getElementById('btn-submit').addEventListener('click', async () => {
      const prompt = document.getElementById('prompt').value;
      const res = await fetch('/api/v1/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (res.ok) {
        document.getElementById('ai-answer').textContent = data.answer;
        document.getElementById('context-source').textContent = data.retrievedContext?.[0]?.text || '';
        document.getElementById('response-container').style.display = 'block';
      }
    });

    document.getElementById('btn-eval').addEventListener('click', async () => {
      const prompt = document.getElementById('prompt').value;
      const answer = document.getElementById('ai-answer').textContent;
      const context = document.getElementById('context-source').textContent;

      const res = await fetch('/api/v1/ai/evaluate-semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          generatedAnswer: answer,
          groundTruthAnswer: answer,
          retrievedContext: [context]
        })
      });
      const data = await res.json();
      if (res.ok) {
        document.getElementById('sim-score').textContent = 'Cosine Similarity: ' + data.similarityScore;
        document.getElementById('faith-score').textContent = 'Context Faithfulness: ' + data.faithfulnessScore;
        const badge = document.getElementById('eval-badge');
        badge.textContent = data.passed ? 'Status: PASSED (Zero Hallucinations Detected)' : 'Status: FAILED';
        document.getElementById('eval-metrics').style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
}

// ============================================================================
// Request Dispatcher
// ============================================================================

export function createMockHandler() {
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method.toUpperCase();

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ------------------------------------------------------------------------
    // Web UI Routes (HTML)
    // ------------------------------------------------------------------------
    if (method === 'GET') {
      if (path === '/' || path === '/index.html') {
        return new Response(null, {
          status: 302,
          headers: { Location: '/login' },
        });
      }

      if (path === '/login') {
        return new Response(renderLoginPage(), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      if (path === '/dashboard') {
        return new Response(renderDashboardPage(), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      if (path === '/ai-testing') {
        return new Response(renderAiTestingPage(), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    }

    // ------------------------------------------------------------------------
    // 1. GET /api/v1/health
    // ------------------------------------------------------------------------
    if (path === '/api/v1/health' && method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptimeSeconds: Math.floor(process.uptime()),
          latencyMs: 14.2,
          database: {
            connected: true,
            responseTimeMs: 3.5,
          },
          version: '1.0.0',
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    // ------------------------------------------------------------------------
    // 2. POST /api/v1/auth/login
    // ------------------------------------------------------------------------
    if (path === '/api/v1/auth/login' && method === 'POST') {
      try {
        const body = (await req.json()) as { email?: string, password?: string };
        if (!body.email || !body.password) {
          return new Response(
            JSON.stringify(
              makeErrorResponse(
                'VALIDATION_ERROR',
                'Missing required credentials: email and password',
              ),
            ),
            { status: 400, headers: corsHeaders },
          );
        }

        if (
          body.password !== 'SecurePassword123!'
          || body.password === 'wrong'
          || body.password === 'invalid'
        ) {
          return new Response(
            JSON.stringify(
              makeErrorResponse(
                'AUTH_INVALID_CREDENTIALS',
                'Invalid email or password credentials supplied',
              ),
            ),
            { status: 401, headers: corsHeaders },
          );
        }

        return new Response(
          JSON.stringify({
            accessToken: VALID_TOKEN,
            tokenType: 'Bearer',
            expiresIn: 3600,
            user: {
              id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
              email: body.email,
              role: 'sdet',
            },
          }),
          { status: 200, headers: corsHeaders },
        );
      }
      catch {
        return new Response(
          JSON.stringify(
            makeErrorResponse(
              'INVALID_JSON',
              'Malformed request JSON payload',
            ),
          ),
          { status: 400, headers: corsHeaders },
        );
      }
    }

    // ------------------------------------------------------------------------
    // 3. GET /api/v1/auth/profile
    // ------------------------------------------------------------------------
    if (path === '/api/v1/auth/profile' && method === 'GET') {
      const authHeader = req.headers.get('Authorization') || '';
      if (!authHeader.startsWith('Bearer ') || authHeader.slice(7) !== VALID_TOKEN) {
        return new Response(
          JSON.stringify(
            makeErrorResponse(
              'AUTH_UNAUTHORIZED',
              'Missing, expired, or invalid Bearer authentication token',
            ),
          ),
          { status: 401, headers: corsHeaders },
        );
      }

      return new Response(
        JSON.stringify({
          id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
          email: 'alex.sdet@example.com',
          fullName: 'Alex Rivera',
          role: 'sdet',
          organization: 'Autonomous QA Org',
          createdAt: '2026-01-15T08:00:00Z',
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    // ------------------------------------------------------------------------
    // 4. POST /api/v1/ai/query
    // ------------------------------------------------------------------------
    if (path === '/api/v1/ai/query' && method === 'POST') {
      try {
        const body = (await req.json()) as { prompt?: string };
        if (!body.prompt || body.prompt.trim().length < 3) {
          return new Response(
            JSON.stringify(
              makeErrorResponse(
                'VALIDATION_ERROR',
                'Prompt must be at least 3 characters long',
              ),
            ),
            { status: 400, headers: corsHeaders },
          );
        }

        return new Response(
          JSON.stringify({
            queryId: 'qry_12345678-abcd-ef01-2345-6789abcdef01',
            prompt: body.prompt,
            answer:
              'Autonomous QA Engine continuously validates Layer 1 (Web UI), Layer 2 (REST API), and Layer 3 (LLM Semantic Evaluation) across every pull request build.',
            retrievedContext: [
              {
                chunkId: 'chk_001',
                text: 'Autonomous QA Engine Architecture specification: Comprehensive 3-layer automated testing matrix.',
                score: 0.94,
                source: 'docs/architecture/executive-summary.md',
              },
            ],
            latencyMs: 38.6,
            tokensUsed: 124,
          }),
          { status: 200, headers: corsHeaders },
        );
      }
      catch {
        return new Response(
          JSON.stringify(
            makeErrorResponse(
              'INVALID_JSON',
              'Malformed request JSON payload',
            ),
          ),
          { status: 400, headers: corsHeaders },
        );
      }
    }

    // ------------------------------------------------------------------------
    // 5. POST /api/v1/ai/evaluate-semantic
    // ------------------------------------------------------------------------
    if (path === '/api/v1/ai/evaluate-semantic' && method === 'POST') {
      try {
        const body = (await req.json()) as {
          queryId?: string
          prompt?: string
          generatedAnswer?: string
          groundTruthAnswer?: string
          retrievedContext?: string[]
        };

        const isHallucination = body.generatedAnswer?.toLowerCase().includes('hallucination_probe');
        const simScore = isHallucination ? 0.42 : 0.93;
        const faithScore = isHallucination ? 0.38 : 0.97;
        const passed = !isHallucination;

        return new Response(
          JSON.stringify({
            evaluationId: 'eval_8899aabb-ccdd-eeff-0011-223344556677',
            queryId: body.queryId || 'qry_12345678-abcd-ef01-2345-6789abcdef01',
            similarityScore: simScore,
            faithfulnessScore: faithScore,
            passed,
            hallucinationDetected: isHallucination,
            unsupportedClaims: isHallucination
              ? ['Claim not grounded in retrieved context chunks']
              : [],
            evaluationDurationMs: 22.4,
          }),
          { status: 200, headers: corsHeaders },
        );
      }
      catch {
        return new Response(
          JSON.stringify(
            makeErrorResponse(
              'INVALID_JSON',
              'Malformed request JSON payload',
            ),
          ),
          { status: 400, headers: corsHeaders },
        );
      }
    }

    // Default 404 Route Not Found
    return new Response(
      JSON.stringify(
        makeErrorResponse(
          'ROUTE_NOT_FOUND',
          `Endpoint ${method} ${path} was not found on this server`,
        ),
      ),
      { status: 404, headers: corsHeaders },
    );
  };
}

/**
 * Starts the mock SUT server programmatically on the specified port.
 */
export async function startMockServer(port: number = 3000): Promise<MockServerInstance> {
  if (activeServer) {
    return {
      port: activeServer.port,
      url: `http://localhost:${activeServer.port}`,
      stop: stopMockServer,
    };
  }

  const handler = createMockHandler();
  activeServer = Bun.serve({
    port,
    fetch: handler,
  });

  return {
    port: activeServer.port,
    url: `http://localhost:${activeServer.port}`,
    stop: stopMockServer,
  };
}

/**
 * Stops the mock SUT server if running.
 */
export function stopMockServer(): void {
  if (activeServer) {
    activeServer.stop(true);
    activeServer = null;
  }
}

// If invoked directly from terminal: bun tests/server/mockServer.ts
if (import.meta.main) {
  const port = Number(process.env.PORT || 3000);
  void startMockServer(port).then((instance) => {
    console.log(`[Mock SUT Server] Running at ${instance.url}/login`);
  });
}
