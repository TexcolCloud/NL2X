/**
 * agent-panel.js 鈥?AI 濉啓鍔╂墜闈㈡澘閫昏緫
 *
 * Usage: 鍦?renderer.js 鍒濆鍖栧悗璋冪敤
 *   AgentPanel.init(getHeadersCallback, writeRowCallback);
 *
 * getHeadersCallback: () => string[]  鈥?杩斿洖褰撳墠 Sheet 绗竴琛屽垪鍚嶆暟缁?
 * writeRowCallback:   (rowData: object) => void 鈥?鍐欏叆涓€琛屾暟鎹埌琛ㄦ牸
 */
'use strict';

const AgentPanel = (() => {
    let _getHeaders = null;
    let _writeRow = null;
    let _parsedResult = null; // last parsed object from LLM
    let _progressTimer = null; // progress animation timer
    let _currentPct = 0;       // current progress percentage

    // 鈹€鈹€ DOM refs 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    const $ = (id) => document.getElementById(id);

    // 鈹€鈹€ Init 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
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

    // 鈹€鈹€ Panel toggle 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
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

    // 鈹€鈹€ Config section collapsible 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
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

    // 鈹€鈹€ Load config from electron-store 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    async function _loadConfig() {
        const api = window.electronAPI;
        $('agent-base-url').value = await api.getConfig('agent.baseUrl', '');
        $('agent-model').value = await api.getConfig('agent.model', '');
        $('agent-api-key').value = await api.getConfig('agent.apiKey', '');
        $('agent-system-prompt').value = await api.getConfig('agent.systemPrompt', '');
    }

    // 鈹€鈹€ Save config 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    function _bindSaveConfig() {
        $('btn-agent-save-config').addEventListener('click', async () => {
            const baseUrl = $('agent-base-url').value.trim();
            const model = $('agent-model').value.trim();
            const apiKey = $('agent-api-key').value.trim();
            const systemPrompt = $('agent-system-prompt').value.trim();

            // Validate Base URL
            if (baseUrl) {
                try { new URL(baseUrl); } catch {
                    _showError('Base URL 鏍煎紡鏃犳晥锛岃杈撳叆瀹屾暣 URL锛堝 https://api.openai.com锛?);
                    return;
                }
            } else {
                _showError('Base URL 涓嶈兘涓虹┖');
                return;
            }
            if (!model) {
                _showError('妯″瀷鍚嶇О涓嶈兘涓虹┖');
                return;
            }

            const api = window.electronAPI;
            await api.setConfig('agent.baseUrl', baseUrl);
            await api.setConfig('agent.model', model);
            await api.setConfig('agent.apiKey', apiKey);
            await api.setConfig('agent.systemPrompt', systemPrompt);

            // Show "鉁?宸蹭繚瀛? tip for 2s
            const tip = $('agent-config-saved');
            tip.hidden = false;
            setTimeout(() => { tip.hidden = true; }, 2000);
            _clearError();
        });
    }

    // 鈹€鈹€ Test connection 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    function _bindTestConfig() {
        $('btn-agent-test').addEventListener('click', async () => {
            const baseUrl = $('agent-base-url').value.trim();
            const model = $('agent-model').value.trim();
            const apiKey = $('agent-api-key').value.trim();

            if (!baseUrl) { _showTestResult(false, 'Base URL 涓嶈兘涓虹┖'); return; }

            const btn = $('btn-agent-test');
            btn.disabled = true;
            btn.textContent = '楠岃瘉涓€?;
            _hideTestResult();

            const result = await window.electronAPI.testAgent({ baseUrl, model, apiKey });

            btn.disabled = false;
            btn.textContent = '楠岃瘉';

            if (result.error) {
                _showTestResult(false, `鉂?${result.error}`);
            } else {
                _showTestResult(true, `鉁?杩炴帴鎴愬姛锛堟ā鍨嬶細${result.model}锛塦);
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

    // 鈹€鈹€ Parse 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    function _bindParse() {
        $('btn-agent-parse').addEventListener('click', async () => {
            const headers = _getHeaders ? _getHeaders() : [];
            if (!headers || headers.length === 0) {
                _showError('褰撳墠 Sheet 娌℃湁鍒楀悕锛堢涓€琛屼负绌猴級锛屾棤娉曡В鏋?);
                return;
            }

            const userInput = $('agent-user-input').value.trim();
            if (!userInput) {
                _showError('璇疯緭鍏ヨ嚜鐒惰瑷€鎻忚堪');
                return;
            }

            const baseUrl = $('agent-base-url').value.trim();
            const model = $('agent-model').value.trim();
            const apiKey = $('agent-api-key').value.trim();
            const systemPrompt = $('agent-system-prompt').value.trim();

            if (!baseUrl) {
                _showError('璇峰厛鍦ㄩ厤缃尯濉啓 API Base URL 骞朵繚瀛?);
                return;
            }
            if (!model) {
                _showError('璇峰厛鍦ㄩ厤缃尯濉啓妯″瀷鍚嶇О骞朵繚瀛?);
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
                _showError(result ? result.error : '鏈煡閿欒');
            } else {
                _parsedResult = result;
                _renderPreview(headers, result);
            }
        });
    }

    // 鈹€鈹€ Preview render 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    function _renderPreview(headers, data) {
        const container = $('agent-preview');
        container.innerHTML = '';
        let filledCount = 0;
        headers.forEach(col => {
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
        // 鏇存柊鍒楄鏁板窘绔?
        const countEl = $('agent-preview-count');
        if (countEl) countEl.textContent = `${filledCount} / ${headers.length} 鍒楀凡濉玚;
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

    // 鈹€鈹€ Write & Cancel 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    function _bindWriteCancel() {
        $('btn-agent-write').addEventListener('click', () => {
            if (!_parsedResult || !_writeRow) return;
            const headers = _getHeaders ? _getHeaders() : [];
            const writableRowData = _buildWritableRowData(headers, _parsedResult);
            const ok = _writeRow(writableRowData);
            if (ok === false) return;
            // Clear input and preview
            $('agent-user-input').value = '';
            _hidePreview();
            _clearError();
        });

        $('btn-agent-cancel').addEventListener('click', () => {
            _hidePreview();
        });
    }

    // 鈹€鈹€ Parse progress bar 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    /**
     * 鍚姩杩涘害鏉″姩鐢汇€?
     * 绛栫暐锛氬揩閫熷埌 10% 鈫?缂撴參鐖崌鑷?90%锛堟寚鏁拌“鍑忥級鈫?鏀跺埌鍝嶅簲鍚庤烦鍒?100%
     */
    function _startProgress() {
        _resetProgress();
        const wrap = document.getElementById('agent-progress-wrap');
        const fill = document.getElementById('agent-progress-fill');
        const pctEl = document.getElementById('agent-progress-pct');
        const statusEl = document.getElementById('agent-progress-status');
        wrap.hidden = false;
        fill.classList.remove('done');
        pctEl.classList.remove('done');

        _currentPct = 0;
        _setProgressUI(0, '姝ｅ湪杩炴帴鈥?);

        // 绗竴闃舵锛氬揩閫熷埌 10%
        setTimeout(() => _animateTo(10, '宸插缓绔嬭繛鎺ワ紝绛夊緟鎺ㄧ悊鈥?, 400), 200);

        // 绗簩闃舵锛氭瘡闅斾竴娈垫椂闂村皬骞呮帹杩涳紝鎸囨暟琛板噺鍒?90%
        let crawlTarget = 15;
        function crawl() {
            if (_currentPct >= 90) return;
            crawlTarget = Math.min(90, crawlTarget + (90 - crawlTarget) * 0.08 + 0.5);
            const target = Math.floor(crawlTarget);
            const label = target < 40 ? 'LLM 鎺ㄧ悊涓€? : target < 75 ? '姝ｅ湪鐢熸垚鍥炲鈥? : '鍗冲皢瀹屾垚鈥?;
            _animateTo(target, label, 600);
            _progressTimer = setTimeout(crawl, 700);
        }
        _progressTimer = setTimeout(crawl, 900);
    }

    /** 璇锋眰瀹屾垚锛堟垚鍔熸垨澶辫触锛夛細璺冲埌 100% 鍐嶅欢杩熼殣钘?*/
    function _finishProgress(success) {
        clearTimeout(_progressTimer);
        _progressTimer = null;
        const label = success ? '瑙ｆ瀽瀹屾垚 鉁? : '宸茬粨鏉?;
        _animateTo(100, label, 250);
        const fill = document.getElementById('agent-progress-fill');
        const pctEl = document.getElementById('agent-progress-pct');
        if (success) {
            fill.classList.add('done');
            pctEl.classList.add('done');
        }
        // 1.2s 鍚庤嚜鍔ㄩ殣钘?
        setTimeout(() => _resetProgress(), 1200);
    }

    function _resetProgress() {
        clearTimeout(_progressTimer);
        _progressTimer = null;
        _currentPct = 0;
        const wrap = document.getElementById('agent-progress-wrap');
        if (wrap) wrap.hidden = true;
        _setProgressUI(0, '姝ｅ湪杩炴帴鈥?);
        const fill = document.getElementById('agent-progress-fill');
        const pctEl = document.getElementById('agent-progress-pct');
        if (fill) fill.classList.remove('done');
        if (pctEl) pctEl.classList.remove('done');
    }

    function _animateTo(pct, status, ms) {
        _currentPct = pct;
        // CSS transition 澶勭悊瀹為檯瀹藉害鍔ㄧ敾
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

    // 鈹€鈹€ Helpers 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
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
            // 瀵硅薄涓湁 error 鍒欎负澶辫触锛屽惁鍒欎负鎴愬姛锛涚敱璋冪敤鏂规樉寮忎紶鍏?
            // 杩欓噷榛樿 true锛堝閮ㄤ細鍦ㄧ煡閬撶粨鏋滃悗璋冪敤 _finishProgress锛?
        }
    }

    function _esc(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    return { init };
})();


