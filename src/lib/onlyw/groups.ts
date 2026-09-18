import { getBridge } from "./electron";

export type UrlGroup = { id: string; name: string; urls: string[] };

const KEY = "onlyw.groups";

function sanitize(parsed: unknown): UrlGroup[] {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (g): g is UrlGroup =>
      Boolean(g) &&
      typeof g.id === "string" &&
      typeof g.name === "string" &&
      Array.isArray(g.urls),
  );
}

function loadLocal(): UrlGroup[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return sanitize(JSON.parse(raw));
  } catch {
    return [];
  }
}

/** Reads groups from disk in the desktop app, localStorage in the browser. */
export async function loadGroups(): Promise<UrlGroup[]> {
  const bridge = getBridge();
  if (bridge?.getGroups) {
    try {
      const fromDisk = sanitize(await bridge.getGroups());
      if (fromDisk.length > 0) return fromDisk;
      // Migrate any groups saved before disk storage existed.
      const local = loadLocal();
      if (local.length > 0) await bridge.setGroups(local);
      return local;
    } catch {
      return loadLocal();
    }
  }
  return loadLocal();
}

export function saveGroups(groups: UrlGroup[]) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(groups));
    } catch {
      // ignore quota / unavailable storage
    }
  }
  getBridge()?.setGroups?.(groups);
}

export function newGroupId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
