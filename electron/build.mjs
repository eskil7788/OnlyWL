// Builds a static, file:// friendly bundle for Electron (relative asset paths,
// prerendered "/" page, no server target). Usage: npm run electron:build
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["vite", "build"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, ELECTRON_BUILD: "1" },
});

process.exit(result.status ?? 1);
