# Design: electron-xlsx-editor

## Architecture Overview

应用采用标准的 Electron 双进程架构：**主进程**（Node.js）负责文件系统、IPC 路由、原生对话框；**渲染进程**（Chromium）承载全部 UI 与业务逻辑。两者通过 IPC + contextBridge 解耦通信。

```
┌─────────────────────────────────────────────────────┐
│                   Main Process (Node.js)             │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  main.js │  │  ipcMain     │  │  dialog /     │  │
│  │ (window  │  │  handlers    │  │  fs / store   │  │
│  │  create) │  │  file:open   │  │               │  │
│  │          │  │  file:save   │  │               │  │
│  │          │  │  config:get  │  │               │  │
│  └──────────┘  │  config:set  │  └───────────────┘  │
│                └───────┬──────┘                      │
│                        │ IPC (contextBridge)          │
└────────────────────────┼────────────────────────────-┘
                         │
┌────────────────────────┼─────────────────────────────┐
│            Renderer Process (Chromium)                │
│  ┌──────────────────────────────────────────────┐    │
│  │  renderer/index.html + renderer.js            │    │
│  │                                               │    │
│  │  ┌──────────────────────┐  ┌──────────────┐  │    │
│  │  │  x-data-spreadsheet  │  │  Toolbar UI  │  │    │
│  │  │  (table grid)        │  │  (buttons,   │  │    │
│  │  │                      │  │   style bar) │  │    │
│  │  └──────────────────────┘  └──────────────┘  │    │
│  │                                               │    │
│  │  ┌──────────────────────┐  ┌──────────────┐  │    │
│  │  │  ExcelJS (import /   │  │  axios       │  │    │
│  │  │  export serializer)  │  │  (HTTP sync) │  │    │
│  │  └──────────────────────┘  └──────────────┘  │    │
│  └──────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

## Process Model: Where Each Library Runs

| 库 | 进程 | 原因 |
|----|------|------|
| ExcelJS | **渲染进程** | 纯 JS / WASM，可在 Chromium 中直接运行；解析结果通过 `Uint8Array` 与主进程交换 |
| x-data-spreadsheet | **渲染进程** | DOM 依赖，只能在 Chromium 环境中运行 |
| axios | **渲染进程** | XMLHttpRequest 模式；渲染进程可直接发起 HTTP 请求 |
| fs / dialog | **主进程** | Node.js API，只在主进程可用 |
| electron-store | **主进程** | 文件系统 JSON 持久化，通过 `config:get/set` IPC 暴露给渲染进程 |

> ⚠️ **决策说明**：ExcelJS 的文件解析放在渲染进程（而非通过 IPC 传递文件路径到主进程）是为了减少 IPC 序列化开销。主进程只负责通过 `file:open` 返回文件的 `ArrayBuffer`，渲染进程用 ExcelJS 做解析和序列化。

## Data Flow

### 导入流程

```
用户操作 → electronAPI.openFile()
  → ipcMain('file:open') → dialog.showOpenDialog → fs.readFile → ArrayBuffer
  → 渲染进程 ExcelJS.load(ArrayBuffer) → SheetData[]
  → spreadsheet.loadData(SheetData[])
```

### 导出流程

```
用户点击导出 → ExcelJS 构建 Workbook → workbook.xlsx.writeBuffer() → ArrayBuffer
  → electronAPI.saveFile({ buffer, defaultName })
  → ipcMain('file:save') → dialog.showSaveDialog → fs.writeFile
```

### 远程同步流程

```
用户点击拉取 → axios.get(endpoint) → JSON Row[]
  → rowsToSheetData(rows) → spreadsheet.loadData()

用户点击推送 → spreadsheet.getData() → sheetDataToRows(data)
  → axios.post(endpoint, rows)
```

## Directory Structure

```
electron-xlsx-editor/
├── package.json
├── main.js                  # 主进程入口
├── preload.js               # contextBridge 白名单暴露
└── renderer/
    ├── index.html
    ├── renderer.js          # 渲染进程主文件
    ├── modules/
    │   ├── importer.js      # ExcelJS → SheetData 转换
    │   ├── exporter.js      # SheetData → ExcelJS → Buffer
    │   ├── syncer.js        # axios 拉取/推送
    │   └── toolbar.js       # 工具栏 UI 逻辑
    └── styles/
        └── app.css
```

## Key Technical Decisions

### 1. Electron 版本：22.x（最后支持 Win7 的系列）

Electron 23+ 放弃了对 Windows 7/8/8.1 的支持。Electron 22.x 是最后一个通过 Chromium 109 支持 Win7 的系列。

### 2. ExcelJS 而非 SheetJS (xlsx)

SheetJS 社区版在复杂样式处理上受限；ExcelJS API 更直观且对样式支持完整。两者均为纯 JS，无 C++ 绑定。

### 3. axios 在渲染进程而非主进程

渲染进程是浏览器环境，axios 的 XMLHttpRequest 适配器天然可用，无需 `node-fetch` 补丁，完全满足 Node.js v16 无内置 `fetch` 的约束。

### 4. 禁止 nodeIntegration，使用 contextBridge

即使在内部工具场景下，也严格遵守 Electron 安全规范。渲染进程通过 `window.electronAPI` 调用预定义的 IPC 白名单，不暴露任意 Node.js 能力。

### 5. electron-store 用于配置持久化

纯 JS JSON 文件持久化方案，无 C++ 依赖，Win7 兼容，替代需要原生 SQLite 或 LevelDB 的方案。

## Dependencies

```json
{
  "dependencies": {
    "electron": "^22.3.27",
    "exceljs": "^4.4.0",
    "x-data-spreadsheet": "^1.1.9",
    "axios": "^1.6.0",
    "electron-store": "^8.1.0"
  },
  "devDependencies": {
    "electron-builder": "^24.13.3"
  }
}
```

## Verification Plan

- 单元测试：importer.js / exporter.js 的 SheetData 转换逻辑（Jest，无 Electron 依赖）
- 集成测试：通过 Spectron 或手动启动 Electron 验证 IPC 通道
- 兼容性测试：在 Windows 7 VM 中运行安装包，验证导入 / 导出 / HTTP 同步功能
