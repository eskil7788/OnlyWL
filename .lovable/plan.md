# onlyw — bring into Lovable, polish the UI, add URL groups

## Current state (verified)

- This Lovable project still contains only the blank starter — none of your onlyw files are here yet. I fetched your GitHub repo directly and read all of it (`main.js`, `preload.js`, `renderer.js`, `index.html`, `styles.css`).
- Your app is an Electron app using the `<webview>` tag. That tag only exists inside Electron, so the browsing phase cannot run as-is in the Lovable preview. Everything else (startup screen, tabs, menu, pomodoro) can.
- The whitelist blocking described in your spec is not actually implemented in the code yet (there is no `will-navigate` / `setWindowOpenHandler` guard in `main.js`). Optional fix included below.

## Step 1 — Make onlyw run in this project (and in Lovable's preview)

Rebuild the same UI in this project's React setup so it shows at `/` in the preview, while keeping Electron as the real runtime:

- Port `renderer.js` + `index.html` + `styles.css` into React components (`Startup`, `BrowserShell`, `TabBar`, `NavButtons`, `Menu`, `PomodoroTab`). Behaviour stays identical: two phases, static tabs, back/forward/reload, exit, maximize/minimize/fullscreen, ESC leaves fullscreen, pomodoro with work/break, sound, no right‑click.
- Tab content component picks the engine at runtime: `<webview>` when running inside Electron (real browsing, cookies, blocking), `<iframe>` when in the web preview (so you can see the layout; many sites refuse iframes, so a small "opens only in the desktop app" note is shown when a site blocks it).
- Add `electron/main.cjs` and `electron/preload.cjs` (your existing `main.js`/`preload.js`, moved and kept CommonJS), plus `"main"` entry and an `electron:start` script in `package.json`. Ubuntu font loaded via `<link>` in the root route.
- `vite.config.ts` gets `base: './'` so the built files work from the exe.

## Step 2 — UI polish (same layout, more professional)

Keep the black/white Ubuntu look and every element where it is; only refine:

- Startup: logo with subtle fade/slide‑in, textarea with soft focus ring and hover border, Surf button with hover lift; phase switch is a crossfade instead of a hard swap.
- Top bar: hairline bottom border, tabs as pill segments with an animated active indicator and hover state, nav icons replaced with crisp Lucide icons (back/forward/reload/menu/close) that dim when disabled, dropdown animates open/close.
- Pomodoro tab (main focus): redesigned as a compact capsule in the tab row — monospace time, thin circular progress ring around a play/pause button, work/break label, and a proper settings popover with two labeled steppers ("Arbete" / "Paus") and a full‑width Start button. Smooth transitions on state changes; behaviour unchanged.
- All colors move to design tokens in `src/styles.css` (near‑black surfaces, white text, subtle borders).

## Step 3 — New feature: saved URL groups ("Lägg till grupp")

- Startup screen: button **"Lägg till grupp"** to the right of the URL box. Clicking it slides in a small panel with a group name field, a URL list (pre‑filled with whatever is currently in the box), and **Spara**.
- Saved groups appear as buttons above the URL box on every startup. Clicking one fills the box with that group's URLs (then you press Surf as usual). Small × on each group to delete it (with confirm).
- Persistence: saved in the app's local storage, which Electron keeps on disk in the app's user data folder — survives restarts and works in the future exe. Works in the web preview too.
- Cookies/cache: switch the webview partition to `persist:onlyw` so logins and cache persist between launches on the user's computer.

## Step 4 — Optional but recommended (small)

- Implement the whitelist guard in `main.cjs`: block navigation and new windows to hosts not in the allowed list (matches your spec).
- Include an `electron:package` script (`@electron/packager`) so building the exe later is a single command.

## Technical notes

- Files: `src/routes/index.tsx` (phase switch), `src/components/onlyw/*`, `src/lib/onlyw/{urls,groups,electron}.ts`, `electron/main.cjs`, `electron/preload.cjs`, `src/styles.css` tokens.
- Electron detection: `typeof window.onlyw !== "undefined"` (exposed by preload); web fallback uses no‑ops for maximize/minimize/exit.
- Groups schema in localStorage key `onlyw.groups`: `{ id, name, urls: string[] }[]`.
- No backend needed.
