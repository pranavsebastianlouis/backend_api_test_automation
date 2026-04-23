import type { APIResponse } from '@playwright/test';

/**
 * Snapshot of an {@link APIResponse} after reading the body once, then replaying
 * `text` / `json` / `body` for callers that expect a single consumer.
 */
export class ReplayApiResponse {
  constructor(
    private readonly _status: number,
    private readonly _url: string,
    private readonly _headers: Record<string, string>,
    private readonly _bodyText: string,
  ) {}

  ok(): boolean {
    return this._status >= 200 && this._status < 300;
  }

  url(): string {
    return this._url;
  }

  status(): number {
    return this._status;
  }

  headers(): Record<string, string> {
    return this._headers;
  }

  async text(): Promise<string> {
    return this._bodyText;
  }

  async body(): Promise<Buffer> {
    return Buffer.from(this._bodyText, 'utf8');
  }

  async json(): Promise<unknown> {
    return JSON.parse(this._bodyText);
  }
}

export async function snapshotResponse(res: APIResponse): Promise<ReplayApiResponse> {
  const status = res.status();
  const url = res.url();
  const headers = res.headers();
  const bodyText = await res.text();
  return new ReplayApiResponse(status, url, headers, bodyText);
}
