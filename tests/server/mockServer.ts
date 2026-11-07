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

        if (body.password === 'wrong' || body.password === 'invalid') {
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
              'Autonomous QA Engine continuously validates web interfaces, REST APIs, and LLM semantic embeddings across every pull request build.',
            retrievedContext: [
              {
                chunkId: 'chk_001',
                text: 'Autonomous QA Engine executes automated Playwright tests and Python RAG evaluations on pull requests.',
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
    console.log(`[Mock SUT Server] Running at ${instance.url}/api/v1/health`);
  });
}
