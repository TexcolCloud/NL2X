## Context

褰撳墠搴旂敤锛坄electron-xlsx-editor`锛夋槸涓€涓熀浜?Electron 鐨?XLSX 琛ㄦ牸缂栬緫鍣紝宸插叿澶囷細
- **IPC 鏋舵瀯**锛氫富杩涚▼锛坄main.js`锛?鈫?preload.js锛坄contextBridge`锛夆啍 娓叉煋杩涚▼锛坄renderer.js`锛変笁灞傞殧绂?
- **electron-store**锛氶€氳繃 `config:get` / `config:set` IPC 閫氶亾瀹炵幇杞婚噺绾ф寔涔呭寲
- **鏂囦欢鎿嶄綔**锛氶€氳繃 `file:open` / `file:save` IPC 瀹炵幇
- **娓叉煋灞?*锛歚renderer/index.html` + `renderer/renderer.js` + `renderer/modules/` 妯″潡鍖栫粨鏋?

闇€瑕佸湪姝ゆ灦鏋勪笂鍙犲姞 AI Agent 鑳藉姏锛岃姹傦細
- 鐢ㄦ埛鍙厤缃ぇ闄嗘湇鍔″晢鐨?API Key + API Base URL锛堝吋瀹?OpenAI Chat Completions 鏍煎紡锛?
- 鐢ㄦ埛鍙嚜瀹氫箟 system prompt
- 鑷劧璇█杈撳叆 鈫?瑙ｆ瀽涓轰笌褰撳墠 Sheet 鍒楀悕瀵瑰簲鐨?JSON 琛屾暟鎹?鈫?鍐欏叆涓嬩竴绌鸿

## Goals / Non-Goals

**Goals:**
- 闆堕噸鍨嬩緷璧栵細浠呯敤 Node.js 鍐呯疆 `https` 妯″潡鍙戣捣璇锋眰锛屼笉寮曞叆 openai-sdk
- HTTP 璇锋眰浠?*涓昏繘绋?*鍙戣捣锛屽交搴曡閬挎覆鏌撹繘绋?CORS 闄愬埗
- 閰嶇疆锛圓PI Key銆丅ase URL銆丳rompt锛夐€氳繃宸叉湁 `electron-store`锛坄config:get/set`锛夋寔涔呭寲
- Agent UI 浠?*渚ц竟闈㈡澘**褰㈠紡闆嗘垚锛屼笉鐮村潖鐜版湁宸ュ叿鏍?琛ㄦ牸甯冨眬
- 瑙ｆ瀽缁撴灉鍏?*棰勮纭**锛岀敤鎴锋壒鍑嗗悗鎵嶅啓鍏ヨ〃鏍?

**Non-Goals:**
- 涓嶆敮鎸佹祦寮忥紙streaming锛夊搷搴旓紙绠€鍖栧疄鐜帮級
- 涓嶆敮鎸佸杞璇濅笂涓嬫枃锛堟瘡娆¤緭鍏ョ嫭绔嬭皟鐢級
- 涓嶅 API Key 鍋氬姞瀵嗗瓨鍌紙electron-store 鏄庢枃锛屼笌 VS Code 绛夊悓绫诲伐鍏锋爣鍑嗕竴鑷达級
- 涓嶅唴缃璁?prompt 妯℃澘搴?

## Decisions

### D1锛欻TTP 璇锋眰浠庝富杩涚▼鍙戣捣

**鍐冲畾**锛氭柊澧?`ipcMain.handle('agent:call', ...)` 鍦ㄤ富杩涚▼鐢?Node `https` 璇锋眰 LLM API銆?

**鐞嗙敱**锛氭覆鏌撹繘绋嬪湪 `contextIsolation: true` + 鏃?nodeIntegration 鐜涓嬫棤娉曠洿鎺ヤ娇鐢?`https` 妯″潡锛屼粠涓昏繘绋嬪彂璧疯姹傚畬鍏ㄨ閬?CORS锛屼笖绗﹀悎鐜版湁 IPC 鏋舵瀯妯″紡銆?

**澶囬€夋柟妗?*锛氬湪 preload 閲岀敤 `window.fetch`锛屼絾澶ч檰鏈嶅姟鍟嗛儴鍒嗘帴鍙ｆ棤 CORS 鍝嶅簲澶达紝浼氬け璐ャ€?

---

### D2锛氶厤缃鐢?electron-store

**鍐冲畾**锛欰gent 閰嶇疆锛坄agent.apiKey`銆乣agent.baseUrl`銆乣agent.systemPrompt`锛夌洿鎺ュ瓨鍏ュ凡鏈?`electron-store`锛岄€氳繃鐜版湁 `config:get/set` IPC 璇诲啓銆?

**鐞嗙敱**锛氭棤闇€鏂板 IPC 閫氶亾鎴栧瓨鍌ㄦ満鍒讹紝KISS 鍘熷垯銆?

**澶囬€夋柟妗?*锛氱嫭绔?JSON 閰嶇疆鏂囦欢 + 鏂板 IPC 閫氶亾锛岃繃搴﹀伐绋嬪寲銆?

---

### D3锛氬垪澶磋嚜鍔ㄦ敞鍏?prompt

**鍐冲畾**锛氬湪璋冪敤 LLM 鍓嶏紝娓叉煋杩涚▼浠庡綋鍓?Sheet 璇诲彇绗竴琛岋紙header row锛夊垪鍚嶆暟缁勶紝閫氳繃 IPC payload 浼犵粰涓昏繘绋嬶紝涓昏繘绋嬪皢鍒楀悕鏁扮粍鎷煎叆璇锋眰鐨?system prompt锛?

```
浣犳槸涓€涓粨鏋勫寲鏁版嵁瑙ｆ瀽鍔╂墜銆傚綋鍓嶈〃鏍煎垪鍚嶄负锛歔鍒桝, 鍒桞, ...]銆?
璇峰皢鐢ㄦ埛杈撳叆瑙ｆ瀽涓?JSON 瀵硅薄锛宬ey 蹇呴』涓ユ牸瀵瑰簲鍒楀悕锛岀己澶辩殑瀛楁鐣?null銆?
鍙緭鍑?JSON锛屼笉瑕佸叾浠栧唴瀹广€?
```

鐢ㄦ埛鑷畾涔?prompt 闄勫姞鍦ㄦ鍥哄畾鍓嶇紑涔嬪悗锛屽彲浠ヨ拷鍔犱笟鍔¤涔夎鏄庛€?

**鐞嗙敱**锛氬皢鍒楀悕缁撴瀯娉ㄥ叆 prompt 鏄В鏋愬噯纭€х殑鏍稿績锛岀敱涓昏繘绋嬬粺涓€鎷兼帴閬垮厤娓叉煋渚ч€昏緫鍒嗘暎銆?

---

### D4锛氭柊澧炴枃浠跺竷灞€

```
electron-xlsx-editor/
鈹溾攢鈹€ main.js                  # 鏂板 agent:call IPC handler
鈹溾攢鈹€ preload.js               # 鏂板 callAgent() 鏆撮湶
鈹斺攢鈹€ renderer/
    鈹溾攢鈹€ index.html           # 鏂板 agent 渚ц竟闈㈡澘 HTML 缁撴瀯
    鈹溾攢鈹€ renderer.js          # 鏂板 agent 闈㈡澘閫昏緫璋冪敤
    鈹溾攢鈹€ modules/
    鈹?  鈹斺攢鈹€ agent-panel.js   # [NEW] agent UI 妯″潡
    鈹斺攢鈹€ styles/
        鈹斺攢鈹€ agent.css        # [NEW] agent 闈㈡澘鏍峰紡
```

## Risks / Trade-offs

| 椋庨櫓 | 缂撹В鎺柦 |
|------|----------|
| LLM 杈撳嚭闈炴硶 JSON | 涓昏繘绋嬭В鏋愬墠鐢?`JSON.parse` 鍖呭湪 try/catch锛屽け璐ユ椂杩斿洖閿欒淇℃伅灞曠ず缁欑敤鎴?|
| API Key 鏄庢枃瀛樺偍 | `electron-store` 鏂囦欢鏉冮檺鐢?OS 淇濇姢锛涜鏄庢枃妗ｆ彁绀虹敤鎴烽闄╋紝涓庝笟鐣屽伐鍏蜂繚鎸佷竴鑷?|
| 澶ч檰鏈嶅姟鍟?API 鏍煎紡宸紓 | 绾﹀畾蹇呴』鍏煎 OpenAI Chat Completions 鏍煎紡锛坄/v1/chat/completions`锛夛紝鏂囨。娉ㄦ槑 |
| 鐢ㄦ埛璇啓鍏ラ敊璇暟鎹?| 鎻愪緵棰勮纭姝ラ锛岀敤鎴风湅鍒拌В鏋愮粨鏋滃悗鎵嶇偣鍑?鍐欏叆"鎸夐挳 |

## Open Questions

- 鏄惁闇€瑕佹敮鎸?*澶氬垪鍚堝苟**鐨勬儏鍐碉紙濡?濮撳悕鍜屾€у埆"鏄犲皠鍒颁袱鍒楋級锛熷綋鍓嶈璁?LLM 杈撳嚭涓€涓钩閾?JSON 瀵硅薄锛岀悊璁轰笂宸茶鐩栥€?
- 閿欒閲嶈瘯娆℃暟鏄惁闇€瑕佸彲閰嶇疆锛熷綋鍓嶈璁′笉閲嶈瘯锛屽け璐ョ洿鎺ユ姤閿欍€?

## Update (2026-02-23): Row Mapping Rule

- Header source: row index 2 (third row), not row index 0.
- Write target row: count non-empty cells in column C (third column) for rows > 2; write to row index 2 + count + 1.
- Rationale: align insertion point with business-defined primary progress column (third column).

