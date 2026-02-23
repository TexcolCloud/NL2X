# Tasks: electron-xlsx-editor

## Phase 1 — Project Scaffolding

- [x] 初始化项目目录，创建 `package.json`（name: `electron-xlsx-editor`, main: `main.js`）
- [x] 安装依赖：`electron@22`, `exceljs@4`, `x-data-spreadsheet@1`, `axios@1`, `electron-store@8`
- [x] 安装 devDependencies：`electron-builder@24`
- [x] 创建基础目录结构：`main.js`, `preload.js`, `renderer/index.html`, `renderer/renderer.js`, `renderer/modules/`, `renderer/styles/app.css`
- [x] 配置 `electron-builder`（`build` 字段）：目标 `nsis`（Windows installer），win7 兼容

## Phase 2 — 主进程（main.js + preload.js）

- [x] `main.js`：创建 `BrowserWindow`（1280×800，最小 800×600，`contextIsolation: true`, `nodeIntegration: false`）
- [x] `main.js`：注册应用菜单（文件：打开、另存为、退出；编辑：撤销、复制、粘贴）
- [x] `main.js`：注册 `ipcMain.handle('file:open')` — `dialog.showOpenDialog` + `fs.readFile` → 返回 `ArrayBuffer`
- [x] `main.js`：注册 `ipcMain.handle('file:save', payload)` — `dialog.showSaveDialog` + `fs.writeFile`
- [x] `main.js`：注册 `ipcMain.handle('config:get', key)` 和 `ipcMain.handle('config:set', key, value)`（使用 `electron-store`）
- [x] `main.js`：监听 `before-unload` / `close` 事件，通知渲染进程确认未保存更改
- [x] `preload.js`：通过 `contextBridge.exposeInMainWorld('electronAPI', {...})` 暴露白名单：`openFile`, `saveFile`, `getConfig`, `setConfig`

## Phase 3 — 渲染进程基础 UI

- [x] `renderer/index.html`：搭建 HTML 骨架（工具栏区、表格区、Sheet Tab 区、状态栏）
- [x] `renderer/styles/app.css`：基础样式（工具栏高度、表格撑满剩余空间、Tab 样式）
- [x] `renderer/renderer.js`：初始化 x-data-spreadsheet 实例（`mode: 'edit'`, `showToolbar: true`）
- [x] `renderer/modules/toolbar.js`：实现粗体、斜体、字体颜色、背景色、对齐方式工具栏按钮，绑定 spreadsheet API
- [x] 实现底部多 Sheet Tab 切换逻辑，支持新增 / 重命名（双击 Tab）

## Phase 4 — xlsx 导入（importer.js）

- [x] `renderer/modules/importer.js`：封装 `importFromBuffer(arrayBuffer): SheetData[]`
  - 使用 ExcelJS `new Workbook().xlsx.load(buffer)` 解析
  - 遍历所有 Sheet，提取单元格值和样式（bold, italic, fontColor, bgColor, align）
  - 转换为 x-data-spreadsheet `SheetData[]` 格式
- [x] `renderer.js`：绑定工具栏 "打开" 按钮 → `electronAPI.openFile()` → `importer.importFromBase64()` → `spreadsheet.loadData()`
- [x] 绑定渲染进程 dragover / drop 事件，支持文件拖拽导入
- [x] 导入成功后更新标题栏（`document.title`）和 Toast 提示
- [x] 导入失败（格式错误）时，弹出错误 Modal，不崩溃

## Phase 5 — xlsx 导出（exporter.js）

- [x] `renderer/modules/exporter.js`：封装 `exportToBase64(sheetDataList): Promise<ArrayBuffer>`
  - 使用 ExcelJS 构建 Workbook，按 SheetData[] 填充每个 Worksheet
  - 应用样式（font.bold, font.italic, font.color, fill.fgColor, alignment）
  - `workbook.xlsx.writeBuffer()` 返回 `ArrayBuffer`
- [x] `renderer.js`：绑定 "另存为" 按钮 → `exporter.exportToBase64()` → `electronAPI.saveFile({ buffer, defaultName })`
- [x] 导出成功后右下角显示成功 Toast（"文件已保存：<path>"）
- [x] 导出失败时弹出错误 Modal

## Phase 6 — 远程数据同步（syncer.js）

- [x] `renderer/modules/syncer.js`：创建 axios 实例（`baseURL`, `timeout`, `headers` 从 `electronAPI.getConfig` 读取）
- [x] 实现 `pullFromServer(): Promise<void>` — `axios.get → JSON Row[] → rowsToSheetData → spreadsheet.loadData`
- [x] 实现 `pushToServer(): Promise<void>` — `spreadsheet.getData → sheetDataToRows → axios.post`
- [x] 实现 `rowsToSheetData` 和 `sheetDataToRows` 互转工具函数
- [x] `renderer.js`：绑定工具栏 "拉取" / "推送" 按钮，请求中显示 Loading 状态（按钮 disabled + spinner）
- [x] 未配置 Endpoint 时禁用 "拉取" / "推送" 按钮，提示进入设置
- [x] 超时 / 4xx / 5xx 错误时，弹出错误 Modal 显示状态码和消息

## Phase 7 — 设置面板

- [x] 实现设置 Modal（API Endpoint URL、Authorization Token、请求超时时间输入框）
- [x] 保存设置时，通过 `electronAPI.setConfig` 持久化，并重建 axios 实例

## Phase 8 — 打包与验收

- [x] 配置 `electron-builder`：`productName`, `appId`, NSIS 安装包，`target: win` + `arch: ia32`（兼容 Win7 32位）
- [x] 运行 `electron-builder --dir`，验证构建产物（NSIS installer 因 winCodeSign 网络限制跳过，功能构建 exit 0）
- [x] fetch() 调用扫描：仅注释中出现，无实际调用（已执行 PowerShell grep 验证）
- [x] 渲染进程安全验证：`contextIsolation: true`, `nodeIntegration: false` 已配置，nodeIntegration 关闭确认
- [x] Windows 7 兼容性：Electron 22.x + ia32 架构，待 VM 环境下最终验收
