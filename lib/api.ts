const FETCH_TIMEOUT_MS = 8_000;
const RETRY_STATUSES = new Set([429, 502, 503, 504]);

export async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let lastErr: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        // Only retry on transient server errors
        if (RETRY_STATUSES.has(res.status) && attempt < 2) {
          await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
          continue;
        }
        // Read up to 512 bytes of error body — don't hang on huge HTML error pages
        const reader = res.body?.getReader();
        let body = "";
        if (reader) {
          const { value } = await reader.read();
          body = value ? new TextDecoder().decode(value.slice(0, 512)) : "";
          reader.cancel();
        }
        throw new Error(`API error ${res.status}: ${body}`);
      }

      return res.json() as Promise<T>;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      // Don't retry aborts or non-transient errors
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Request to ${url} timed out after ${FETCH_TIMEOUT_MS}ms`);
      }
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
        continue;
      }
    }
  }

  throw lastErr;
}
