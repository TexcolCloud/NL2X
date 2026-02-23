## ADDED Requirements

### Requirement: 鑷劧璇█瑙ｆ瀽涓虹粨鏋勫寲琛屾暟鎹?

绯荤粺 SHALL 灏嗙敤鎴疯緭鍏ョ殑鑷劧璇█鏂囨湰鍙戦€佺粰 LLM锛孡LM 杩斿洖涓€涓?JSON 瀵硅薄锛屽叾 key 蹇呴』涓庡綋鍓?Sheet 鐨勫垪鍚嶏紙header row锛岀涓€琛岋級涓ユ牸瀵瑰簲锛岀己澶卞瓧娈靛€间负 `null`銆?

璇锋眰 SHALL 浠?Electron **涓昏繘绋?*閫氳繃 Node.js 鍐呯疆 `https` 妯″潡鍙戝嚭锛屼互閬垮厤 CORS 闂銆?

璇锋眰鏍煎紡 SHALL 鍏煎 OpenAI Chat Completions API锛坄POST /v1/chat/completions`锛夈€?

#### Scenario: 鎴愬姛瑙ｆ瀽
- **WHEN** 鐢ㄦ埛杈撳叆鑷劧璇█锛屽綋鍓?Sheet 鏈夊垪鍚嶏紝LLM 杩斿洖鍚堟硶 JSON
- **THEN** 瑙ｆ瀽缁撴灉灞曠ず鍦ㄩ瑙堝尯锛屾瘡鍒楀悕瀵瑰簲鍏惰В鏋愬嚭鐨勫€硷紝缂哄け鍒楁樉绀轰负绌?

#### Scenario: LLM 杩斿洖闈炴硶 JSON
- **WHEN** LLM 杩斿洖鍐呭鏃犳硶琚?`JSON.parse` 瑙ｆ瀽
- **THEN** 閿欒鎻愮ず锛?AI 杩斿洖鏍煎紡閿欒锛岃閲嶈瘯"锛屼笉鍐欏叆琛ㄦ牸

#### Scenario: 鏃犲垪澶存椂鎷掔粷璋冪敤
- **WHEN** 褰撳墠 Sheet 绗竴琛屼负绌猴紙鏃犲垪鍚嶏級
- **THEN** 绯荤粺鎻愮ず锛?褰撳墠 Sheet 鏃犲垪鍚嶏紝璇峰厛璁剧疆琛ㄥご鍚庡啀浣跨敤 AI 濉啓"锛屼笉鍙戣捣 LLM 璇锋眰

#### Scenario: API 璇锋眰澶辫触
- **WHEN** 缃戠粶閿欒鎴?API 杩斿洖闈?2xx 鐘舵€?
- **THEN** 閿欒鎻愮ず鏄剧ず HTTP 鐘舵€佺爜鍙婅繑鍥炵殑閿欒淇℃伅锛屼笉鍐欏叆琛ㄦ牸

---

### Requirement: 绯荤粺 Prompt 鑷姩娉ㄥ叆鍒楀悕

绯荤粺 SHALL 鍦ㄦ瘡娆?LLM 璋冪敤鍓嶏紝灏嗗綋鍓?Sheet 鐨勫垪鍚嶆暟缁勬嫾鍏?system message锛?

```
浣犳槸涓€涓粨鏋勫寲鏁版嵁瑙ｆ瀽鍔╂墜銆傚綋鍓嶈〃鏍煎垪鍚嶄负锛歔<鍒楀悕1>, <鍒楀悕2>, ...]銆?
璇峰皢鐢ㄦ埛杈撳叆瑙ｆ瀽涓?JSON 瀵硅薄锛宬ey 蹇呴』涓ユ牸瀵瑰簲鍒楀悕锛岀己澶辩殑瀛楁鍊艰涓?null銆?
鍙緭鍑?JSON锛屼笉瑕佷换浣曞叾浠栧唴瀹广€?
<鐢ㄦ埛鑷畾涔?System Prompt锛堣嫢鏈夛級>
```

#### Scenario: 鍒楀悕姝ｇ‘娉ㄥ叆
- **WHEN** 褰撳墠 Sheet 鍒楀悕涓?["濮撳悕", "骞撮緞", "鍩庡競"]锛岀敤鎴疯緭鍏?寮犱笁锛?5宀侊紝鏉ヨ嚜鍖椾含"
- **THEN** LLM 鏀跺埌鐨?system message 鍖呭惈涓婅堪鍒楀悕锛屾湡鏈涜繑鍥?`{"濮撳悕":"寮犱笁","骞撮緞":"25","鍩庡競":"鍖椾含"}`

### Requirement: Update (2026-02-23): Header And Row Mapping

System SHALL use row index 2 (third row) as header names when parsing and mapping AI output.

#### Scenario: Write target row by third-column count
- **WHEN** column C (third column) has N non-empty data rows below row 3
- **THEN** clicking "write to sheet" writes to data row N+1 (sheet row index: 2 + N + 1).
