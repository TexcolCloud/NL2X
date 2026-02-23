/**
 * exporter.js — x-data-spreadsheet SheetData[] → ExcelJS → base64 xlsx
 *
 * Runs entirely in the renderer process. The resulting base64 string
 * is sent to the main process via IPC for file system write.
 */
'use strict';

/**
 * Map CSS color string (#RRGGBB) to ExcelJS ARGB ("FFRRGGBB").
 * @param {string|undefined} hex
 * @returns {string|undefined}
 */
function hexToArgb(hex) {
    if (!hex) return undefined;
    const clean = hex.replace('#', '');
    if (clean.length === 6) return 'FF' + clean.toUpperCase();
    return undefined;
}

/**
 * Export x-data-spreadsheet getData() result to a base64-encoded xlsx string.
 *
 * @param {Array} sheetDataList  — result of spreadsheet.getData()
 * @returns {Promise<string>}    — base64 encoded xlsx buffer
 */
async function exportToBase64(sheetDataList) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'xlsx Editor';
    workbook.created = new Date();

    sheetDataList.forEach((sheetData) => {
        const sheetName = sheetData.name || 'Sheet1';
        const worksheet = workbook.addWorksheet(sheetName);
        const rowsObj = sheetData.rows || {};

        // Find max row and col indices
        const rowIndices = Object.keys(rowsObj).map(Number).filter(n => !isNaN(n));

        rowIndices.forEach((rowIdx) => {
            const rowData = rowsObj[rowIdx];
            if (!rowData || !rowData.cells) return;
            const cellsObj = rowData.cells;

            Object.keys(cellsObj).forEach((colIdxStr) => {
                const colIdx = Number(colIdxStr);
                const cellData = cellsObj[colIdx];
                if (!cellData) return;

                // ExcelJS uses 1-based row/col
                const cell = worksheet.getRow(rowIdx + 1).getCell(colIdx + 1);
                cell.value = cellData.text || '';

                const style = cellData.style || {};

                // Font
                const fontDef = {};
                if (style.bold) fontDef.bold = true;
                if (style.italic) fontDef.italic = true;
                const fontArgb = hexToArgb(style.color);
                if (fontArgb) fontDef.color = { argb: fontArgb };
                if (Object.keys(fontDef).length > 0) cell.font = fontDef;

                // Fill
                const bgArgb = hexToArgb(style.bgcolor);
                if (bgArgb) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: bgArgb },
                    };
                }

                // Alignment
                if (style.align) {
                    cell.alignment = { horizontal: style.align };
                }
            });
        });
    });

    // Write to buffer → convert to base64
    const uint8 = await workbook.xlsx.writeBuffer();
    // uint8 is a Buffer in Node-polyfilled context; use Uint8Array
    const bytes = new Uint8Array(uint8);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

window.Exporter = { exportToBase64 };
