/**
 * importer.js — ExcelJS ArrayBuffer → x-data-spreadsheet SheetData[]
 *
 * ExcelJS runs in the renderer process (pure JS, no C++ binding).
 * The main process reads file bytes and returns them as a base64 string via IPC.
 */
'use strict';

/**
 * Convert an ExcelJS cell alignment to x-spreadsheet align string.
 * @param {object|undefined} alignment
 * @returns {'left'|'center'|'right'|undefined}
 */
function mapAlign(alignment) {
    if (!alignment) return undefined;
    const h = (alignment.horizontal || '').toLowerCase();
    if (h === 'center' || h === 'centre') return 'center';
    if (h === 'right') return 'right';
    if (h === 'left') return 'left';
    return undefined;
}

/**
 * Convert an ExcelJS ARGB color string to CSS hex.
 * ExcelJS stores colors as "FFRRGGBB" (ARGB).
 * @param {object|undefined} colorObj  e.g. { argb: 'FF112233' }
 * @returns {string|undefined}
 */
function argbToHex(colorObj) {
    if (!colorObj || !colorObj.argb) return undefined;
    const argb = colorObj.argb;
    if (argb.length === 8) return '#' + argb.slice(2); // drop alpha
    return undefined;
}

/**
 * Import an xlsx file from a base64-encoded string and return SheetData[] for x-spreadsheet.
 *
 * @param {string} base64  — base64 encoded .xlsx file content
 * @returns {Promise<Array<{name:string, rows:{cells:object}[]}>>}
 */
async function importFromBase64(base64) {
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes.buffer);

    const sheets = [];

    workbook.eachSheet((worksheet, sheetId) => {
        // x-spreadsheet rows format: { 0: { cells: { 0: {text,style}, 1: ... } }, ... }
        const rows = {};

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            const cells = {};
            row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                const cellData = {};

                // Value
                let val = cell.value;
                if (val === null || val === undefined) {
                    val = '';
                } else if (typeof val === 'object' && val.result !== undefined) {
                    // formula result
                    val = val.result;
                } else if (val instanceof Date) {
                    val = val.toLocaleDateString('zh-CN');
                }
                cellData.text = String(val);

                // Style
                const style = {};
                const font = cell.font || {};
                if (font.bold) style.bold = true;
                if (font.italic) style.italic = true;

                const fontColor = argbToHex(font.color);
                if (fontColor) style.color = fontColor;

                const fill = cell.fill || {};
                if (fill.type === 'pattern' && fill.fgColor) {
                    const bgColor = argbToHex(fill.fgColor);
                    if (bgColor && bgColor !== '#ffffff' && bgColor !== '#FFFFFF') {
                        style.bgcolor = bgColor;
                    }
                }

                const align = mapAlign(cell.alignment);
                if (align) style.align = align;

                if (Object.keys(style).length > 0) cellData.style = style;

                cells[colNumber - 1] = cellData;
            });

            rows[rowNumber - 1] = { cells };
        });

        sheets.push({ name: worksheet.name, rows });
    });

    // x-spreadsheet expects at least one sheet
    if (sheets.length === 0) sheets.push({ name: 'Sheet1', rows: {} });

    return sheets;
}

// Expose globally (plain script, not ESM)
window.Importer = { importFromBase64 };
