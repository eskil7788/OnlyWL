import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Startup } from "@/components/onlyw/Startup";
import { BrowserShell } from "@/components/onlyw/BrowserShell";
import { getBridge, isElectron } from "@/lib/onlyw/electron";
import { normalizeLines, type Whitelist } from "@/lib/onlyw/urls";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "onlyw – fokuserad webbläsare med vitlista" },
      {
        name: "description",
        content: "onlyw är en minimal webbläsare utan sökmotor. Du surfar bara på sidorna du själv tillåter.",
      },
      { property: "og:title", content: "onlyw – fokuserad webbläsare med vitlista" },
      {
        property: "og:description",
        content: "En minimal webbläsare utan sökmotor. Du surfar bara på sidorna du själv tillåter.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Phase = "start" | "leaving" | "browse";

function Index() {
  const [phase, setPhase] = useState<Phase>("start");
  const [session, setSession] = useState<Whitelist | null>(null);
  const [electron, setElectron] = useState(false);

  useEffect(() => {
    setElectron(isElectron());
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", block);
    return () => document.removeEventListener("contextmenu", block);
  }, []);

  const handleSurf = async (lines: string[]) => {
    const bridge = getBridge();
    const data = bridge ? await bridge.setWhitelist(lines) : normalizeLines(lines);
    if (data.urls.length === 0) return;
    setSession(data);
    setPhase("leaving");
    setTimeout(() => setPhase("browse"), 300);
  };

  const handleExit = () => {
    const bridge = getBridge();
    if (bridge) bridge.exitApp();
    else {
      // Web preview: there is no process to close, so return to the start screen.
      setSession(null);
      setPhase("start");
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      {phase === "browse" && session ? (
        <BrowserShell urls={session.urls} electron={electron} onExit={handleExit} />
      ) : (
        <Startup onSurf={handleSurf} onExit={handleExit} exiting={phase === "leaving"} />
      )}
    </div>
  );
}
