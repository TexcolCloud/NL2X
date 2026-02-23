# Spec: spreadsheet-editing

## Overview

在 x-data-spreadsheet 提供的网格 UI 中，用户可对单元格进行增删改操作，支持基础样式设置。编辑操作全部在渲染进程（浏览器端）完成，数据以内存中的二维数组形式维护，无需实时持久化到磁盘。

## Requirements

### Functional

- **FR-EDIT-01** 用户可点击任意单元格并直接键入内容（字符串、数字）
- **FR-EDIT-02** 支持快捷键操作：Enter（下移）、Tab（右移）、Delete/Backspace（清空单元格）、Ctrl+Z / Ctrl+Y（撤销 / 重做）
- **FR-EDIT-03** 支持选区操作：鼠标拖拽选择矩形区域，支持 Ctrl+C / Ctrl+V 复制粘贴
- **FR-EDIT-04** 工具栏提供：粗体（B）、斜体（I）、字体颜色选择器、单元格背景色选择器、对齐方式（左 / 中 / 右）
- **FR-EDIT-05** 支持插入 / 删除行和列（右键菜单或工具栏按钮）
- **FR-EDIT-06** 多 Sheet 场景下，可通过底部 Tab 切换到不同 Sheet 进行编辑；支持新增 / 重命名 Sheet Tab

### Non-Functional

- **NFR-EDIT-01** x-data-spreadsheet 作为唯一表格 UI 组件，禁止引入 Handsontable、AG Grid 等替代库
- **NFR-EDIT-02** 支持 10,000 行 × 100 列的数据集时，滚动帧率 ≥ 30 FPS

## Interface

```ts
// x-data-spreadsheet 实例配置
const spreadsheet = new Spreadsheet('#app', {
  mode: 'edit',
  showToolbar: true,
  showContextmenu: true,
})

// 读取当前数据（用于导出 / 同步）
spreadsheet.getData(): SheetData[]

// 加载数据（导入 / 拉取后）
spreadsheet.loadData(data: SheetData[]): void
```

## Acceptance Criteria

- [ ] 输入中文字符、英文、数字均可正常显示
- [ ] Ctrl+Z 撤销三步操作后，数据恢复正确
- [ ] 设置粗体、背景色后，导出 xlsx 时样式保留
- [ ] 新增一行后行数正确递增
- [ ] 10,000 行数据下滚动流畅，无明显卡顿
