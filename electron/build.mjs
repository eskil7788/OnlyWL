// Builds a static, file:// friendly bundle for Electron.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const result = spawnSync("npx", ["vite", "build"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, ELECTRON_BUILD: "1" },
});

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1);
}

const indexPath = path.resolve("dist", "client", "index.html");

if (!fs.existsSync(indexPath)) {
  console.error(`Electron build: could not find ${indexPath}`);
  process.exit(1);
}

let html = fs.readFileSync(indexPath, "utf8");

// TanStack Start generates root-relative asset paths.
// Electron loads index.html through file://, so make these paths relative.
html = html.replaceAll('="/./assets/', '="./assets/');
html = html.replaceAll('="/favicon.ico"', '="./favicon.ico"');

fs.writeFileSync(indexPath, html, "utf8");

console.log("Electron build: fixed local asset paths.");