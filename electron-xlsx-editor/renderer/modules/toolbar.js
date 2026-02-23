/**
 * toolbar.js — Custom style toolbar buttons
 *
 * bold / italic: delegates to x-data-spreadsheet's own toolbar.trigger(),
 *   which handles toggle state and sheetReset internally.
 *
 * color / bgcolor / align: calls data.setSelectedCellAttr() then performs
 *   a manual sheetReset (table.render + toolbar.reset + selector.reset)
 *   so the change is reflected immediately without needing to re-click the cell.
 */
'use strict';

let _ss = null;

function setSpreadsheet(ss) { _ss = ss; }

/**
 * sheetReset equivalent: rerender table + sync toolbar state + reset selector ui.
 * Mirrors what x-data-spreadsheet's internal sheetReset() does.
 */
function sheetReset() {
    if (!_ss) return;
    try {
        const sheet = _ss.sheet;
        if (sheet.table && typeof sheet.table.render === 'function') sheet.table.render();
        if (sheet.toolbar && typeof sheet.toolbar.reset === 'function') sheet.toolbar.reset();
        if (sheet.selector && typeof sheet.selector.reset === 'function') sheet.selector.reset();
    } catch (e) {
        console.warn('[toolbar] sheetReset error:', e.message);
    }
}

/**
 * Apply a style attribute to the currently selected cells.
 * For color / bgcolor / align — uses setSelectedCellAttr + sheetReset.
 */
function applyAttr(key, value) {
    if (!_ss) return;
    try {
        const sheet = _ss.sheet;
        if (sheet && sheet.data && typeof sheet.data.setSelectedCellAttr === 'function') {
            sheet.data.setSelectedCellAttr(key, value);
            sheetReset();
            if (window.electronAPI) window.electronAPI.setDirty(true);
        } else {
            console.warn('[toolbar] setSelectedCellAttr unavailable');
        }
    } catch (e) {
        console.warn('[toolbar] applyAttr error:', e.message);
    }
}

/**
 * Trigger bold/italic via the built-in toolbar element.
 * toolbar.trigger(name) calls boldEl.click() which toggles state and fires
 * toolbarChange → setSelectedCellAttr + sheetReset automatically.
 */
function triggerBuiltin(name) {
    if (!_ss) return;
    try {
        const toolbar = _ss.sheet && _ss.sheet.toolbar;
        if (toolbar && typeof toolbar.trigger === 'function') {
            toolbar.trigger(name);
            if (window.electronAPI) window.electronAPI.setDirty(true);
        } else {
            console.warn('[toolbar] toolbar.trigger unavailable for:', name);
        }
    } catch (e) {
        console.warn('[toolbar] triggerBuiltin error:', e.message);
    }
}

function initToolbarStyles(ss) {
    setSpreadsheet(ss);

    // Bold — uses built-in toggle path (key: 'font-bold')
    document.getElementById('btn-bold').addEventListener('click', () => triggerBuiltin('bold'));

    // Italic — uses built-in toggle path (key: 'font-italic')
    document.getElementById('btn-italic').addEventListener('click', () => triggerBuiltin('italic'));

    // Font color
    const colorFontInput = document.getElementById('color-font');
    colorFontInput.addEventListener('change', () => applyAttr('color', colorFontInput.value));
    document.querySelector('div[title="字体颜色"] label').addEventListener('click', () => colorFontInput.click());

    // Background color
    const colorBgInput = document.getElementById('color-bg');
    colorBgInput.addEventListener('change', () => applyAttr('bgcolor', colorBgInput.value));
    document.querySelector('div[title="背景颜色"] label').addEventListener('click', () => colorBgInput.click());

    // Alignment
    document.getElementById('btn-align-left').addEventListener('click', () => applyAttr('align', 'left'));
    document.getElementById('btn-align-center').addEventListener('click', () => applyAttr('align', 'center'));
    document.getElementById('btn-align-right').addEventListener('click', () => applyAttr('align', 'right'));
}

window.Toolbar = { initToolbarStyles };
