/**
 * syncer.js — axios-based remote data pull/push
 *
 * All HTTP requests MUST use axios (XHR adapter). No fetch() allowed.
 * axios instance is re-built each time settings change.
 */
'use strict';

let _axiosInstance = null;
let _spreadsheet = null; // set by renderer.js after init

function getSpreadsheet() { return _spreadsheet; }
function setSpreadsheet(s) { _spreadsheet = s; }

/**
 * Build (or re-build) the axios instance from current config.
 * Called on init and after config save.
 */
async function buildAxiosInstance() {
    const endpoint = await window.electronAPI.getConfig('apiEndpoint', '');
    const token = await window.electronAPI.getConfig('apiToken', '');
    const timeout = await window.electronAPI.getConfig('requestTimeout', 30000);

    _axiosInstance = axios.create({
        baseURL: endpoint || undefined,
        timeout: Number(timeout) || 30000,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return !!endpoint;
}

/** Convert JSON Row[] to x-spreadsheet SheetData[] (single sheet) */
function rowsToSheetData(rows) {
    if (!rows || rows.length === 0) return [{ name: 'Sheet1', rows: {} }];
    const headers = Object.keys(rows[0]);
    const xrows = {};

    // header row
    const headerCells = {};
    headers.forEach((h, ci) => { headerCells[ci] = { text: h, style: { bold: true } }; });
    xrows[0] = { cells: headerCells };

    // data rows
    rows.forEach((row, ri) => {
        const cells = {};
        headers.forEach((h, ci) => {
            const val = row[h];
            cells[ci] = { text: val === null || val === undefined ? '' : String(val) };
        });
        xrows[ri + 1] = { cells };
    });

    return [{ name: 'Sheet1', rows: xrows }];
}

/** Convert x-spreadsheet getData() to JSON Row[] (first sheet only) */
function sheetDataToRows(sheetDataList) {
    const sheet = sheetDataList[0];
    if (!sheet || !sheet.rows) return [];
    const rowsObj = sheet.rows;
    const rowIndices = Object.keys(rowsObj).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
    if (rowIndices.length === 0) return [];

    // First row is treated as header
    const headerRow = rowsObj[rowIndices[0]];
    const headers = {};
    if (headerRow && headerRow.cells) {
        Object.keys(headerRow.cells).forEach(ci => {
            headers[Number(ci)] = (headerRow.cells[ci] || {}).text || `col${ci}`;
        });
    }

    const result = [];
    rowIndices.slice(1).forEach(ri => {
        const rowData = rowsObj[ri];
        if (!rowData || !rowData.cells) return;
        const obj = {};
        Object.keys(headers).forEach(ci => {
            const cell = rowData.cells[Number(ci)];
            obj[headers[ci]] = cell ? cell.text : '';
        });
        result.push(obj);
    });
    return result;
}

async function pullFromServer() {
    if (!_axiosInstance) throw new Error('axios 实例未初始化，请先配置 API Endpoint');
    const response = await _axiosInstance.get('');
    const rows = response.data;
    if (!Array.isArray(rows)) throw new Error('服务端返回数据格式错误，期望 JSON 数组');
    const sheetData = rowsToSheetData(rows);
    if (_spreadsheet) _spreadsheet.loadData(sheetData);
    return sheetData;
}

async function pushToServer() {
    if (!_axiosInstance) throw new Error('axios 实例未初始化，请先配置 API Endpoint');
    if (!_spreadsheet) throw new Error('表格未初始化');
    const sheetDataList = _spreadsheet.getData();
    const rows = sheetDataToRows(sheetDataList);
    await _axiosInstance.post('', rows);
}

window.Syncer = {
    buildAxiosInstance,
    pullFromServer,
    pushToServer,
    rowsToSheetData,
    sheetDataToRows,
    setSpreadsheet,
    getSpreadsheet,
};
