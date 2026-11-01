/** Tab-memory drafts only. Never read legacy browser storage or use this as an archive. */
let owner: string | null = null;
const values = new Map<string, string>();
export function setDraftOwner(next: string | null) {
  if (typeof window === "undefined") return;
  if (owner !== next) { values.clear(); owner = next; }
}
export function clearTransientDrafts() { values.clear(); owner = null; }
export const transientDraftStorage = {
  getItem(key: string): string | null { return typeof window === "undefined" ? null : values.get(key) ?? null; },
  setItem(key: string, value: string) { if (typeof window !== "undefined") values.set(key, value); },
  removeItem(key: string) { values.delete(key); },
};
