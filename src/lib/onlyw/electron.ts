import type { Whitelist } from "./urls";
import type { UrlGroup } from "./groups";

export type OnlywBridge = {
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
    onlyw?: OnlywBridge;
  }
}

export function getBridge(): OnlywBridge | null {
  if (typeof window === "undefined") return null;
  return window.onlyw ?? null;
}

export function isElectron(): boolean {
  return getBridge() !== null;
}
