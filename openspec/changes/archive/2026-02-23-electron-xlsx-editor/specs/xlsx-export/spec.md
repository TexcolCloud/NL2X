# Spec: xlsx-export

## Overview

将 x-data-spreadsheet 当前的内存数据（含样式）通过 ExcelJS 序列化为标准 `.xlsx` 文件，经由 Electron IPC 将文件 Buffer 传至主进程，最终通过 `dialog.showSaveDialog` 写入用户指定的本地路径。

## Requirements

### Functional

- **FR-EXP-01** 用户可通过菜单栏 "文件 → 另存为" 或工具栏导出按钮触发导出流程
- **FR-EXP-02** 导出成功后，弹出系统保存对话框；默认文件名为当前文件名（无名文件则为 `untitled.xlsx`）
- **FR-EXP-03** 导出文件应正确保留以下内容：
  - 所有 Sheet 的数据（字符串、数字、布尔值）
  - 单元格样式：粗体、斜体、字体颜色、背景色、对齐方式
  - Sheet 名称
- **FR-EXP-04** 导出完成后，在 UI 右下角显示成功 Toast（"文件已保存：<path>"）
- **FR-EXP-05** 若写入失败（磁盘满、权限不足等），展示错误 Modal，不崩溃主进程

### Non-Functional

- **NFR-EXP-01** 使用 ExcelJS（纯 JS / WASM），禁止 C++ 原生绑定
- **NFR-EXP-02** 1,000 行 × 50 列（含样式）的导出时间 ≤ 2 秒
- **NFR-EXP-03** 导出的 .xlsx 文件应能被 Microsoft Excel 2010+ 和 LibreOffice Calc 正常打开

## Interface

```ts
// 渲染进程 → 主进程
ipcRenderer.invoke('file:save', {
  buffer: ArrayBuffer,   // ExcelJS 生成的 xlsx Buffer
  defaultName: string,
})

// 主进程处理器
ipcMain.handle('file:save', async (_, { buffer, defaultName }) => {
  const { filePath } = await dialog.showSaveDialog({ defaultPath: defaultName })
  if (filePath) await fs.writeFile(filePath, Buffer.from(buffer))
  return filePath ?? null
})
```

## Acceptance Criteria

- [ ] 导出含 3 个 Sheet 的文件，用 Excel 打开后 3 个 Sheet 齐全且数据正确
- [ ] 导入 → 编辑样式 → 导出，样式在导出文件中保留
- [ ] 写入权限不足时，弹出错误提示，不崩溃
- [ ] 导出 1,000 行 × 50 列数据耗时 ≤ 2 秒
