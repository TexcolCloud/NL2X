/**
 * Agent side panel for AI-assisted row parsing.
 *
 * Usage in renderer:
 *   AgentPanel.init(getHeadersCallback, writeRowCallback);
 *
 * getHeadersCallback: () => string[]
 * writeRowCallback:   (rowData: object) => void
 */
'use strict';

const AgentPanel = (() => {
    let _getHeaders = null;
    let _writeRow = null;
    let _parsedResult = null;
    let _progressTimer = null;
    let _currentPct = 0;

    const $ = (id) => document.getElementById(id);

    function init(getHeadersCallback, writeRowCallback) {
        _getHeaders = getHeadersCallback;
        _writeRow = writeRowCallback;

        _bindToggle();
        _bindConfigSection();
        _bindSaveConfig();
        _bindTestConfig();
        _bindParse();
        _bindWriteCancel();
        _loadConfig();
    }

    function _bindToggle() {
        const toggleBtn = $('btn-agent-toggle');
        const closeBtn = $('btn-agent-close');
        const panel = $('agent-panel');

        toggleBtn.addEventListener('click', () => {
            const isHidden = panel.hidden;
            panel.hidden = !isHidden;
            toggleBtn.classList.toggle('active', isHidden);
        });

        closeBtn.addEventListener('click', () => {
            panel.hidden = true;
            $('btn-agent-toggle').classList.remove('active');
        });
    }

    function _bindConfigSection() {
        const toggleBtn = $('btn-agent-config-toggle');
        const body = $('agent-config-body');
        const arrow = toggleBtn.querySelector('.toggle-arrow');

        toggleBtn.addEventListener('click', () => {
            const isCollapsed = body.classList.contains('collapsed');
            body.classList.toggle('collapsed', !isCollapsed);
            arrow.classList.toggle('open', isCollapsed);
        });
    }

    async function _loadConfig() {
        const api = window.electronAPI;
        $('agent-base-url').value = await api.getConfig('agent.baseUrl', '');
        $('agent-model').value = await api.getConfig('agent.model', '');
        $('agent-api-key').value = await api.getConfig('agent.apiKey', '');
        $('agent-system-prompt').value = await api.getConfig('agent.systemPrompt', '');
    }

    function _bindSaveConfig() {
        $('btn-agent-save-config').addEventListener('click', async () => {
            const baseUrl = $('agent-base-url').value.trim();
            const model = $('agent-model').value.trim();
            const apiKey = $('agent-api-key').value.trim();
            const systemPrompt = $('agent-system-prompt').value.trim();

            if (baseUrl) {
                try {
                    new URL(baseUrl);
                } catch {
                    _showError('Invalid Base URL. Example: https://api.openai.com');
                    return;
                }
            } else {
                _showError('Base URL is required.');
                return;
            }

            if (!model) {
                _showError('Model is required.');
                return;
            }

            const api = window.electronAPI;
            await api.setConfig('agent.baseUrl', baseUrl);
            await api.setConfig('agent.model', model);
            await api.setConfig('agent.apiKey', apiKey);
            await api.setConfig('agent.systemPrompt', systemPrompt);

            const tip = $('agent-config-saved');
            tip.hidden = false;
            setTimeout(() => {
                tip.hidden = true;
            }, 2000);
            _clearError();
        });
    }

    function _bindTestConfig() {
        $('btn-agent-test').addEventListener('click', async () => {
            const baseUrl = $('agent-base-url').value.trim();
            const model = $('agent-model').value.trim();
            const apiKey = $('agent-api-key').value.trim();

            if (!baseUrl) {
                _showTestResult(false, 'Base URL is required.');
                return;
            }

            const btn = $('btn-agent-test');
            btn.disabled = true;
            btn.textContent = 'Testing...';
            _hideTestResult();

            const result = await window.electronAPI.testAgent({ baseUrl, model, apiKey });

            btn.disabled = false;
            btn.textContent = 'Test';

            if (result.error) {
                _showTestResult(false, `Error: ${result.error}`);
            } else {
                _showTestResult(true, `Connection successful. Model: ${result.model}`);
            }
        });
    }

    function _showTestResult(ok, msg) {
        const el = $('agent-test-result');
        el.textContent = msg;
        el.className = 'agent-test-result ' + (ok ? 'success' : 'fail');
        el.hidden = false;
    }

    function _hideTestResult() {
        const el = $('agent-test-result');
        el.hidden = true;
    }

    function _bindParse() {
        $('btn-agent-parse').addEventListener('click', async () => {
            const headers = _getHeaders ? _getHeaders() : [];
            if (!headers || headers.length === 0) {
                _showError('Please create at least one column in the current sheet first.');
                return;
            }

            const userInput = $('agent-user-input').value.trim();
            if (!userInput) {
                _showError('Please enter input text to parse.');
                return;
            }

            const baseUrl = $('agent-base-url').value.trim();
            const model = $('agent-model').value.trim();
            const apiKey = $('agent-api-key').value.trim();
            const systemPrompt = $('agent-system-prompt').value.trim();

            if (!baseUrl) {
                _showError('Please configure API Base URL first.');
                return;
            }
            if (!model) {
                _showError('Please configure model first.');
                return;
            }

            _setParseLoading(true);
            _clearError();
            _hidePreview();

            const result = await window.electronAPI.callAgent({
                baseUrl,
                model,
                apiKey,
                systemPrompt,
                userInput,
                headers,
            });

            const isSuccess = result && !result.error;
            _setParseLoading(false);
            _finishProgress(isSuccess);

            if (!isSuccess) {
                _showError(result ? result.error : 'Unknown error.');
            } else {
                _parsedResult = result;
                _renderPreview(headers, result);
            }
        });
    }

    function _renderPreview(headers, data) {
        const container = $('agent-preview');
        container.innerHTML = '';
        let filledCount = 0;

        headers.forEach((col) => {
            const val = data[col];
            const isFilled = val != null && String(val).trim() !== '';
            if (isFilled) filledCount++;

            const row = document.createElement('div');
            row.className = 'agent-preview-row';
            row.innerHTML =
                `<span class="agent-preview-key" title="${_esc(col)}">${_esc(col)}</span>` +
                `<span class="agent-preview-val${!isFilled ? ' empty' : ''}">${isFilled ? _esc(String(val)) : ''}</span>`;
            container.appendChild(row);
        });

        const countEl = $('agent-preview-count');
        if (countEl) countEl.textContent = `${filledCount} / ${headers.length} columns filled`;
        $('agent-preview-section').hidden = false;
    }

    function _hidePreview() {
        $('agent-preview-section').hidden = true;
        _parsedResult = null;
    }

    function _buildWritableRowData(headers, parsedResult) {
        const row = {};
        const normalized = {};

        Object.entries(parsedResult || {}).forEach(([k, v]) => {
            const nk = String(k == null ? '' : k).trim().replace(/\s+/g, ' ').toLowerCase();
            normalized[nk] = v;
        });

        (headers || []).forEach((h) => {
            if (!h) return;
            const exact = parsedResult ? parsedResult[h] : undefined;
            const nk = String(h).trim().replace(/\s+/g, ' ').toLowerCase();
            const val = exact != null ? exact : normalized[nk];
            if (val != null && String(val).trim() !== '') {
                row[h] = val;
            }
        });

        return row;
    }

    function _bindWriteCancel() {
        $('btn-agent-write').addEventListener('click', () => {
            if (!_parsedResult || !_writeRow) return;
            const headers = _getHeaders ? _getHeaders() : [];
            const writableRowData = _buildWritableRowData(headers, _parsedResult);
            const ok = _writeRow(writableRowData);
            if (ok === false) return;

            $('agent-user-input').value = '';
            _hidePreview();
            _clearError();
        });

        $('btn-agent-cancel').addEventListener('click', () => {
            _hidePreview();
        });
    }

    /**
     * Progress behavior:
     * start at 0%, quickly reach 10%, then crawl toward 90% while waiting,
     * and finally finish at 100% when request completes.
     */
    function _startProgress() {
        _resetProgress();
        const wrap = document.getElementById('agent-progress-wrap');
        const fill = document.getElementById('agent-progress-fill');
        const pctEl = document.getElementById('agent-progress-pct');
        wrap.hidden = false;
        fill.classList.remove('done');
        pctEl.classList.remove('done');

        _currentPct = 0;
        _setProgressUI(0, 'Preparing request...');

        setTimeout(() => _animateTo(10, 'Sending request...', 400), 200);

        let crawlTarget = 15;
        function crawl() {
            if (_currentPct >= 90) return;
            crawlTarget = Math.min(90, crawlTarget + (90 - crawlTarget) * 0.08 + 0.5);
            const target = Math.floor(crawlTarget);
            const label = target < 40 ? 'LLM processing...' : target < 75 ? 'Generating fields...' : 'Finalizing result...';
            _animateTo(target, label, 600);
            _progressTimer = setTimeout(crawl, 700);
        }
        _progressTimer = setTimeout(crawl, 900);
    }

    function _finishProgress(success) {
        clearTimeout(_progressTimer);
        _progressTimer = null;
        const label = success ? 'Completed' : 'Failed';
        _animateTo(100, label, 250);

        const fill = document.getElementById('agent-progress-fill');
        const pctEl = document.getElementById('agent-progress-pct');
        if (success) {
            fill.classList.add('done');
            pctEl.classList.add('done');
        }

        setTimeout(() => _resetProgress(), 1200);
    }

    function _resetProgress() {
        clearTimeout(_progressTimer);
        _progressTimer = null;
        _currentPct = 0;

        const wrap = document.getElementById('agent-progress-wrap');
        if (wrap) wrap.hidden = true;
        _setProgressUI(0, 'Preparing request...');

        const fill = document.getElementById('agent-progress-fill');
        const pctEl = document.getElementById('agent-progress-pct');
        if (fill) fill.classList.remove('done');
        if (pctEl) pctEl.classList.remove('done');
    }

    function _animateTo(pct, status, ms) {
        _currentPct = pct;
        const fill = document.getElementById('agent-progress-fill');
        if (fill) fill.style.transition = `width ${ms}ms cubic-bezier(0.4,0,0.2,1)`;
        _setProgressUI(pct, status);
    }

    function _setProgressUI(pct, status) {
        const fill = document.getElementById('agent-progress-fill');
        const pctEl = document.getElementById('agent-progress-pct');
        const statusEl = document.getElementById('agent-progress-status');
        if (fill) fill.style.width = pct + '%';
        if (pctEl) pctEl.textContent = pct + '%';
        if (statusEl) statusEl.textContent = status;
    }

    function _showError(msg) {
        const el = $('agent-error');
        el.textContent = msg;
        el.hidden = false;
    }

    function _clearError() {
        const el = $('agent-error');
        el.hidden = true;
        el.textContent = '';
    }

    function _setParseLoading(on) {
        $('btn-agent-parse').disabled = on;
        $('agent-parse-loading').hidden = !on;
        if (on) {
            _startProgress();
        } else {
            // Progress completion is controlled by _finishProgress after response returns.
        }
    }

    function _esc(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    return { init };
})();

