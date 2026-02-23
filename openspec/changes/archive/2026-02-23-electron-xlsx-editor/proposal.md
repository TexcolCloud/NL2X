# Proposal: electron-xlsx-editor

## Why

企业与个人用户在日常工作中大量依赖 xlsx 格式的电子表格，但现有桌面方案（如 Microsoft Excel）体积庞大、授权复杂，且难以与内部系统集成。我们需要一款轻量、可二次开发的桌面应用，具备：

- **离线可用**：无需网络即可完整运行核心功能（导入 / 编辑 / 导出）
- **可嵌入式集成**：通过 axios 与内部 REST API 交换数据（上传 / 下载 xlsx）
- **零原生依赖**：在 Windows 7 的受限环境中安装无需 C++ Build Tools，降低运维成本

## What Changes

### New Capabilities

- **xlsx 导入**：用户通过文件选择对话框（或拖拽）载入 `.xlsx` / `.xls` 文件，由 ExcelJS 解析后渲染进 x-data-spreadsheet 表格视图
- **电子表格编辑**：在 x-data-spreadsheet 提供的网格 UI 中进行单元格级增删改，支持基础样式（粗体、文字颜色、背景色）
- **xlsx 导出**：将当前表格数据经 ExcelJS 序列化为标准 `.xlsx` 文件并触发浏览器下载 / `ipcRenderer` 保存到本地
- **远程数据同步**：通过 axios 从配置的 API Endpoint 拉取（GET）或推送（POST）表格数据，支持 JSON ↔ Sheet 互转
- **应用窗口管理**：Electron 主进程管理原生窗口生命周期（新建窗口、最小化、关闭），并通过 contextBridge 安全暴露 IPC 通道

### Modified Capabilities

（无——本项目为全新构建，无既有 capability 变更）

## Impact

- **依赖引入**：`electron`、`x-data-spreadsheet`、`exceljs`、`axios`；均为纯 JS / WebAssembly 实现，无 C++ 原生绑定
- **运行时约束**：目标 Node.js v16（Electron 22 内置），无内置 `fetch`，所有 HTTP 请求必须走 axios
- **平台兼容**：Electron 需选用支持 Windows 7 的最后一个稳定版本（Electron 22.x 是最后一个官方支持 Win7 的系列）
- **进程边界**：主进程（Node.js）通过 `ipcMain` 处理文件系统与系统对话框；渲染进程（Chromium）通过 `contextBridge` 调用，严格遵守 Electron 安全最佳实践（`contextIsolation: true`, `nodeIntegration: false`）
- **打包**：使用 `electron-builder` 生成 NSIS installer（Windows），产物为免安装 portable 可选
