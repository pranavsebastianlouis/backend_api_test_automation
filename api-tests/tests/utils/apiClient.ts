import type { APIRequestContext, APIResponse } from '@playwright/test';
import { withRetry } from './retry';

export type JsonRecord = Record<string, unknown>;

export type ApiClientOptions = {
  defaultHeaders?: Record<string, string>;
};

/**
 * Thin wrapper around Playwright APIRequestContext so request logic stays in one place.
 */
export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string,
    private readonly options: ApiClientOptions = {},
  ) {}

  private url(path: string): string {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl.replace(/\/$/, '')}${p}`;
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    return { ...(this.options.defaultHeaders ?? {}), ...(extra ?? {}) };
  }

  get(
    path: string,
    opts?: { headers?: Record<string, string>; params?: Record<string, string | number | boolean> },
  ): Promise<APIResponse> {
    return withRetry(() =>
      this.request.get(this.url(path), {
        headers: this.headers(opts?.headers),
        params: opts?.params,
        failOnStatusCode: false,
      }),
    );
  }

  post(path: string, opts?: { data?: unknown; headers?: Record<string, string> }): Promise<APIResponse> {
    return withRetry(() =>
      this.request.post(this.url(path), {
        data: opts?.data,
        headers: this.headers(opts?.headers),
        failOnStatusCode: false,
      }),
    );
  }

  put(path: string, opts?: { data?: unknown; headers?: Record<string, string> }): Promise<APIResponse> {
    return withRetry(() =>
      this.request.put(this.url(path), {
        data: opts?.data,
        headers: this.headers(opts?.headers),
        failOnStatusCode: false,
      }),
    );
  }

  patch(path: string, opts?: { headers?: Record<string, string> }): Promise<APIResponse> {
    return withRetry(() =>
      this.request.patch(this.url(path), {
        headers: this.headers(opts?.headers),
        failOnStatusCode: false,
      }),
    );
  }
}

export function createApiClient(
  request: APIRequestContext,
  baseUrl: string,
  options?: ApiClientOptions,
): ApiClient {
  return new ApiClient(request, baseUrl, options);
}
