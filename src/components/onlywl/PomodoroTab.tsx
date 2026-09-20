import { useEffect, useRef, useState } from "react";
import { Minus, Pause, Pencil, Play, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

function playPomodoroSound() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    for (let i = 0; i < 3; i++) {
      osc.frequency.setValueAtTime(800 + i * 200, now + i * 0.1);
      gain.gain.setValueAtTime(0.3, now + i * 0.1);
      gain.gain.setValueAtTime(0, now + i * 0.1 + 0.08);
    }
    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    // audio not available
  }
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const RING_R = 11;
const RING_C = 2 * Math.PI * RING_R;

export function PomodoroTab() {
  const [workTime, setWorkTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [currentTime, setCurrentTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWork, setIsWork] = useState(true);
  const [started, setStarted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selected, setSelected] = useState<"work" | "break">("work");
  const [pulse, setPulse] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Tick
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setCurrentTime((t) => t - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Session switch when reaching zero
  useEffect(() => {
    if (!isRunning || currentTime > 0) return;
    playPomodoroSound();
    setPulse(true);
    const id = setTimeout(() => {
      const nextWork = !isWork;
      setIsWork(nextWork);
      setCurrentTime((nextWork ? workTime : breakTime) * 60);
      setPulse(false);
    }, 1000);
    return () => clearTimeout(id);
  }, [currentTime, isRunning, isWork, workTime, breakTime]);

  // Close settings on outside click
  useEffect(() => {
    if (!settingsOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [settingsOpen]);

  const total = (isWork ? workTime : breakTime) * 60;
  const progress = total > 0 ? Math.min(1, Math.max(0, 1 - currentTime / total)) : 0;

  const adjust = (delta: number) => {
    if (selected === "work") setWorkTime((v) => Math.min(99, Math.max(1, v + delta)));
    else setBreakTime((v) => Math.min(99, Math.max(1, v + delta)));
  };

  const start = () => {
    setCurrentTime((isWork ? workTime : breakTime) * 60);
    setIsRunning(true);
    setStarted(true);
    setSettingsOpen(false);
  };

  const reset = () => {
    setIsRunning(false);
    setIsWork(true);
    setStarted(false);
    setCurrentTime(workTime * 60);
  };

  const toggle = () => {
    if (!isRunning && !started) setStarted(true);
    setIsRunning((r) => !r);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={cn(
          "animate-in fade-in zoom-in-95 flex h-8 items-center gap-2 rounded-full border pr-1 pl-3 duration-200",
          isRunning
            ? "border-border-strong bg-surface-raised"
            : "border-border bg-surface",
          pulse && "ring-2 ring-foreground/40",
        )}
      >
        <span
          className={cn(
            "text-[10px] font-medium tracking-[0.14em] uppercase transition-colors",
            isWork ? "text-muted-foreground" : "text-foreground/80",
          )}
        >
          {isWork ? "Arbete" : "Paus"}
        </span>
        <span className="font-mono text-[13px] font-bold tabular-nums tracking-wider">
          {formatTime(Math.max(0, currentTime))}
        </span>

        <button
          onClick={toggle}
          aria-label={isRunning ? "Pausa" : "Starta"}
          className="relative flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
        >
          <svg viewBox="0 0 26 26" className="absolute inset-0 -rotate-90">
            <circle cx="13" cy="13" r={RING_R} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5" />
            <circle
              cx="13"
              cy="13"
              r={RING_R}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-700 ease-linear"
            />
          </svg>
          {isRunning ? (
            <Pause className="h-2.5 w-2.5 fill-current" />
          ) : (
            <Play className="ml-px h-2.5 w-2.5 fill-current" />
          )}
        </button>

        {started ? (
          <button
            onClick={reset}
            aria-label="Återställ"
            className="flex h-6 w-6 items-center justify-center rounded-full opacity-60 transition-all hover:bg-foreground/10 hover:opacity-100"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        ) : (
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            aria-label="Inställningar"
            aria-expanded={settingsOpen}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full transition-all hover:bg-foreground/10",
              settingsOpen ? "bg-foreground/10 opacity-100" : "opacity-60 hover:opacity-100",
            )}
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>

      {settingsOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 absolute top-[calc(100%+8px)] right-0 z-50 w-[220px] rounded-xl border border-border bg-popover p-3 shadow-panel duration-150">
          <div className="grid grid-cols-2 gap-2">
            {(["work", "break"] as const).map((k) => {
              const value = k === "work" ? workTime : breakTime;
              const active = selected === k;
              return (
                <button
                  key={k}
                  onClick={() => setSelected(k)}
                  className={cn(
                    "flex flex-col items-center rounded-lg border px-2 py-2 transition-all duration-150",
                    active
                      ? "border-border-strong bg-surface-raised"
                      : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <span className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                    {k === "work" ? "Arbete" : "Paus"}
                  </span>
                  <span className="font-mono text-xl font-bold tabular-nums">{value}</span>
                  <span className="text-[10px] text-muted-foreground">min</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => adjust(-1)}
              className="flex h-8 flex-1 items-center justify-center rounded-lg border border-border bg-surface transition-colors hover:bg-surface-raised active:scale-95"
              aria-label="Minska"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => adjust(1)}
              className="flex h-8 flex-1 items-center justify-center rounded-lg border border-border bg-surface transition-colors hover:bg-surface-raised active:scale-95"
              aria-label="Öka"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={start}
            className="mt-2 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-px active:translate-y-0"
          >
            Start
          </button>
        </div>
      )}
    </div>
  );
}
