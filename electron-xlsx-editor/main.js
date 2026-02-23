'use strict';

const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
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

// agent:call — send LLM API request from main process (avoids renderer CORS)
ipcMain.handle('agent:call', async (_, { baseUrl, apiKey, systemPrompt, userInput, headers, model }) => {
    // Build full system message: fixed prefix + column names + user custom prompt
    const colNames = Array.isArray(headers) && headers.length > 0 ? headers.join('、') : '（无列名）';
    const fullSystemPrompt =
        `你是一个结构化数据解析助手。当前表格列名为：[${colNames}]。\n` +
        `请将用户输入解析为 JSON 对象，key 必须严格对应列名，缺失的字段留 null。\n` +
        `只输出 JSON，不要其他内容。` +
        (systemPrompt ? `\n\n${systemPrompt}` : '');

    const requestBody = JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: fullSystemPrompt },
            { role: 'user', content: userInput },
        ],
    });

    // Parse baseUrl to get host, port, path
    let parsedUrl;
    try {
        parsedUrl = new URL(baseUrl);
    } catch {
        return { error: '无效的 Base URL 格式' };
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;
    const port = parsedUrl.port ? parseInt(parsedUrl.port) : (isHttps ? 443 : 80);
    const basePath = parsedUrl.pathname.replace(/\/v1\/?$/, '').replace(/\/$/, '');
    const apiPath = basePath + '/v1/chat/completions';

    // 读取用户配置的超时时间，默认 120s（国内模型推理时间较长）
    const timeoutMs = store.get('requestTimeout', 120000);

    return new Promise((resolve) => {
        const options = {
            hostname: parsedUrl.hostname,
            port,
            path: apiPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Length': Buffer.byteLength(requestBody),
            },
        };

        let settled = false;
        const done = (val) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(val);
        };

        // 用普通 setTimeout 做绝对超时（而非 req.setTimeout 的 idle 超时）
        // 避免 LLM 推理期间服务器没有返回任何数据时被误判
        const timer = setTimeout(() => {
            req.destroy();
            done({ error: `请求超时（${Math.round(timeoutMs / 1000)}s）` });
        }, timeoutMs);

        const req = lib.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    done({ error: `HTTP ${res.statusCode}: ${data.slice(0, 200)}` });
                    return;
                }
                try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.message?.content?.trim() ?? '';
                    // Strip markdown code fences if present
                    const cleaned = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
                    const parsed = JSON.parse(cleaned);
                    done(parsed);
                } catch (e) {
                    done({ error: `LLM 返回内容无法解析为 JSON：${data.slice(0, 200)}` });
                }
            });
        });

        req.on('error', (e) => {
            done({ error: `网络请求失败：${e.message}` });
        });

        req.write(requestBody);
        req.end();
    });
});


// agent:test — minimal connectivity/auth check (does NOT parse row data)
ipcMain.handle('agent:test', async (_, { baseUrl, apiKey, model }) => {
    let parsedUrl;
    try { parsedUrl = new URL(baseUrl); } catch {
        return { error: '无效的 Base URL 格式' };
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;
    const port = parsedUrl.port ? parseInt(parsedUrl.port) : (isHttps ? 443 : 80);
    const basePath = parsedUrl.pathname.replace(/\/v1\/?$/, '').replace(/\/$/, '');
    const apiPath = basePath + '/v1/chat/completions';

    const body = JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
    });

    return new Promise((resolve) => {
        const req = lib.request({
            hostname: parsedUrl.hostname,
            port,
            path: apiPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Length': Buffer.byteLength(body),
            },
        }, (res) => {
            let data = '';
            res.on('data', (c) => { data += c; });
            res.on('end', () => {
                if (res.statusCode === 401) {
                    resolve({ error: `鉴权失败（401）：API Key 不正确` });
                } else if (res.statusCode === 404) {
                    resolve({ error: `地址不存在（404）：请检查 Base URL` });
                } else if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const j = JSON.parse(data);
                        resolve({ success: true, model: j.model || '未知' });
                    } catch {
                        resolve({ success: true, model: '未知' });
                    }
                } else {
                    resolve({ error: `HTTP ${res.statusCode}: ${data.slice(0, 120)}` });
                }
            });
        });
        req.on('error', (e) => resolve({ error: `网络错误：${e.message}` }));
        req.setTimeout(15000, () => { req.destroy(); resolve({ error: '连接超时（15s）' }); });
        req.write(body);
        req.end();
    });
});

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
