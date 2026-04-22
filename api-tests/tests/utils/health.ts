import type { APIRequestContext } from '@playwright/test';
import { withRetry } from './retry';

export type HealthBody = {
  status: string;
  service: string;
  port: number;
};

export async function getHealth(
  request: APIRequestContext,
  baseUrl: string,
): Promise<HealthBody> {
  const url = `${baseUrl.replace(/\/$/, '')}/health`;
  const res = await withRetry(() =>
    request.get(url, { failOnStatusCode: false, timeout: 15_000 }),
  );
  if (!res.ok()) throw new Error(`Health check failed: ${url} -> ${res.status()}`);
  return (await res.json()) as HealthBody;
}
