/**
 * Small helper around window.fetch that:
 * - Normalises network / HTTP / parsing errors
 * - Detects when HTML (usually index.html) is returned instead of JSON
 * - Never throws — always resolves to a structured { ok, data?, error?, rawText? } object.
 *
 * @param {string} url - The URL to fetch.
 * @param {RequestInit} [options] - Standard fetch options.
 * @returns {Promise<{ ok: true, data: any } | { ok: false, error: string, data?: any, rawText?: string }>}
 */
export async function safeFetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";

    // Handle non-2xx responses first so callers see HTTP failures clearly.
    if (!res.ok) {
      let raw = null;
      try {
        if (contentType.includes("application/json") || contentType.includes("+json")) {
          const json = await res.json();
          return { ok: false, error: `HTTP ${res.status}`, data: json };
        }

        raw = await res.text();
        return { ok: false, error: `HTTP ${res.status}`, rawText: raw };
      } catch (e) {
        raw = await res.text().catch(() => null);
        return {
          ok: false,
          error: `HTTP ${res.status} (failed to parse body)`,
          rawText: raw || undefined,
        };
      }
    }

    // 2xx responses: prefer JSON but be defensive.
    const looksJson = contentType.includes("application/json") || contentType.includes("+json");

    if (looksJson) {
      try {
        const json = await res.json();
        return { ok: true, data: json };
      } catch (err) {
        // JSON parse failed — inspect body as text to see what came back.
        const text = await res.text().catch(() => null);
        const trimmed = text ? text.trim().toLowerCase() : "";

        if (trimmed.startsWith("<!doctype") || trimmed.startsWith("<html")) {
          return {
            ok: false,
            error: "Received HTML instead of JSON",
            rawText: text || undefined,
          };
        }

        return {
          ok: false,
          error: "Invalid JSON response",
          rawText: text || undefined,
        };
      }
    }

    // Non‑JSON content type — treat as text and attempt to detect HTML.
    const text = await res.text().catch(() => null);
    const trimmed = text ? text.trim().toLowerCase() : "";

    if (trimmed.startsWith("<!doctype") || trimmed.startsWith("<html")) {
      return {
        ok: false,
        error: "Received HTML (likely index.html). Check backend route or proxy.",
        rawText: text || undefined,
      };
    }

    return {
      ok: false,
      error: "Received non-JSON response",
      rawText: text || undefined,
    };
  } catch (err) {
    // Network / CORS / DNS etc.
    return {
      ok: false,
      error: `Network error: ${err && err.message ? err.message : "Unknown network error"}`,
    };
  }
}


