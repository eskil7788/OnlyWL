import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type TabViewHandle = {
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  setMuted: (muted: boolean) => void;
};

type NavState = { canGoBack: boolean; canGoForward: boolean };

type Props = {
  src: string;
  active: boolean;
  electron: boolean;
  onNavState: (s: NavState) => void;
};

// Minimal typing for Electron's <webview> element
type WebviewEl = HTMLElement & {
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  setAudioMuted: (m: boolean) => void;
  executeJavaScript: (code: string, gesture?: boolean) => Promise<unknown>;
};

export const TabView = forwardRef<TabViewHandle, Props>(function TabView(
  { src, active, electron, onNavState },
  ref,
) {
  const webviewRef = useRef<WebviewEl | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  useImperativeHandle(ref, () => ({
    goBack: () => {
      const wv = webviewRef.current;
      if (wv?.canGoBack?.()) wv.goBack();
    },
    goForward: () => {
      const wv = webviewRef.current;
      if (wv?.canGoForward?.()) wv.goForward();
    },
    reload: () => {
      if (electron) webviewRef.current?.reload();
      else setIframeKey((k) => k + 1);
    },
    setMuted: (m) => webviewRef.current?.setAudioMuted?.(m),
  }));

  useEffect(() => {
    if (!electron) return;
    const wv = webviewRef.current;
    if (!wv) return;
    const emit = () => onNavState({ canGoBack: wv.canGoBack(), canGoForward: wv.canGoForward() });
    const onReady = () => {
      wv.executeJavaScript(
        "document.addEventListener('contextmenu', e => e.preventDefault());",
        false,
      ).catch(() => {});
      emit();
    };
    wv.addEventListener("dom-ready", onReady);
    wv.addEventListener("did-navigate", emit);
    wv.addEventListener("did-navigate-in-page", emit);
    wv.addEventListener("did-stop-loading", emit);
    return () => {
      wv.removeEventListener("dom-ready", onReady);
      wv.removeEventListener("did-navigate", emit);
      wv.removeEventListener("did-navigate-in-page", emit);
      wv.removeEventListener("did-stop-loading", emit);
    };
  }, [electron, onNavState]);

  const wrapperClass = cn(
    "absolute inset-0 transition-opacity duration-200",
    active ? "visible z-10 opacity-100" : "invisible z-0 opacity-0",
  );

  if (electron) {
    return (
      <div className={wrapperClass}>
        {createElement("webview", {
          ref: webviewRef,
          src,
          partition: "persist:onlyw",
          disableblinkfeatures: "Auxclick",
          webpreferences: "contextIsolation",
          style: { width: "100%", height: "100%", border: "none" },
        })}
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <iframe
        key={iframeKey}
        ref={iframeRef}
        src={src}
        title={src}
        className="h-full w-full border-0 bg-background"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
      <div className="pointer-events-none absolute right-3 bottom-3 rounded-md border border-border bg-card/90 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur">
        Förhandsvisning – vissa sidor kan bara visas i skrivbordsappen
      </div>
    </div>
  );
});
