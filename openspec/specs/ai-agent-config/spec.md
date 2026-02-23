## Purpose
TBD

## ADDED Requirements

### Requirement: 鐢ㄦ埛鍙厤缃?LLM 杩炴帴鍙傛暟

绯荤粺 SHALL 鍏佽鐢ㄦ埛濉啓骞朵繚瀛樹互涓嬩笁椤归厤缃細
1. **API Key**锛氱敤浜庨壌鏉冪殑瀵嗛挜瀛楃涓?
2. **API Base URL**锛歀LM 鏈嶅姟鐨勫熀纭€鍦板潃锛堝 `https://api.example.com/v1`锛?
3. **System Prompt**锛氳嚜瀹氫箟鐨勭郴缁熸彁绀鸿瘝锛岃拷鍔犲湪绯荤粺鍥哄畾 prompt 涔嬪悗

閰嶇疆 SHALL 閫氳繃 `electron-store` 鎸佷箙鍖栧埌鏈湴锛宬ey 鍒嗗埆涓?`agent.apiKey`銆乣agent.baseUrl`銆乣agent.systemPrompt`銆?
搴旂敤閲嶅惎鍚庨厤缃?SHALL 鑷姩鎭㈠銆?

#### Scenario: 棣栨鎵撳紑閰嶇疆闈㈡澘
- **WHEN** 鐢ㄦ埛棣栨鎵撳紑 AI Agent 閰嶇疆闈㈡澘锛宍electron-store` 涓棤鐩稿叧 key
- **THEN** 涓変釜杈撳叆妗嗗潎鏄剧ず涓虹┖

#### Scenario: 淇濆瓨閰嶇疆
- **WHEN** 鐢ㄦ埛濉啓 API Key銆丅ase URL銆丼ystem Prompt 鍚庣偣鍑?淇濆瓨"
- **THEN** 涓夐」閰嶇疆鍐欏叆 `electron-store`锛岄潰鏉挎樉绀?宸蹭繚瀛?鎻愮ず

#### Scenario: 閲嶅惎鍚庢仮澶嶉厤缃?
- **WHEN** 鐢ㄦ埛閲嶅惎搴旂敤骞舵墦寮€閰嶇疆闈㈡澘
- **THEN** 涓変釜杈撳叆妗嗘樉绀轰笂娆′繚瀛樼殑鍊?

#### Scenario: API Key 鑴辨晱鏄剧ず
- **WHEN** 閰嶇疆闈㈡澘灞曠ず宸蹭繚瀛樼殑 API Key
- **THEN** 杈撳叆妗嗙被鍨嬩负 `password`锛屽€间互鎺╃爜褰㈠紡鏄剧ず

---

### Requirement: 閰嶇疆鏍￠獙

绯荤粺 SHALL 鍦ㄧ敤鎴风偣鍑?淇濆瓨"鏃跺 API Base URL 鍋氬熀纭€鏍煎紡鏍￠獙锛岀‘淇濆叾浠?`http://` 鎴?`https://` 寮€澶淬€?

#### Scenario: Base URL 鏍煎紡闈炴硶
- **WHEN** 鐢ㄦ埛杈撳叆鐨?Base URL 涓嶄互 `http://` 鎴?`https://` 寮€澶村苟鐐瑰嚮"淇濆瓨"
- **THEN** 鏄剧ず閿欒鎻愮ず"URL 鏍煎紡涓嶆纭紝椤讳互 http:// 鎴?https:// 寮€澶?锛屼笉鎵ц淇濆瓨

