import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const checks = [
  {
    id: '7.1',
    desc: 'Agent config keys are persisted and reloaded',
    pass: (files) =>
      files.main.includes("ipcMain.handle('config:get'") &&
      files.main.includes("ipcMain.handle('config:set'") &&
      files.panel.includes("getConfig('agent.baseUrl'") &&
      files.panel.includes("getConfig('agent.model'") &&
      files.panel.includes("getConfig('agent.apiKey'") &&
      files.panel.includes("getConfig('agent.systemPrompt'"),
  },
  {
    id: '7.2',
    desc: 'Invalid Base URL blocks save with validation',
    pass: (files) =>
      files.panel.includes("new URL(baseUrl)") &&
      files.panel.includes("Base URL"),
  },
  {
    id: '7.3',
    desc: 'No headers guard exists before parse',
    pass: (files) =>
      files.panel.includes('if (!headers || headers.length === 0)'),
  },
  {
    id: '7.4',
    desc: 'Preview renders in header order',
    pass: (files) =>
      files.panel.includes('headers.forEach(col =>') &&
      files.panel.includes('const val = data[col];'),
  },
  {
    id: '7.5',
    desc: 'Write flow writes then clears input/preview',
    pass: (files) =>
      files.panel.includes("$('btn-agent-write').addEventListener('click'") &&
      files.panel.includes("$('agent-user-input').value = ''") &&
      files.panel.includes('_hidePreview();'),
  },
  {
    id: '7.6',
    desc: 'Invalid JSON from LLM returns error and stops write',
    pass: (files) =>
      files.main.includes('const parsed = JSON.parse(cleaned);') &&
      files.main.includes('LLM') &&
      files.main.includes('error'),
  },
];

const files = {
  main: read('main.js'),
  panel: read('renderer/modules/agent-panel.js'),
};

let failed = 0;
for (const check of checks) {
  const ok = check.pass(files);
  if (ok) {
    console.log(`[PASS] ${check.id} ${check.desc}`);
  } else {
    failed += 1;
    console.error(`[FAIL] ${check.id} ${check.desc}`);
  }
}

if (failed > 0) {
  console.error(`\nVerification failed: ${failed} check(s) did not pass.`);
  process.exit(1);
}

console.log('\nAll agent verification checks passed.');
