export type UrlGroup = { id: string; name: string; urls: string[] };

const KEY = "onlyw.groups";

export function loadGroups(): UrlGroup[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (g): g is UrlGroup =>
        g && typeof g.id === "string" && typeof g.name === "string" && Array.isArray(g.urls),
    );
  } catch {
    return [];
  }
}

export function saveGroups(groups: UrlGroup[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(groups));
}

export function newGroupId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
