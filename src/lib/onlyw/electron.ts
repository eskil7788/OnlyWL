import type { Whitelist } from "./urls";

export type OnlywBridge = {
  setWhitelist: (lines: string[]) => Promise<Whitelist>;
  exitApp: () => void;
  windowMaximize: () => Promise<void>;
  windowMinimize: () => Promise<void>;
  windowFullscreen: (enable: boolean) => Promise<void>;
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
