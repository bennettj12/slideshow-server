const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    getConfig: () => ipcRenderer.invoke('get-config'),
    getStatus: () => ipcRenderer.invoke('get-status'),

    onFolderSelected: (callback) => {
        ipcRenderer.on('folder-selected', callback);
    }
})

