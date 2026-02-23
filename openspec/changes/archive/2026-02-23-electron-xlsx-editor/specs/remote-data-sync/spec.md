# Spec: remote-data-sync

## Overview

通过 axios（运行于渲染进程）与配置的 REST API Endpoint 交换表格数据。支持从服务端拉取 JSON 数据并渲染到表格，以及将当前表格数据推送到服务端。所有 HTTP 请求必须使用 axios，禁止使用 Node.js 内置 `fetch`（v16 不保证可用）。

## Requirements

### Functional

- **FR-SYNC-01** 用户可在 "设置" 面板中配置 API Endpoint URL 和可选的请求头（如 `Authorization: Bearer <token>`），配置持久化到 `electron-store`（或 `localStorage` 兜底）
- **FR-SYNC-02** 点击 "从服务端拉取" 按钮，通过 `axios.get(url)` 获取 JSON 数组（`Row[]`），转换为 x-data-spreadsheet 数据格式后加载到表格
- **FR-SYNC-03** 点击 "推送到服务端" 按钮，将当前表格数据序列化为 JSON（`Row[]`），通过 `axios.post(url, data)` 发送
- **FR-SYNC-04** 请求过程中显示 Loading 状态（工具栏按钮 disabled + 菊花图标）
- **FR-SYNC-05** 请求失败（网络错误、4xx、5xx）时，弹出错误 Modal 显示状态码和错误信息
- **FR-SYNC-06** 支持配置请求超时时间（默认 30 秒）

### Non-Functional

- **NFR-SYNC-01** 必须使用 `axios`，禁止 `node-fetch`、原生 `fetch`、`XMLHttpRequest` 直接调用
- **NFR-SYNC-02** axios 实例应在渲染进程中创建，无需经过 IPC；但若需要 CORS 绕过，应通过主进程 `session.webRequest` 处理

## Interface

```ts
// axios 实例（渲染进程）
const apiClient = axios.create({
  baseURL: store.get('apiEndpoint'),
  timeout: store.get('requestTimeout', 30000),
  headers: { Authorization: store.get('apiToken') ? `Bearer ${store.get('apiToken')}` : undefined },
})

// 拉取
async function pullFromServer(): Promise<void>

// 推送
async function pushToServer(): Promise<void>

// 服务端数据格式（约定，可与后端协商）
type Row = Record<string, string | number | boolean | null>
```

## Acceptance Criteria

- [ ] 配置有效 Endpoint 后，点击拉取，表格加载服务端数据
- [ ] 编辑表格后，点击推送，服务端接收到正确 JSON
- [ ] 配置超时为 1 秒，请求慢速接口时触发超时错误 Modal
- [ ] 未配置 Endpoint 时，推送 / 拉取按钮 disabled 或提示配置缺失
- [ ] 代码中无任何 `fetch(` 调用
