const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;
let allowedHosts = new Set();

function isAllowedHost(hostname) {
  if (!hostname) return false;
  for (const h of allowedHosts) {
    if (hostname === h || hostname.endsWith("." + h)) return true;
  }
  return false;
}

function isAllowedUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "about:" || u.protocol === "data:" || u.protocol === "blob:") return true;
    return isAllowedHost(u.hostname);
  } catch {
    return false;
  }
}

function findIndexHtml() {
  const candidates = [
    path.join(__dirname, "..", "dist", "client", "index.html"),
    path.join(__dirname, "..", ".output", "public", "index.html"),
    path.join(__dirname, "..", "dist", "index.html"),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  });

  mainWindow.removeMenu();

  const devUrl = process.env.ONLYW_DEV_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    const indexHtml = findIndexHtml();
    if (!indexHtml) {
      mainWindow.loadURL(
        "data:text/html,<body style='background:#000;color:#fff;font-family:sans-serif;padding:40px'>Bygg appen först: <code>npm run electron:build</code></body>",
      );
    } else {
      mainWindow.loadFile(indexHtml);
    }
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

// Whitelist guard for every embedded page (webview contents)
app.on("web-contents-created", (_event, contents) => {
  if (contents.getType() !== "webview") return;

  contents.on("will-navigate", (event, url) => {
    if (!isAllowedUrl(url)) event.preventDefault();
  });

  contents.setWindowOpenHandler(({ url }) => {
    if (isAllowedUrl(url)) contents.loadURL(url);
    return { action: "deny" };
  });
});

ipcMain.handle("set-whitelist", (_event, lines) => {
  const urls = [];
  const hosts = new Set();
  for (const raw of lines || []) {
    const s = String(raw || "").trim();
    if (!s) continue;
    const candidate = /^https?:\/\//i.test(s) ? s : "https://" + s;
    try {
      const u = new URL(candidate);
      urls.push(u.toString());
      hosts.add(u.hostname);
    } catch {
      // ignore invalid lines
    }
  }
  allowedHosts = hosts;
  return { urls, hosts: Array.from(hosts) };
});

ipcMain.handle("window-maximize", () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});

ipcMain.handle("window-minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle("window-fullscreen", (_event, enable) => {
  if (mainWindow) mainWindow.setFullScreen(Boolean(enable));
});

ipcMain.on("exit-app", () => {
  app.quit();
});
