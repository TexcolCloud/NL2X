/**
 * renderer.js — Main renderer process entry point.
 *
 * Orchestrates: x-data-spreadsheet, Importer, Exporter, Syncer, Toolbar.
 * All IPC calls go through window.electronAPI (contextBridge whitelist).
 */
'use strict';

// ─── Globals ─────────────────────────────────────────────────────────────────
let spreadsheet = null;
let currentFileName = 'untitled.xlsx';

// ─── UI helpers ──────────────────────────────────────────────────────────────
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast' + (isError ? ' error' : '');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = 'toast hidden'; }, 3500);
}

function showError(msg) {
    document.getElementById('modal-error-msg').textContent = msg;
    document.getElementById('modal-error').classList.remove('hidden');
}

function setLoading(buttonIds, isLoading) {
    buttonIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = isLoading;
    });
}

// ─── Spreadsheet init ─────────────────────────────────────────────────────────
function initSpreadsheet() {
    const container = document.getElementById('spreadsheet-container');
    spreadsheet = new x_spreadsheet(container, {
        mode: 'edit',
        showToolbar: true,
        showContextmenu: true,
        view: {
            height: () => container.clientHeight,
            width: () => container.clientWidth,
        },
    });

    // Mark dirty on change
    spreadsheet.change(() => {
        window.electronAPI.setDirty(true);
    });

    // Make available to submodules
    Syncer.setSpreadsheet(spreadsheet);
    Toolbar.initToolbarStyles(spreadsheet);

    return spreadsheet;
}

// ─── Import ───────────────────────────────────────────────────────────────────
async function openFile(base64Payload) {
    try {
        let payload = base64Payload;
        if (!payload) {
            payload = await window.electronAPI.openFile();
        }
        if (!payload) return;

        const sheetData = await Importer.importFromBase64(payload.base64);
        spreadsheet.loadData(sheetData);
        currentFileName = payload.fileName || 'untitled.xlsx';
        window.electronAPI.setTitle(currentFileName);
        window.electronAPI.setDirty(false);
        showToast(`✅ 已导入：${currentFileName}`);
    } catch (err) {
        showError('导入失败：' + (err.message || String(err)));
    }
}

// ─── Export ───────────────────────────────────────────────────────────────────
async function saveFile() {
    try {
        setLoading(['btn-save'], true);
        const sheetDataList = spreadsheet.getData();
        const base64 = await Exporter.exportToBase64(sheetDataList);
        const savedPath = await window.electronAPI.saveFile({ base64, defaultName: currentFileName });
        if (savedPath) {
            currentFileName = savedPath.split(/[\\/]/).pop();
            window.electronAPI.setTitle(currentFileName);
            window.electronAPI.setDirty(false);
            showToast(`💾 文件已保存：${savedPath}`);
        }
    } catch (err) {
        showError('导出失败：' + (err.message || String(err)));
    } finally {
        setLoading(['btn-save'], false);
    }
}

// ─── Remote sync ──────────────────────────────────────────────────────────────
async function pullData() {
    setLoading(['btn-pull', 'btn-push'], true);
    try {
        await Syncer.pullFromServer();
        window.electronAPI.setDirty(true);
        showToast('⬇ 数据拉取成功');
    } catch (err) {
        const msg = err.response
            ? `HTTP ${err.response.status}: ${err.response.statusText}`
            : err.message || String(err);
        showError('拉取失败：' + msg);
    } finally {
        setLoading(['btn-pull', 'btn-push'], false);
    }
}

async function pushData() {
    setLoading(['btn-pull', 'btn-push'], true);
    try {
        await Syncer.pushToServer();
        showToast('⬆ 数据推送成功');
    } catch (err) {
        const msg = err.response
            ? `HTTP ${err.response.status}: ${err.response.statusText}`
            : err.message || String(err);
        showError('推送失败：' + msg);
    } finally {
        setLoading(['btn-pull', 'btn-push'], false);
    }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
async function openSettings() {
    const ep = await window.electronAPI.getConfig('apiEndpoint', '');
    const token = await window.electronAPI.getConfig('apiToken', '');
    const timeout = await window.electronAPI.getConfig('requestTimeout', 30000);
    document.getElementById('cfg-endpoint').value = ep;
    document.getElementById('cfg-token').value = token;
    document.getElementById('cfg-timeout').value = timeout;
    document.getElementById('modal-settings').classList.remove('hidden');
}

async function saveSettings() {
    const ep = document.getElementById('cfg-endpoint').value.trim();
    const token = document.getElementById('cfg-token').value.trim();
    const timeout = parseInt(document.getElementById('cfg-timeout').value, 10) || 30000;
    await window.electronAPI.setConfig('apiEndpoint', ep);
    await window.electronAPI.setConfig('apiToken', token);
    await window.electronAPI.setConfig('requestTimeout', timeout);
    document.getElementById('modal-settings').classList.add('hidden');

    const hasEndpoint = await Syncer.buildAxiosInstance();
    updateSyncButtons(hasEndpoint);
    showToast('⚙ 设置已保存');
}

function updateSyncButtons(hasEndpoint) {
    ['btn-pull', 'btn-push'].forEach(id => {
        document.getElementById(id).disabled = !hasEndpoint;
    });
}

// ─── Drag & drop ──────────────────────────────────────────────────────────────
function initDragDrop() {
    const overlay = document.getElementById('drop-overlay');

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        overlay.classList.add('active');
    });
    document.addEventListener('dragleave', (e) => {
        if (e.relatedTarget === null) overlay.classList.remove('active');
    });
    document.addEventListener('drop', async (e) => {
        e.preventDefault();
        overlay.classList.remove('active');
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(ext)) {
            showError(`不支持的文件格式：.${ext}。请拖入 .xlsx 或 .xls 文件。`);
            return;
        }
        // Read dragged file as ArrayBuffer → base64
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const arrayBuffer = ev.target.result;
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            const base64 = btoa(binary);
            await openFile({ base64, fileName: file.name });
        };
        reader.readAsArrayBuffer(file);
    });
}

// ─── Event wiring ─────────────────────────────────────────────────────────────
function bindEvents() {
    document.getElementById('btn-open').addEventListener('click', () => openFile(null));
    document.getElementById('btn-save').addEventListener('click', saveFile);
    document.getElementById('btn-pull').addEventListener('click', pullData);
    document.getElementById('btn-push').addEventListener('click', pushData);
    document.getElementById('btn-settings').addEventListener('click', openSettings);

    // Settings modal
    document.getElementById('cfg-save').addEventListener('click', saveSettings);
    document.getElementById('cfg-cancel').addEventListener('click', () => {
        document.getElementById('modal-settings').classList.add('hidden');
    });

    // Error modal
    document.getElementById('modal-error-close').addEventListener('click', () => {
        document.getElementById('modal-error').classList.add('hidden');
    });

    // Menu events from main process
    window.electronAPI.onMenuOpen(() => openFile(null));
    window.electronAPI.onMenuSave(() => saveFile());

    // Save-and-close triggered by main (unsaved changes guard)
    window.electronAPI.onTriggerSaveClose(async () => {
        await saveFile();
        window.electronAPI.saveCloseDone();
    });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
(async function main() {
    initSpreadsheet();
    bindEvents();
    initDragDrop();

    // Init axios and sync button state
    const hasEndpoint = await Syncer.buildAxiosInstance();
    updateSyncButtons(hasEndpoint);
})();
