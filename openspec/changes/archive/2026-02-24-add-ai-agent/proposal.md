## Why

当前 Electron XLSX 表格编辑器要求用户手动逐列填写数据，效率低且容易出错。通过引入一个云端 LLM 驱动的 AI Agent，用户只需输入一段自然语言描述，Agent 自动将其解析为结构化数据并对应填入表格各列，大幅提升数据录入效率。

## What Changes

- 新增 **AI Agent 面板**：在应用侧边栏/工具栏区域提供入口，用户可打开 Agent 配置与对话界面。
- 新增 **LLM 云端调用模块**：支持用户自填大陆服务商的 API Key 与 API Base URL（兼容 OpenAI 格式），配置持久化存储到本地（如 `localStorage` 或 Electron `app.getPath('userData')`）。
- 新增 **Prompt 编辑器**：用户可自定义 system prompt，Agent 据此理解当前表格的列结构与业务语义。
- 新增 **自然语言 → 结构化数据解析**：Agent 读取当前 Sheet 的列名（header），将用户输入解析为同等列数的 JSON 对象，每个字段对应一列；缺失数据的列留空。
- 新增 **自动填行逻辑**：将 Agent 解析结果写入当前活动 Sheet 的下一空行。

## Capabilities

### New Capabilities

- `ai-agent-config`: 管理 LLM 连接配置（API Key、API Base URL）和用户自定义 Prompt，配置本地持久化。
- `nl-to-row`: 接收自然语言输入，结合当前 Sheet 列名和用户 Prompt，调用 LLM 将其解析为结构化行数据（JSON），缺失列留空。
- `agent-ui`: 提供 AI Agent 的用户交互界面，包含配置入口、Prompt 编辑、自然语言输入框以及解析结果预览/确认后写入表格的交互流程。

### Modified Capabilities

（无已有 spec 级别需求变更）

## Impact

- **代码**：`electron-xlsx-editor/` 下新增 Agent 相关 JS 模块（`agent.js` / `llm-client.js`）以及 `renderer.js` / `index.html` 的 UI 集成修改。
- **依赖**：按需引入 HTTP 请求库（如 Node.js 内置 `https` 或 `node-fetch`），无需引入重型 SDK，保持轻量。
- **数据存储**：LLM 配置（API Key、Base URL、Prompt）存储在 Electron `userData` 目录下的 JSON 文件，不写入 XLSX 文件本身。
- **安全**：API Key 仅存储在本地，不上传至任何第三方，网络请求直接从 Electron 主进程发起（避免 CORS 问题）。
