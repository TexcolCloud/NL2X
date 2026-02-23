# Spec: xlsx-import

## Overview

用户通过原生文件选择对话框或拖拽操作将本地 `.xlsx` / `.xls` 文件载入应用，主进程通过 `file:open` IPC 将文件字节以 base64 返回渲染进程，由 ExcelJS 在**渲染进程**解析，解析结果加载至 x-data-spreadsheet 表格。

## Requirements

### Functional

- **FR-IMP-01** 用户可通过菜单栏 "文件 → 打开" 或工具栏按钮触发原生系统文件选择对话框（`dialog.showOpenDialog`），过滤类型为 `.xlsx`, `.xls`
- **FR-IMP-02** 用户可将文件拖拽到应用窗口内的指定拖放区域完成导入
- **FR-IMP-03** 导入后，第一个工作表（Sheet）默认展示；若文件含多个 Sheet，应在 Tab 组件中切换
- **FR-IMP-04** 单元格值（string / number / boolean / date）和基础样式（粗体、斜体、字体颜色、背景色、文字对齐）必须被正确导入
- **FR-IMP-05** 若文件损坏或格式不支持，向用户展示错误提示（Toast 或 Modal），不崩溃主进程

### Non-Functional

- **NFR-IMP-01** 文件解析在主进程 Worker 线程（或主线程异步）中完成，UI 线程不阻塞
- **NFR-IMP-02** 10 MB 以内的 xlsx 文件解析时间应 ≤ 3 秒（目标机器：Win7，双核，4 GB RAM）
- **NFR-IMP-03** 使用 ExcelJS（纯 JS），禁止引入任何 C++ 原生绑定模块

## Interface

```ts
// IPC Channel: main → renderer
ipcMain.handle('file:open', async () => {
  // returns: SheetData | null
})

type SheetData = {
  name: string           // sheet name
  rows: CellData[][]     // row-major 2D grid
}

type CellData = {
  text: string
  style?: CellStyle
}
```

## Acceptance Criteria

- [ ] 打开包含 3 个 Sheet 的 .xlsx 文件，三个 Tab 全部显示，内容正确
- [ ] 拖拽 .xls 文件也可正常导入
- [ ] 拖拽非 xlsx 文件弹出错误提示，程序不崩溃
- [ ] 主进程不阻塞（导入 10 MB 文件期间 UI 仍可响应）
