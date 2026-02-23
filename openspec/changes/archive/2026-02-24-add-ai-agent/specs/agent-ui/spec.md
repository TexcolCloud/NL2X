## ADDED Requirements

### Requirement: AI Agent 侧边面板入口

系统 SHALL 在工具栏区域提供一个"AI 填写"按钮，点击后展开/收起右侧 Agent 侧边面板。

#### Scenario: 打开面板
- **WHEN** 用户点击工具栏"AI 填写"按钮
- **THEN** 右侧侧边面板展开，显示配置区和输入区

#### Scenario: 收起面板
- **WHEN** 用户再次点击"AI 填写"按钮或点击面板关闭按钮
- **THEN** 侧边面板收起，表格区域恢复全宽

---

### Requirement: 配置区 UI

侧边面板 SHALL 包含一个"配置"折叠区，内含：
- API Key 输入框（password 类型）
- API Base URL 输入框（text 类型）
- System Prompt 文本域（textarea）
- "保存配置"按钮

#### Scenario: 展开/收起配置区
- **WHEN** 用户点击"配置"标题
- **THEN** 配置区折叠或展开

#### Scenario: 保存成功反馈
- **WHEN** 用户保存配置成功
- **THEN** 按钮旁显示短暂的"✓ 已保存"文字提示（2 秒后消失）

---

### Requirement: 自然语言输入与提交

侧边面板 SHALL 提供一个多行文本域供用户输入自然语言，以及"解析"按钮触发 LLM 调用。

#### Scenario: 提交解析
- **WHEN** 用户在输入框填写自然语言后点击"解析"按钮
- **THEN** 按钮变为加载状态（禁用+spinner），发起 LLM 请求

#### Scenario: 输入为空时阻止提交
- **WHEN** 用户点击"解析"但输入框为空
- **THEN** 提示"请输入内容"，不发起请求

---

### Requirement: 解析结果预览与确认写入

LLM 返回结果后，系统 SHALL 在面板中展示预览表格（列名 | 解析值），并提供"写入表格"和"取消"两个按钮。

#### Scenario: 预览展示
- **WHEN** LLM 成功返回 JSON
- **THEN** 面板显示预览区，每行对应一列：列名 + 解析出的值（null 显示为空）

#### Scenario: 确认写入
- **WHEN** 用户点击"写入表格"
- **THEN** 解析结果写入当前 Sheet 的下一空行，预览区清空，输入框清空

#### Scenario: 取消写入
- **WHEN** 用户点击"取消"
- **THEN** 预览区清空，输入框保留，不写入任何数据
