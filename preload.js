const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('onlyw', {
  setWhitelist: (lines) => ipcRenderer.invoke('set-whitelist', lines),
  onWhitelistReady: (cb) => ipcRenderer.on('whitelist-ready', (e, data) => cb(data)),
  exitApp: () => ipcRenderer.send('exit-app'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowFullscreen: (enable) => ipcRenderer.invoke('window-fullscreen', enable)
});
