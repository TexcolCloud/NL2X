/**
 * toolbar.js — 样式工具栏（已移除）
 *
 * SheetJS 社区版不支持写入 cell styles（粗体/斜体/字色/背景/对齐），
 * 样式数据无法持久化到 xlsx 文件，故移除相关 UI 和绑定。
 * 保留 initToolbarStyles 空函数以兼容 renderer.js 的调用。
 */
'use strict';

function initToolbarStyles(ss) {
    // 无操作：样式功能已移除（需要 SheetJS Pro 方可支持导出样式）
    void ss;
}

window.Toolbar = { initToolbarStyles };
