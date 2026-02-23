/**
 * exporter.js — x-data-spreadsheet SheetData[] → SheetJS (xlsx) → base64 xlsx
 *
 * 支持合并单元格：x-spreadsheet merges[] → SheetJS ws['!merges']
 */
'use strict';

/**
 * Export x-data-spreadsheet getData() result to a base64-encoded xlsx string.
 *
 * @param {Array} sheetDataList  — result of spreadsheet.getData()
 * @returns {Promise<string>}    — base64 encoded xlsx buffer
 */
async function exportToBase64(sheetDataList) {
    const workbook = XLSX.utils.book_new();

    sheetDataList.forEach((sheetData) => {
        const sheetName = (sheetData.name || 'Sheet1').slice(0, 31);
        const rowsObj = sheetData.rows || {};
        const mergesList = sheetData.merges || []; // ['A1:B2', ...]

        // 计算最大行列范围
        const rowIndices = Object.keys(rowsObj).map(Number).filter(n => !isNaN(n));
        let maxRow = rowIndices.length > 0 ? Math.max(...rowIndices) : 0;
        let maxCol = 0;
        rowIndices.forEach(r => {
            const cells = rowsObj[r] && rowsObj[r].cells ? rowsObj[r].cells : {};
            const cols = Object.keys(cells).map(Number).filter(n => !isNaN(n));
            if (cols.length > 0) maxCol = Math.max(maxCol, Math.max(...cols));
        });

        // 构建 aoa（二维数组）
        const aoa = [];
        for (let r = 0; r <= maxRow; r++) {
            const rowData = rowsObj[r];
            const cells = rowData && rowData.cells ? rowData.cells : {};
            const row = [];
            for (let c = 0; c <= maxCol; c++) {
                const cellData = cells[c];
                row.push(cellData ? (cellData.text || '') : '');
            }
            aoa.push(row);
        }

        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // ── 写入合并单元格 ──────────────────────────────────────────────
        // x-spreadsheet 的 merges: ['A1:B2', 'C3:D4', ...]
        if (mergesList.length > 0) {
            ws['!merges'] = mergesList.map(addr => XLSX.utils.decode_range(addr));
        }


        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    });

    if (workbook.SheetNames.length === 0) {
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([]), 'Sheet1');
    }

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
}

window.Exporter = { exportToBase64 };
