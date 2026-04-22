export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries async operations with exponential backoff + jitter (common pattern for flaky APIs).
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 400;
  const maxDelayMs = options.maxDelayMs ?? 8_000;
  const shouldRetry =
    options.shouldRetry ??
    ((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      return /ECONNRESET|ETIMEDOUT|fetch failed|503|502|429/i.test(msg);
    });

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries || !shouldRetry(err, attempt)) throw err;
      const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const jitter = Math.floor(Math.random() * 200);
      await sleep(exp + jitter);
    }
  }
  throw lastError;
}
