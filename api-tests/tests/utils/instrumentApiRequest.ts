import type { APIRequestContext, APIResponse } from '@playwright/test';
import { snapshotResponse } from './replayApiResponse';

export type HttpCaptureEntry = {
  method: string;
  url: string;
  status: number;
  bodyPreview: string;
};

const MAX_ENTRIES = 40;
const MAX_BODY_CHARS = 48_000;

function truncate(s: string): string {
  if (s.length <= MAX_BODY_CHARS) return s;
  return `${s.slice(0, MAX_BODY_CHARS)}\n… [truncated ${s.length - MAX_BODY_CHARS} more chars]\n`;
}

function pushCapture(captures: HttpCaptureEntry[], entry: HttpCaptureEntry): void {
  captures.push(entry);
  if (captures.length > MAX_ENTRIES) captures.shift();
}

async function intercept(
  method: string,
  promise: Promise<APIResponse>,
  captures: HttpCaptureEntry[],
): Promise<APIResponse> {
  const res = await promise;
  const replay = await snapshotResponse(res);
  const bodyPreview = truncate(await replay.text());
  pushCapture(captures, {
    method,
    url: replay.url(),
    status: replay.status(),
    bodyPreview,
  });
  return replay as unknown as APIResponse;
}

/**
 * Wraps a Playwright {@link APIRequestContext} so each HTTP call records a truncated body snapshot.
 * Intended for attaching `api-http-log.txt` on failure only (see `tests/fixtures/test.ts`).
 */
export function instrumentApiRequestContext(
  inner: APIRequestContext,
  captures: HttpCaptureEntry[],
): APIRequestContext {
  return new Proxy(inner, {
    get(target, prop, receiver) {
      if (prop === 'get') {
        return (url: string, options?: Parameters<APIRequestContext['get']>[1]) =>
          intercept('GET', target.get(url, options), captures);
      }
      if (prop === 'post') {
        return (url: string, options?: Parameters<APIRequestContext['post']>[1]) =>
          intercept('POST', target.post(url, options), captures);
      }
      if (prop === 'put') {
        return (url: string, options?: Parameters<APIRequestContext['put']>[1]) =>
          intercept('PUT', target.put(url, options), captures);
      }
      if (prop === 'patch') {
        return (url: string, options?: Parameters<APIRequestContext['patch']>[1]) =>
          intercept('PATCH', target.patch(url, options), captures);
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as APIRequestContext;
}
