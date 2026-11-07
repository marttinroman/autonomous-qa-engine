import type { TestContextOptions } from '@fixtures/TestContext';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { TestContext } from '@fixtures/TestContext';
import { request as playwrightRequest } from '@playwright/test';

export interface RequestOptions {
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean>
  timeout?: number
  data?: unknown
}

export interface TimedResponseMeta {
  endpoint: string
  method: string
  status: number
  durationMs: number
  timestamp: string
}

/**
 * Layer 2: API Base Component (KATA Architecture)
 *
 * Provides type-safe HTTP client primitives, Bearer token injection,
 * high-resolution latency timing, and contract-ready response wrappers.
 */
export class ApiBase extends TestContext {
  protected authToken?: string;
  protected lastLatencyMs: number = 0;
  protected latencyLog: TimedResponseMeta[] = [];

  constructor(options?: TestContextOptions) {
    super(options);
    if (this.config.authToken) {
      this.authToken = this.config.authToken;
    }
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = undefined;
  }

  getAuthToken(): string | undefined {
    return this.authToken;
  }

  getLastLatencyMs(): number {
    return this.lastLatencyMs;
  }

  getLatencyLog(): TimedResponseMeta[] {
    return [...this.latencyLog];
  }

  clearLatencyLog(): void {
    this.latencyLog = [];
    this.lastLatencyMs = 0;
  }

  /**
   * Ensures an active Playwright APIRequestContext exists.
   */
  protected async getOrInitRequest(): Promise<APIRequestContext> {
    if (this.request) {
      return this.request;
    }
    const context = await playwrightRequest.newContext({
      baseURL: this.config.apiUrl,
    });
    this.request = context;
    return context;
  }

  /**
   * Resolves endpoint URL relative to the active apiUrl.
   */
  protected resolveUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const base = this.config.apiUrl.replace(/\/+$/, '');
    const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${cleanPath}`;
  }

  /**
   * Prepares headers with content type and Bearer token if present.
   */
  protected buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders,
    };

    if (this.authToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Safe body parsing for JSON and fallback types.
   */
  protected async parseResponseBody<T>(response: APIResponse): Promise<T> {
    const contentType = response.headers()['content-type'] || '';
    if (contentType.includes('application/json') || contentType.includes('+json')) {
      try {
        return (await response.json()) as T;
      }
      catch {
        return {} as T;
      }
    }
    const text = await response.text();
    return text as unknown as T;
  }

  /**
   * Internal executor with high-resolution performance measurement.
   */
  protected async executeRequest<TBody>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    options?: RequestOptions,
  ): Promise<[APIResponse, TBody]> {
    const client = await this.getOrInitRequest();
    const url = this.resolveUrl(endpoint);
    const headers = this.buildHeaders(options?.headers);

    const queryParams: Record<string, string> | undefined = options?.params
      ? Object.entries(options.params).reduce(
          (acc, [k, v]) => {
            acc[k] = String(v);
            return acc;
          },
          {} as Record<string, string>,
        )
      : undefined;

    const start = performance.now();
    const response = await client.fetch(url, {
      method,
      headers,
      params: queryParams,
      data: options?.data,
      timeout: options?.timeout,
    });
    const durationMs = Number((performance.now() - start).toFixed(2));
    this.lastLatencyMs = durationMs;

    this.latencyLog.push({
      endpoint,
      method,
      status: response.status(),
      durationMs,
      timestamp: new Date().toISOString(),
    });

    const body = await this.parseResponseBody<TBody>(response);
    return [response, body];
  }

  // ==========================================================================
  // Public HTTP Primitives (Type-safe Generic Signatures)
  // ==========================================================================

  async apiGET<TBody = unknown>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<[APIResponse, TBody]> {
    return this.executeRequest<TBody>('GET', endpoint, options);
  }

  async apiPOST<TBody = unknown, TPayload = unknown>(
    endpoint: string,
    payload?: TPayload,
    options?: RequestOptions,
  ): Promise<[APIResponse, TBody, TPayload | undefined]> {
    const [response, body] = await this.executeRequest<TBody>('POST', endpoint, {
      ...options,
      data: payload,
    });
    return [response, body, payload];
  }

  async apiPUT<TBody = unknown, TPayload = unknown>(
    endpoint: string,
    payload?: TPayload,
    options?: RequestOptions,
  ): Promise<[APIResponse, TBody, TPayload | undefined]> {
    const [response, body] = await this.executeRequest<TBody>('PUT', endpoint, {
      ...options,
      data: payload,
    });
    return [response, body, payload];
  }

  async apiPATCH<TBody = unknown, TPayload = unknown>(
    endpoint: string,
    payload?: TPayload,
    options?: RequestOptions,
  ): Promise<[APIResponse, TBody, TPayload | undefined]> {
    const [response, body] = await this.executeRequest<TBody>('PATCH', endpoint, {
      ...options,
      data: payload,
    });
    return [response, body, payload];
  }

  async apiDELETE<TBody = unknown>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<[APIResponse, TBody]> {
    return this.executeRequest<TBody>('DELETE', endpoint, options);
  }
}
