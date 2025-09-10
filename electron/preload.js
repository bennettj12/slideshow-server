const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    getConfig: () => ipcRenderer.invoke('get-config'),
    getStatus: () => ipcRenderer.invoke('get-status'),
    closeButtonPressed: () => ipcRenderer.invoke('close-button-pressed'),
    minimizeButtonPressed: () => ipcRenderer.invoke('minimize-button-pressed'),

    onFolderSelected: (callback) => {
        ipcRenderer.on('folder-selected', callback);
    },
    onServerStarted: (callback) => {
        ipcRenderer.on('server-started', callback)
    },
    onIpFound: (callback) => {
        ipcRenderer.on('ip-found', callback)
    },
    onServerEnded: (callback) => {
        ipcRenderer.on('server-ended', callback)
    }
})

