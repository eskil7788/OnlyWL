import { useEffect, useRef, useState } from "react";
import { FolderPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadGroups, newGroupId, saveGroups, type UrlGroup } from "@/lib/onlyw/groups";
import { parseLines } from "@/lib/onlyw/urls";

type Props = {
  onSurf: (lines: string[]) => void;
  onExit: () => void;
  exiting?: boolean;
};

export function Startup({ onSurf, onExit, exiting }: Props) {
  const [text, setText] = useState("");
  const [groups, setGroups] = useState<UrlGroup[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupUrls, setGroupUrls] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    loadGroups().then((g) => {
      if (alive) setGroups(g);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (panelOpen) {
      setGroupUrls(text);
      setTimeout(() => nameRef.current?.focus(), 200);
    }
  }, [panelOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveGroup = () => {
    const name = groupName.trim();
    const urls = parseLines(groupUrls);
    if (!name || urls.length === 0) return;
    const next = [...groups, { id: newGroupId(), name, urls }];
    setGroups(next);
    saveGroups(next);
    setGroupName("");
    setGroupUrls("");
    setPanelOpen(false);
  };

  const removeGroup = (id: string) => {
    const next = groups.filter((g) => g.id !== id);
    setGroups(next);
    saveGroups(next);
    setConfirmDelete(null);
    if (activeGroup === id) setActiveGroup(null);
  };

  const applyGroup = (g: UrlGroup) => {
    setText(g.urls.join("\n"));
    setActiveGroup(g.id);
  };

  const canSave = groupName.trim().length > 0 && parseLines(groupUrls).length > 0;

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center px-6 transition-all duration-300 ease-out",
        exiting ? "scale-[0.985] opacity-0" : "opacity-100",
      )}
    >
      <h1 className="animate-in fade-in slide-in-from-bottom-2 -mt-12 mb-8 text-[96px] leading-none font-bold tracking-tight duration-700">
        onlyw
      </h1>

      <div className="animate-in fade-in slide-in-from-bottom-1 flex w-full max-w-[640px] flex-col gap-3 delay-150 duration-700">
        <div className="flex items-center justify-between">
          <p className="text-[15px] text-foreground/90">Vilka sidor vill du använda?</p>
          <button
            onClick={() => onSurf(parseLines(text))}
            className="ring-focus rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold lowercase text-primary-foreground shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-8px_oklch(1_0_0/0.3)] active:translate-y-0 active:scale-[0.98]"
          >
            surf
          </button>
        </div>

        {groups.length > 0 && (
          <div className="animate-in fade-in flex flex-wrap gap-2 duration-300">
            {groups.map((g) => (
              <div
                key={g.id}
                className={cn(
                  "group inline-flex items-center overflow-hidden rounded-full border text-[13px] transition-all duration-200",
                  activeGroup === g.id
                    ? "border-border-strong bg-primary text-primary-foreground"
                    : "border-border bg-surface text-foreground/85 hover:border-border-strong hover:bg-surface-raised",
                )}
              >
                <button
                  onClick={() => applyGroup(g)}
                  title={g.urls.join("\n")}
                  className="py-1.5 pr-1.5 pl-3.5 font-medium"
                >
                  {g.name}
                  <span
                    className={cn(
                      "ml-1.5 tabular-nums opacity-50",
                      activeGroup === g.id && "opacity-60",
                    )}
                  >
                    {g.urls.length}
                  </span>
                </button>
                {confirmDelete === g.id ? (
                  <span className="flex items-center gap-1 pr-1.5 text-[11px]">
                    <button
                      onClick={() => removeGroup(g.id)}
                      className="rounded-full bg-destructive px-2 py-0.5 font-semibold text-destructive-foreground"
                    >
                      Ta bort
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-full px-1.5 py-0.5 opacity-70 hover:opacity-100"
                    >
                      Avbryt
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(g.id)}
                    aria-label={`Ta bort gruppen ${g.name}`}
                    className="mr-1 flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-all duration-200 group-hover:opacity-60 hover:bg-foreground/10 hover:!opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-3">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setActiveGroup(null);
            }}
            spellCheck={false}
            rows={10}
            className="ring-focus h-[200px] w-full resize-none rounded-xl border border-border bg-surface px-4 py-3.5 text-[15px] leading-relaxed text-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.03)] transition-all duration-200 hover:border-border-strong focus:border-border-strong focus:bg-card"
          />
          <button
            onClick={() => setPanelOpen((v) => !v)}
            aria-expanded={panelOpen}
            className={cn(
              "ring-focus flex h-[200px] w-[104px] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border text-[13px] font-medium transition-all duration-200",
              panelOpen
                ? "border-border-strong bg-surface-raised"
                : "border-border bg-surface hover:border-border-strong hover:bg-surface-raised",
            )}
          >
            <FolderPlus className="h-5 w-5 opacity-80" strokeWidth={1.75} />
            <span className="px-2 text-center leading-tight">Lägg till grupp</span>
          </button>
        </div>

        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            panelOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="mt-1 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-panel">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Ny grupp</p>
                <button
                  onClick={() => setPanelOpen(false)}
                  aria-label="Stäng"
                  className="rounded-md p-1 opacity-60 transition-opacity hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                ref={nameRef}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Gruppnamn"
                className="ring-focus rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground transition-colors hover:border-border-strong focus:border-border-strong"
              />
              <textarea
                value={groupUrls}
                onChange={(e) => setGroupUrls(e.target.value)}
                placeholder={"https://google.com\nhttps://chatgpt.com\nhttps://x.com"}
                spellCheck={false}
                rows={4}
                className="ring-focus resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground/60 transition-colors hover:border-border-strong focus:border-border-strong"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setPanelOpen(false)}
                  className="rounded-lg px-3.5 py-2 text-sm text-foreground/70 transition-colors hover:bg-surface-raised hover:text-foreground"
                >
                  Avbryt
                </button>
                <button
                  onClick={saveGroup}
                  disabled={!canSave}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
                >
                  Spara
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
