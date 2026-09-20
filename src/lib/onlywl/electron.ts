import type { Whitelist } from "./urls";
import type { UrlGroup } from "./groups";

export type OnlyWLBridge = {
  setWhitelist: (lines: string[]) => Promise<Whitelist>;
  exitApp: () => void;
  windowMaximize: () => Promise<void>;
  windowMinimize: () => Promise<void>;
  windowFullscreen: (enable: boolean) => Promise<void>;
  getGroups?: () => Promise<UrlGroup[]>;
  setGroups?: (groups: UrlGroup[]) => Promise<void>;
};

declare global {
  interface Window {
    onlywl?: OnlyWLBridge;
  }
}

export function getBridge(): OnlyWLBridge | null {
  if (typeof window === "undefined") return null;
  return window.onlywl ?? null;
}

export function isElectron(): boolean {
  return getBridge() !== null;
}
