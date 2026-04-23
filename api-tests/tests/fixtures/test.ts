import { test as base, expect } from '@playwright/test';
import type { APIRequestContext, TestInfo } from '@playwright/test';
import { DEFAULT_EXTRA_HEADERS } from '../utils/httpDefaults';
import { instrumentApiRequestContext, type HttpCaptureEntry } from '../utils/instrumentApiRequest';

function shouldAttachApiLog(status: string | undefined): boolean {
  return status === 'failed' || status === 'timedOut' || status === 'interrupted';
}

async function attachApiHttpLog(testInfo: TestInfo, captures: HttpCaptureEntry[]): Promise<void> {
  if (captures.length === 0) return;
  const lines = captures.map((c, i) => [`[${i + 1}] ${c.method} ${c.status} ${c.url}`, c.bodyPreview].join('\n'));
  const body =
    `${lines.join('\n\n---\n\n')}\n\n---\nNote: only the last 40 HTTP responses are kept; each body is truncated for size.\n`;
  await testInfo.attach('api-http-log.txt', {
    body,
    contentType: 'text/plain',
  });
}

export const test = base.extend<{ request: APIRequestContext }>({
  request: async ({ playwright, baseURL }, use, testInfo) => {
    const captures: HttpCaptureEntry[] = [];
    const inner = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { ...DEFAULT_EXTRA_HEADERS },
    });
    const wrapped = instrumentApiRequestContext(inner, captures);
    await use(wrapped);
    try {
      if (shouldAttachApiLog(testInfo.status)) {
        await attachApiHttpLog(testInfo, captures);
      }
    } finally {
      await inner.dispose();
    }
  },
});

export { expect };
