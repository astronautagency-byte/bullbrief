/** Preserve local deep links without allowing protocol-relative or control-character redirects. */
export function safeCallback(value: string | null | undefined, fallback = "/brief") {
 if (!value?.startsWith("/") || value.includes("\\")) return fallback;
 try { const base = "https://bullbrief.invalid"; const url = new URL(value, base); return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : fallback; }
 catch { return fallback; }
}
