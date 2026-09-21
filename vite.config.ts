// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import {
  defineConfig,
  type LovableViteTanstackOptions,
} from "@lovable.dev/vite-tanstack-config";

// ELECTRON_BUILD=1 (npm run electron:build) produces a static bundle that the
// desktop app can load from disk: relative asset paths + prerendered "/".
const electronBuild = process.env["ELECTRON_BUILD"] === "1";

const electronOptions: LovableViteTanstackOptions = {
  vite: { base: "./" },
  nitro: false,
  tanstackStart: {
    server: { entry: "server" },
    prerender: { enabled: true, crawlLinks: false },
    pages: [{ path: "/" }],
  },
};

const webOptions: LovableViteTanstackOptions = {
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
};

export default defineConfig(electronBuild ? electronOptions : webOptions);
