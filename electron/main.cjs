const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;
let allowedHosts = new Set();

// Saved URL groups live in a plain JSON file inside the app's user data folder,
// so they survive restarts. Only group names and URLs are stored here.
function groupsFile() {
  return path.join(app.getPath("userData"), "groups.json");
}

function readGroups() {
  try {
    const raw = fs.readFileSync(groupsFile(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGroups(groups) {
  try {
    const clean = (Array.isArray(groups) ? groups : [])
      .filter((g) => g && typeof g.id === "string" && typeof g.name === "string" && Array.isArray(g.urls))
      .map((g) => ({ id: g.id, name: g.name, urls: g.urls.map(String) }));
    fs.writeFileSync(groupsFile(), JSON.stringify(clean, null, 2), "utf8");
  } catch {
    // ignore write failures (read-only install folder, etc.)
  }
}

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
    title: "OnlyWL",
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "onlywl.ico"),
    backgroundColor: "#000000",
    frame: false, 
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  });

  mainWindow.removeMenu();

  const devUrl = process.env.ONLYWL_DEV_URL;
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

app.whenReady().then(() => {
  // Keep cookies and cache (so logins stick) but never keep saved HTTP credentials.
  try {
    session.fromPartition("persist:onlyw").clearAuthCache();
  } catch {
    // ignore
  }
  createWindow();
});

app.on("window-all-closed", () => {
  app.quit();
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

ipcMain.handle("groups-get", () => readGroups());

ipcMain.handle("groups-set", (_event, groups) => {
  writeGroups(groups);
});
