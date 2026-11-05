/**
 * Safe JSON fetch utility that prevents:
 * SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallback: T = {} as T
): Promise<{ ok: boolean; status: number; data: T }> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { ok: res.ok, status: res.status, data: fallback };
    }
    const text = await res.text();
    if (!text || text.trim().startsWith('<')) {
      return { ok: res.ok, status: res.status, data: fallback };
    }
    try {
      const data = JSON.parse(text);
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: res.ok, status: res.status, data: fallback };
    }
  } catch {
    return { ok: false, status: 0, data: fallback };
  }
}

export async function parseResponseJson<T = any>(res: Response, fallback: T = {} as T): Promise<T> {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return fallback;
    }
    const text = await res.text();
    if (!text || text.trim().startsWith('<')) {
      return fallback;
    }
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}
