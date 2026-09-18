const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("onlyw", {
  setWhitelist: (lines) => ipcRenderer.invoke("set-whitelist", lines),
  exitApp: () => ipcRenderer.send("exit-app"),
  windowMaximize: () => ipcRenderer.invoke("window-maximize"),
  windowMinimize: () => ipcRenderer.invoke("window-minimize"),
  windowFullscreen: (enable) => ipcRenderer.invoke("window-fullscreen", enable),
  getGroups: () => ipcRenderer.invoke("groups-get"),
  setGroups: (groups) => ipcRenderer.invoke("groups-set", groups),
});
