import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Menu, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBridge } from "@/lib/onlyw/electron";
import { tabLabel } from "@/lib/onlyw/urls";
import { PomodoroTab } from "./PomodoroTab";
import { TabView, type TabViewHandle } from "./TabView";

type Props = {
  urls: string[];
  electron: boolean;
  onExit: () => void;
};

type NavState = { canGoBack: boolean; canGoForward: boolean };

export function BrowserShell({ urls, electron, onExit }: Props) {
  const [active, setActive] = useState(0);
  const [nav, setNav] = useState<NavState[]>(() =>
    urls.map(() => ({ canGoBack: false, canGoForward: false })),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pomodoro, setPomodoro] = useState(false);
  const views = useRef<(TabViewHandle | null)[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const bridge = getBridge();

  // Mute inactive tabs (Electron only)
  useEffect(() => {
    views.current.forEach((v, i) => {
      if (v) {
        v.setMuted(i !== active);
      }
    });
  }, [active]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [menuOpen]);

  // ESC exits fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreen) {
        setFullscreen(false);
        bridge?.windowFullscreen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fullscreen, bridge]);

  const navSetters = useRef<((s: NavState) => void)[]>([]);
  const getNavSetter = useCallback((i: number) => {
    if (!navSetters.current[i]) {
      navSetters.current[i] = (s: NavState) =>
        setNav((prev) => {
          const next = [...prev];
          next[i] = s;
          return next;
        });
    }
    return navSetters.current[i];
  }, []);

  const current = nav[active] ?? { canGoBack: false, canGoForward: false };
  const canBack = electron && current.canGoBack;
  const canForward = electron && current.canGoForward;

  const toggleFullscreen = async () => {
    const next = !fullscreen;
    setFullscreen(next);
    setMenuOpen(false);
    await bridge?.windowFullscreen(next);
  };

  const iconBtn =
    "flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-all duration-150 hover:bg-surface-raised active:scale-95 disabled:pointer-events-none disabled:opacity-25";

  return (
    <div className="animate-in fade-in flex h-full w-full flex-col duration-300">
      <header
        className={cn(
          "flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 transition-all duration-300",
          fullscreen ? "h-0 overflow-hidden border-b-0 opacity-0" : "h-12",
        )}
      >
        <nav className="flex min-w-0 items-center gap-1">
          <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1">
            {urls.map((u, i) => (
              <button
                key={u + i}
                onClick={() => setActive(i)}
                className={cn(
                  "relative h-7 rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap transition-all duration-200",
                  active === i
                    ? "bg-primary text-primary-foreground shadow-[0_2px_10px_-2px_oklch(1_0_0/0.35)]"
                    : "text-foreground/65 hover:bg-surface-raised hover:text-foreground",
                )}
              >
                {tabLabel(u)}
              </button>
            ))}
          </div>
          {pomodoro && (
            <div className="ml-2">
              <PomodoroTab />
            </div>
          )}
        </nav>

        <div className="flex items-center gap-0.5">
          <button
            className={iconBtn}
            disabled={!canBack}
            onClick={() => views.current[active]?.goBack()}
            aria-label="Bakåt"
          >
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
          <button
            className={iconBtn}
            disabled={!canForward}
            onClick={() => views.current[active]?.goForward()}
            aria-label="Framåt"
          >
            <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
          <button
            className={cn(iconBtn, "group")}
            onClick={() => views.current[active]?.reload()}
            aria-label="Ladda om"
          >
            <RotateCw className="h-4 w-4 transition-transform duration-500 group-active:rotate-180" strokeWidth={1.75} />
          </button>

          <div ref={menuRef} className="relative">
            <button
              className={cn(iconBtn, menuOpen && "bg-surface-raised")}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Meny"
              aria-expanded={menuOpen}
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
            {menuOpen && (
              <div className="animate-in fade-in zoom-in-95 slide-in-from-top-1 absolute top-[calc(100%+6px)] right-0 z-50 min-w-[190px] origin-top-right rounded-xl border border-border bg-popover p-1 shadow-panel duration-150">
                <MenuItem
                  label="Maximera"
                  onClick={() => {
                    setMenuOpen(false);
                    bridge?.windowMaximize();
                  }}
                />
                <MenuItem
                  label="Minimera"
                  onClick={() => {
                    setMenuOpen(false);
                    bridge?.windowMinimize();
                  }}
                />
                <MenuItem label="Helskärm (fönster)" onClick={toggleFullscreen} />
                <div className="my-1 h-px bg-border" />
                <MenuItem
                  label={pomodoro ? "Stäng Pomodoro-timer" : "Pomodoro-timer"}
                  onClick={() => {
                    setMenuOpen(false);
                    setPomodoro((v) => !v);
                  }}
                />
              </div>
            )}
          </div>

          <div className="mx-1 h-5 w-px bg-border" />

          <button
            className={cn(iconBtn, "hover:bg-destructive/80")}
            onClick={onExit}
            aria-label="Avsluta"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden bg-background">
        {urls.map((u, i) => (
          <TabView
            key={u + i}
            ref={(h) => {
              views.current[i] = h;
            }}
            src={u}
            active={active === i}
            electron={electron}
            onNavState={getNavSetter(i)}
          />
        ))}
      </main>
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center rounded-lg px-3 py-2 text-left text-[13px] text-foreground/85 transition-colors hover:bg-surface-raised hover:text-foreground"
    >
      {label}
    </button>
  );
}
