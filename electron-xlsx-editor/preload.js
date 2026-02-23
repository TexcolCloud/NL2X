'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // File operations
    openFile: () => ipcRenderer.invoke('file:open'),
    saveFile: (payload) => ipcRenderer.invoke('file:save', payload),

    // Config
    getConfig: (key, defaultValue) => ipcRenderer.invoke('config:get', key, defaultValue),
    setConfig: (key, value) => ipcRenderer.invoke('config:set', key, value),

    // Window state
    setDirty: (value) => ipcRenderer.send('set-dirty', value),
    setTitle: (fileName) => ipcRenderer.send('set-title', fileName),
    saveCloseDone: () => ipcRenderer.send('save-close-done'),

    // From main to renderer
    onMenuOpen: (callback) => ipcRenderer.on('menu-open', callback),
    onMenuSave: (callback) => ipcRenderer.on('menu-save', callback),
    onTriggerSaveClose: (callback) => ipcRenderer.on('trigger-save-close', callback),
});
