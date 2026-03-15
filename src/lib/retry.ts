/**
 * Retry utility with exponential backoff.
 *
 * Retries a failing async operation with increasing delays:
 * attempt 1 → 500ms, attempt 2 → 1000ms, attempt 3 → 2000ms, ...
 * Adds ±10% jitter to each delay to spread thundering-herd retries.
 */

export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 3 */
  maxAttempts?: number;
  /** Base delay in ms for exponential backoff. Default: 500 */
  baseDelayMs?: number;
  /** Upper bound on delay in ms. Default: 10_000 */
  maxDelayMs?: number;
  /** Optional label for logging (e.g. "Slack", "Discord"). */
  label?: string;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 500,
    maxDelayMs = 10_000,
    label = "action",
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) break;

      const exponential = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = exponential * 0.1 * (Math.random() * 2 - 1); // ±10%
      const delay = Math.min(exponential + jitter, maxDelayMs);

      console.warn(
        `[retry] ${label} failed on attempt ${attempt}/${maxAttempts}. Retrying in ${Math.round(delay)}ms.`,
        err instanceof Error ? err.message : err
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
