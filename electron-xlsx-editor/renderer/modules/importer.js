/**
 * importer.js — SheetJS (xlsx) base64 → x-data-spreadsheet SheetData[]
 *
 * 支持合并单元格：SheetJS ws['!merges'] → x-spreadsheet merges[] + cell.merge
 */
'use strict';

/**
 * Import an xlsx/xls file from a base64-encoded string and return SheetData[] for x-spreadsheet.
 *
 * @param {string} base64  — base64 encoded .xlsx/.xls file content
 * @returns {Promise<Array<{name:string, rows:object, merges:string[]}>>}
 */
async function importFromBase64(base64) {
    const workbook = XLSX.read(base64, { type: 'base64', cellDates: true });

    const sheets = [];

    workbook.SheetNames.forEach((sheetName) => {
        const ws = workbook.Sheets[sheetName];

        const ref = ws['!ref'];
        if (!ref) {
            sheets.push({ name: sheetName, rows: { len: 100 }, cols: { len: 26 }, merges: [] });
            return;
        }

        const range = XLSX.utils.decode_range(ref);

        // ── 解析合并单元格 ──────────────────────────────────────────────
        // SheetJS: ws['!merges'] = [{s:{r,c}, e:{r,c}}, ...]
        // x-spreadsheet: merges = ['A1:B2', ...] + cell.merge = [rowspan-1, colspan-1]
        const xsMerges = []; // 字符串数组，给 x-spreadsheet 顶层 merges 用
        // mergeMap: "r,c" → [rn, cn]，给起始单元格写 cell.merge
        const mergeMap = {};

        (ws['!merges'] || []).forEach((m) => {
            const addrStr = XLSX.utils.encode_range(m);
            xsMerges.push(addrStr);
            const rn = m.e.r - m.s.r; // rowspan - 1
            const cn = m.e.c - m.s.c; // colspan - 1
            mergeMap[`${m.s.r},${m.s.c}`] = [rn, cn];
        });

        // ── 解析单元格数据 ──────────────────────────────────────────────
        const rows = {};

        for (let r = range.s.r; r <= range.e.r; r++) {
            const cells = {};
            for (let c = range.s.c; c <= range.e.c; c++) {
                const cellAddress = XLSX.utils.encode_cell({ r, c });
                const cell = ws[cellAddress];

                // 即使单元格为空，如果是合并起始格也需要写入
                const mergeKey = `${r},${c}`;
                const hasMerge = mergeMap[mergeKey] !== undefined;

                if (!cell && !hasMerge) continue;

                const cellData = {};

                if (cell) {
                    // 取显示值
                    let text = '';
                    if (cell.t === 'd' && cell.v instanceof Date) {
                        text = cell.v.toLocaleDateString('zh-CN');
                    } else if (cell.w !== undefined && cell.w !== null) {
                        text = String(cell.w);
                    } else if (cell.v !== undefined && cell.v !== null) {
                        text = String(cell.v);
                    }
                    cellData.text = text;
                }


                // 写入合并信息到起始单元格
                if (hasMerge) {
                    cellData.merge = mergeMap[mergeKey]; // [rn, cn]
                }

                cells[c - range.s.c] = cellData;
            }

            if (Object.keys(cells).length > 0) {
                rows[r - range.s.r] = { cells };
            }
        }

        // 实际行列数 + 缓冲，避免 x-spreadsheet 默认 100×26 截断内容
        const actualRows = range.e.r - range.s.r + 1;
        const actualCols = range.e.c - range.s.c + 1;
        const rowLen = Math.max(100, actualRows + 20);
        const colLen = Math.max(26, actualCols + 5);
        rows.len = rowLen;

        sheets.push({ name: sheetName, rows, cols: { len: colLen }, merges: xsMerges });
    });

    if (sheets.length === 0) sheets.push({ name: 'Sheet1', rows: {}, merges: [] });

    return sheets;
}

// Expose globally (plain script, not ESM)
window.Importer = { importFromBase64 };
