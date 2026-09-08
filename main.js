const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      webviewTag: true
    }
  });

  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.handle('set-whitelist', (event, lines) => {
  // Normalize input lines into URLs and extract hosts
  const urls = [];
  const hosts = new Set();

  for (let raw of lines) {
    const s = String(raw || '').trim();
    if (!s) continue;
    let candidate = s;
    if (!/^https?:\/\//i.test(candidate)) {
      candidate = 'https://' + candidate;
    }
    try {
      const u = new URL(candidate);
      urls.push(u.toString());
      hosts.add(u.hostname);
    } catch (err) {
      // ignore invalid lines
    }
  }

  // Reply with normalized urls and allowed hosts
  const data = { urls, hosts: Array.from(hosts) };
  // Send a one-time message back to renderer
  event.sender.send('whitelist-ready', data);
  return data;
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.handle('window-fullscreen', (event, enable) => {
  mainWindow.setFullScreen(enable);
});

ipcMain.on('exit-app', () => {
  app.quit();
});
