# Spec: window-management

## Overview

Electron 主进程负责管理原生应用窗口的生命周期，并通过 `contextBridge` 将安全的 IPC 通道暴露给渲染进程。严格遵守 Electron 安全最佳实践：`contextIsolation: true`，`nodeIntegration: false`。

## Requirements

### Functional

- **FR-WIN-01** 应用启动时创建一个 `BrowserWindow`（默认尺寸：1280 × 800，最小尺寸：800 × 600）
- **FR-WIN-02** 标题栏显示应用名称（"xlsx Editor"）+ 当前文件名（未保存时显示 `[未保存]`）
- **FR-WIN-03** 关闭窗口前，若有未保存更改，弹出系统原生确认对话框（"是否保存更改？"），支持保存 / 放弃 / 取消
- **FR-WIN-04** 支持菜单栏；至少包含 "文件" 菜单（打开、另存为、退出）和 "编辑" 菜单（撤销、复制、粘贴）
- **FR-WIN-05** 主进程通过 `ipcMain.handle` 注册所有 IPC 处理器（文件读写、对话框、配置读写）

### Security

- **FR-WIN-06** 所有 `webPreferences` 必须设置：`contextIsolation: true`，`nodeIntegration: false`，`sandbox: false`（Electron 22 兼容）
- **FR-WIN-07** Preload 脚本通过 `contextBridge.exposeInMainWorld('electronAPI', {...})` 仅暴露白名单 IPC 调用，渲染进程不可直接访问 Node.js API

## Interface

```ts
// preload.js 暴露给渲染进程的 API（白名单）
contextBridge.exposeInMainWorld('electronAPI', {
  openFile:  () => ipcRenderer.invoke('file:open'),
  saveFile:  (payload) => ipcRenderer.invoke('file:save', payload),
  getConfig: (key) => ipcRenderer.invoke('config:get', key),
  setConfig: (key, value) => ipcRenderer.invoke('config:set', key, value),
})

// BrowserWindow 创建参数
new BrowserWindow({
  width: 1280, height: 800, minWidth: 800, minHeight: 600,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false,
  }
})
```

## Acceptance Criteria

- [ ] 应用启动，窗口尺寸 1280×800，标题显示 "xlsx Editor"
- [ ] 导入文件后，标题栏更新为文件名
- [ ] 编辑后关闭窗口，弹出保存确认对话框
- [ ] 渲染进程中 `typeof require === 'undefined'` 为 true（nodeIntegration 关闭验证）
- [ ] `window.electronAPI` 仅含白名单方法，无其他 Node API 泄漏
