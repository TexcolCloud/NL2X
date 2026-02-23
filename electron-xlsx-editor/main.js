'use strict';

const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

const store = new Store();

let mainWindow = null;
let isDirty = false; // tracks unsaved changes

// ─── Window ───────────────────────────────────────────────────────────────────
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'xlsx Editor',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    // Before close: ask renderer if there are unsaved changes
    mainWindow.on('close', (e) => {
        if (isDirty) {
            e.preventDefault();
            const choice = dialog.showMessageBoxSync(mainWindow, {
                type: 'question',
                buttons: ['保存', '不保存', '取消'],
                defaultId: 0,
                cancelId: 2,
                title: '未保存的更改',
                message: '当前文件有未保存的更改，是否保存？',
            });
            if (choice === 0) {
                // Save then close
                mainWindow.webContents.send('trigger-save-close');
            } else if (choice === 1) {
                isDirty = false;
                mainWindow.close();
            }
            // choice === 2 → cancel, do nothing
        }
    });

    mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── Menu ─────────────────────────────────────────────────────────────────────
function buildMenu() {
    const template = [
        {
            label: '文件',
            submenu: [
                {
                    label: '打开…',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => mainWindow && mainWindow.webContents.send('menu-open'),
                },
                {
                    label: '另存为…',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => mainWindow && mainWindow.webContents.send('menu-save'),
                },
                { type: 'separator' },
                {
                    label: '退出',
                    accelerator: 'Alt+F4',
                    click: () => app.quit(),
                },
            ],
        },
        {
            label: '编辑',
            submenu: [
                { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: '重做', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
                { type: 'separator' },
                { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
            ],
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '打开开发者工具',
                    accelerator: 'F12',
                    click: () => mainWindow && mainWindow.webContents.openDevTools(),
                },
            ],
        },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

// file:open → returns { buffer: Buffer (base64-encoded), fileName }
ipcMain.handle('file:open', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: '打开 Excel 文件',
        filters: [{ name: 'Excel 文件', extensions: ['xlsx', 'xls'] }],
        properties: ['openFile'],
    });
    if (canceled || filePaths.length === 0) return null;

    const filePath = filePaths[0];
    const buffer = await fs.promises.readFile(filePath);
    // Transfer as base64 string through IPC (ArrayBuffer serialization issue in older Electron)
    return { base64: buffer.toString('base64'), fileName: path.basename(filePath) };
});

// file:save → { base64: string, defaultName: string } → returns saved filePath or null
ipcMain.handle('file:save', async (_, { base64, defaultName }) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: '另存为',
        defaultPath: defaultName || 'untitled.xlsx',
        filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }],
    });
    if (canceled || !filePath) return null;

    const buf = Buffer.from(base64, 'base64');
    await fs.promises.writeFile(filePath, buf);
    return filePath;
});

// config:get / config:set — backed by electron-store
ipcMain.handle('config:get', (_, key, defaultValue) => store.get(key, defaultValue));
ipcMain.handle('config:set', (_, key, value) => { store.set(key, value); });

// dirty-state tracking from renderer
ipcMain.on('set-dirty', (_, value) => {
    isDirty = Boolean(value);
    if (mainWindow) {
        const title = store.get('currentFileName', '');
        mainWindow.setTitle(`${title ? title + ' — ' : ''}xlsx Editor${isDirty ? ' [未保存]' : ''}`);
    }
});

// set window title from renderer
ipcMain.on('set-title', (_, fileName) => {
    store.set('currentFileName', fileName);
    isDirty = false;
    if (mainWindow) mainWindow.setTitle(`${fileName} — xlsx Editor`);
});

// renderer signals save-and-close done
ipcMain.on('save-close-done', () => {
    isDirty = false;
    mainWindow && mainWindow.close();
});

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
    buildMenu();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});
