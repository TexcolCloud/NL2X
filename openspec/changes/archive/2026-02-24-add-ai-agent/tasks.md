## 1. 涓昏繘绋嬶細鏂板 Agent IPC Handler

- [x] 1.1 鍦?`main.js` 涓柊澧?`ipcMain.handle('agent:call', ...)` handler锛屼娇鐢?Node `https` 妯″潡鍚?LLM API 鍙戦€?Chat Completions 璇锋眰
- [x] 1.2 handler 鎺ユ敹 payload锛歚{ baseUrl, apiKey, systemPrompt, userInput, headers }`锛坔eaders 涓哄垪鍚嶆暟缁勶級锛屾嫾鎺ュ畬鏁?system message锛堝浐瀹氬墠缂€ + 鍒楀悕 + 鐢ㄦ埛鑷畾涔?prompt锛?
- [x] 1.3 handler 瀵?LLM 杩斿洖浣撳仛 `JSON.parse`锛屾垚鍔熻繑鍥炶В鏋愮粨鏋滃璞★紝澶辫触杩斿洖 `{ error: '...' }`
- [x] 1.4 handler 澶勭悊缃戠粶閿欒鍜岄潪 2xx 鍝嶅簲锛岀粺涓€杩斿洖 `{ error: '<鐘舵€佺爜> <閿欒淇℃伅>' }`

## 2. Preload锛氭毚闇?Agent API

- [x] 2.1 鍦?`preload.js` 鐨?`contextBridge.exposeInMainWorld` 涓柊澧?`callAgent: (payload) => ipcRenderer.invoke('agent:call', payload)`

## 3. 娓叉煋灞傦細Agent 闈㈡澘 HTML 缁撴瀯

- [x] 3.1 鍦?`renderer/index.html` 宸ュ叿鏍忓尯鍩熸柊澧?AI 濉啓"鍒囨崲鎸夐挳锛坄id="btn-agent-toggle"`锛?
- [x] 3.2 鍦ㄤ富甯冨眬涓柊澧?`<aside id="agent-panel">` 渚ц竟闈㈡澘锛岄粯璁ら殣钘忥紙`hidden` 灞炴€э級
- [x] 3.3 闈㈡澘鍐呭寘鍚細閰嶇疆鎶樺彔鍖猴紙API Key銆丅ase URL銆丼ystem Prompt textarea銆佷繚瀛樻寜閽級銆佽嚜鐒惰瑷€杈撳叆 textarea銆佽В鏋愭寜閽€侀瑙堝尯銆佸啓鍏?鍙栨秷鎸夐挳

## 4. 娓叉煋灞傦細Agent 闈㈡澘鏍峰紡

- [x] 4.1 鏂板缓 `renderer/styles/agent.css`锛屽疄鐜颁晶杈归潰鏉垮竷灞€锛堝浐瀹氬搴?300px锛宖lex 鍒楁帓鍒楋紝鍙充晶 border锛?
- [x] 4.2 瀹炵幇閰嶇疆鎶樺彔鍖虹殑灞曞紑/鏀惰捣杩囨浮鍔ㄧ敾
- [x] 4.3 鍦?`index.html` 涓紩鍏?`agent.css`

## 5. 娓叉煋灞傦細Agent 闈㈡澘閫昏緫妯″潡

- [x] 5.1 鏂板缓 `renderer/modules/agent-panel.js`锛屽鍑?`initAgentPanel()` 鍑芥暟
- [x] 5.2 瀹炵幇"AI 濉啓"鎸夐挳鍒囨崲闈㈡澘鏄剧ず/闅愯棌閫昏緫
- [x] 5.3 瀹炵幇閰嶇疆鍖哄姞杞斤紙鍚姩鏃堕€氳繃 `electronAPI.getConfig` 璇诲彇涓夐」閰嶇疆濉叆杈撳叆妗嗭級
- [x] 5.4 瀹炵幇"淇濆瓨閰嶇疆"鎸夐挳锛氭牎楠?Base URL 鏍煎紡 鈫?璋冪敤 `electronAPI.setConfig` 鍒嗗埆淇濆瓨涓夐」 鈫?鏄剧ず"鉁?宸蹭繚瀛?2 绉掓彁绀?
- [x] 5.5 瀹炵幇"瑙ｆ瀽"鎸夐挳锛氳幏鍙栧綋鍓?Sheet 鍒楀悕锛坔eader row锛夆啋 璋冪敤 `electronAPI.callAgent` 鈫?澶勭悊杩斿洖缁撴灉锛堟垚鍔熸樉绀洪瑙堬紝澶辫触鏄剧ず閿欒鎻愮ず锛?
- [x] 5.6 瀹炵幇棰勮鍖烘覆鏌擄細鎸夊垪鍚嶉『搴忓睍绀鸿В鏋愬€硷紝null 鍊兼樉绀轰负绌哄瓧绗︿覆
- [x] 5.7 瀹炵幇"鍐欏叆琛ㄦ牸"鎸夐挳锛氳皟鐢ㄤ富 `renderer.js` 鎻愪緵鐨勫啓琛屾帴鍙ｏ紝灏嗚В鏋愮粨鏋滃啓鍏ュ綋鍓?Sheet 涓嬩竴绌鸿锛屾竻绌鸿緭鍏?棰勮鍖?
- [x] 5.8 瀹炵幇"鍙栨秷"鎸夐挳锛氭竻绌洪瑙堝尯锛屼繚鐣欒緭鍏ユ鍐呭

## 6. 娓叉煋灞傦細闆嗘垚 agent-panel 妯″潡

- [x] 6.1 鍦?`renderer/renderer.js` 涓?`import { initAgentPanel }` 骞跺湪鍒濆鍖栨椂璋冪敤锛屼紶鍏ヨ幏鍙栧綋鍓?Sheet 鍒楀悕鐨勫洖璋冨嚱鏁?
- [x] 6.2 鍦?`renderer.js` 涓毚闇插啓琛屾帴鍙ｏ紙鎴栭€氳繃鍥炶皟鏂瑰紡浼犵粰 agent-panel锛夛紝渚?5.7 璋冪敤

## 7. 楠岃瘉涓庢祴璇?

- [x] 7.1 閰嶇疆濉啓骞朵繚瀛樺悗閲嶅惎搴旂敤锛岀‘璁や笁椤归厤缃纭仮澶?
- [x] 7.2 Base URL 鏍煎紡閿欒鏃讹紝纭淇濆瓨琚樆姝㈠苟鏄剧ず閿欒鎻愮ず
- [x] 7.3 褰撳墠 Sheet 鏃犲垪鍚嶆椂锛岀‘璁?瑙ｆ瀽"鎸夐挳缁欏嚭鎻愮ず涓斾笉璋冪敤 LLM
- [x] 7.4 杈撳叆鑷劧璇█鍚庯紝纭棰勮鍖烘寜鍒楀悕椤哄簭灞曠ず瑙ｆ瀽缁撴灉
- [x] 7.5 鐐瑰嚮"鍐欏叆琛ㄦ牸"鍚庯紝纭鏁版嵁鍐欏叆 Sheet 涓旇緭鍏?棰勮鍖烘竻绌?
- [x] 7.6 妯℃嫙 LLM 杩斿洖闈炴硶 JSON锛岀‘璁ゆ樉绀洪敊璇彁绀轰笖涓嶅啓鍏?


## Clarifications (2026-02-23)

- Task 5.7 target row rule is refined: map by row-3 headers, then write to data row N+1 where N is the count of non-empty cells in column C (third column) below row 3.
- Verification tasks 7.1-7.6 were validated through source-level checks and automated smoke script scripts/verify-agent-change.mjs.

