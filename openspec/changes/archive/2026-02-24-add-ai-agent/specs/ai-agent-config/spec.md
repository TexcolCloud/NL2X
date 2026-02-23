## ADDED Requirements

### Requirement: 用户可配置 LLM 连接参数

系统 SHALL 允许用户填写并保存以下三项配置：
1. **API Key**：用于鉴权的密钥字符串
2. **API Base URL**：LLM 服务的基础地址（如 `https://api.example.com/v1`）
3. **System Prompt**：自定义的系统提示词，追加在系统固定 prompt 之后

配置 SHALL 通过 `electron-store` 持久化到本地，key 分别为 `agent.apiKey`、`agent.baseUrl`、`agent.systemPrompt`。
应用重启后配置 SHALL 自动恢复。

#### Scenario: 首次打开配置面板
- **WHEN** 用户首次打开 AI Agent 配置面板，`electron-store` 中无相关 key
- **THEN** 三个输入框均显示为空

#### Scenario: 保存配置
- **WHEN** 用户填写 API Key、Base URL、System Prompt 后点击"保存"
- **THEN** 三项配置写入 `electron-store`，面板显示"已保存"提示

#### Scenario: 重启后恢复配置
- **WHEN** 用户重启应用并打开配置面板
- **THEN** 三个输入框显示上次保存的值

#### Scenario: API Key 脱敏显示
- **WHEN** 配置面板展示已保存的 API Key
- **THEN** 输入框类型为 `password`，值以掩码形式显示

---

### Requirement: 配置校验

系统 SHALL 在用户点击"保存"时对 API Base URL 做基础格式校验，确保其以 `http://` 或 `https://` 开头。

#### Scenario: Base URL 格式非法
- **WHEN** 用户输入的 Base URL 不以 `http://` 或 `https://` 开头并点击"保存"
- **THEN** 显示错误提示"URL 格式不正确，须以 http:// 或 https:// 开头"，不执行保存
