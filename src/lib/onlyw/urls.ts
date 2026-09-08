export type Whitelist = { urls: string[]; hosts: string[] };

export function parseLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function normalizeLines(lines: string[]): Whitelist {
  const urls: string[] = [];
  const hosts = new Set<string>();
  for (const raw of lines) {
    const s = String(raw ?? "").trim();
    if (!s) continue;
    const candidate = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    try {
      const u = new URL(candidate);
      if (!u.hostname) continue;
      urls.push(u.toString());
      hosts.add(u.hostname);
    } catch {
      // ignore invalid lines
    }
  }
  return { urls, hosts: Array.from(hosts) };
}

export function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

/** "www.trafiko.se" -> "trafiko" */
export function tabLabel(url: string): string {
  const host = hostFromUrl(url).replace(/^www\./, "");
  return host.split(".")[0] || host || url;
}
