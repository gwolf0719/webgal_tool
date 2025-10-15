# WebGAL Script Editor Extension

功能強大的 WebGAL 腳本編輯器擴展，為 Cursor 和 VS Code 提供完整的 WebGAL 腳本開發支持。

## 快速安裝

### 方法一：直接下載安裝包

1. 下載 [webgal-script-extension-0.2.0.vsix](https://github.com/gwolf0719/webgal_tool/raw/main/webgal-script-extension-0.2.0.vsix)
2. 在 VS Code/Cursor 中：擴展面板 → `...` → 從 VSIX 安裝
3. 選擇下載的文件

### 方法二：命令行安裝

```bash
# 下載文件
curl -LO https://github.com/gwolf0719/webgal_tool/raw/main/webgal-script-extension-0.2.0.vsix

# 安裝
code --install-extension webgal-script-extension-0.2.0.vsix
# 或使用 Cursor
cursor --install-extension webgal-script-extension-0.2.0.vsix
```

詳細安裝說明請查看 [INSTALL.md](INSTALL.md)

## 功能特色

### 🎨 語法高亮
- 精美的語法著色，區分命令、角色名、對話、參數、註釋
- 自定義深色主題，提升閱讀體驗

### ✨ 智能補全
- **命令補全**：輸入時自動提示 40+ 種 WebGAL 命令
- **內建函式補全**：支援所有 WebGAL 內建函式（數學、字串、亂數等）
- **參數補全**：根據命令類型智能提示對應參數
- **資源補全**：自動掃描並補全圖片、音頻、場景文件
- **角色名補全**：追蹤腳本中出現的角色名
- **變數補全**：追蹤所有變數定義
- **標籤補全**：在跳轉時提示所有可用標籤

### 🔍 定義跳轉
- 點擊標籤名跳轉到定義位置
- **🆕 跨目錄場景跳轉**：支持相對路徑和絕對路徑
- **🆕 智能場景創建**：點擊不存在的場景時提供創建選項
- 點擊變數跳轉到定義處

### 📖 Hover 提示
- 懸停命令顯示詳細說明和範例
- 懸停資源文件顯示預覽（圖片、音頻信息）
- 懸停變數顯示定義位置和值

### 🗺️ 大綱視圖
顯示場景結構，包括：
- 📍 標籤 (label)
- 🔀 選擇分支 (choose)
- 🎬 場景調用 (changeScene, callScene)
- 💾 變數定義 (setVar)

### 🔧 語法診斷
實時檢查：
- ❌ 命令拼寫錯誤
- ⚠️ 缺少必需參數
- ⚠️ 資源文件不存在
- ❌ 標籤未定義
- ⚠️ 變數未定義

### 🆕 場景管理 (v0.2.0)
- **🎯 場景創建嚮導**：快速創建新場景文件或目錄
- **📁 多層目錄支援**：支持最多10層深度的目錄結構
- **🔍 智能路徑解析**：自動搜索多種可能的場景路徑
- **⚡ 快速場景跳轉**：一鍵跳轉到任意場景文件

### 🔄 重構工具
- 重命名標籤，自動更新所有引用
- 重命名變數，自動更新所有使用
- 查找所有引用

### 📝 代碼片段
快速插入常用模板：
- 對話、旁白
- 選擇分支結構
- 標籤和跳轉
- 背景、立繪、音樂切換
- 條件判斷

## 使用方法

### 1. 配置

在設置中配置 WebGAL 遊戲目錄：

```json
{
  "webgal.gamePath": "game",
  "webgal.enablePreview": true,
  "webgal.validateResources": true,
  "webgal.suggestCharacters": true,
  "webgal.autoScanResources": true
}
```

### 2. 語法示例

```webgal
; 這是註釋
; 場景：開始

label:start;

changeBg:background.jpg -next;
bgm:music.mp3;

角色名:這是一段對話 -v=voice.ogg;
:這是旁白;

choose:選項A:labelA|選項B:labelB;

label:labelA;
jumpLabel:end;

label:labelB;

label:end;
```

### 3. 快捷命令

- `Ctrl+Shift+P` → 輸入 "WebGAL" 查看所有命令
- `webgal.insertDialogue` - 插入對話
- `webgal.insertChoice` - 插入選擇分支
- `webgal.insertLabel` - 插入標籤
- `webgal.gotoLabel` - 跳轉到標籤
- `webgal.scanResources` - 掃描資源
- **🆕 `webgal.createSceneWizard` - 場景創建嚮導**
- **🆕 `webgal.createScene` - 創建場景**
- **🆕 `webgal.gotoScene` - 跳轉到場景**

### 4. 一鍵查看所有功能

**快速查看所有可用指令**：
- 在任意 `.txt` 文件中輸入 `Ctrl+Space` 查看所有補全選項
- 輸入任何 WebGAL 命令後按 `:` 查看該命令的所有參數
- 輸入 `$` 查看所有內建函式（數學、字串、亂數等）
- 使用 `Ctrl+Shift+P` → 輸入 "WebGAL" 查看所有擴展命令

### 5. 代碼片段

輸入以下前綴然後按 Tab：
- `dialogue` - 對話模板
- `choose` - 選擇分支模板
- `label` - 標籤定義
- `jump` - 跳轉標籤
- `changeBg` - 更改背景
- `setVar` - 設置變數

## WebGAL 命令參考

### 基礎命令

| 命令 | 說明 | 範例 |
|------|------|------|
| `角色:對話` | 顯示對話 | `角色:你好 -v=voice.ogg` |
| `changeBg` | 更改背景 | `changeBg:bg.jpg -next` |
| `changeFigure` | 更改立繪 | `changeFigure:char.png -left` |
| `bgm` | 播放音樂 | `bgm:music.mp3` |
| `playVideo` | 播放視頻 | `playVideo:video.mp4` |

### 控制流命令

| 命令 | 說明 | 範例 |
|------|------|------|
| `label` | 定義標籤 | `label:start` |
| `jumpLabel` | 跳轉標籤 | `jumpLabel:start` |
| `choose` | 選擇分支 | `choose:A:labelA\|B:labelB` |
| `setVar` | 設置變數 | `setVar:score=100` |
| `callScene` | 調用場景 | `callScene:sub.txt -when=flag==1` |
| `changeScene` | 切換場景 | `changeScene:next.txt` |

### 進階命令

| 命令 | 說明 | 範例 |
|------|------|------|
| `setAnimation` | 設置動畫 | `setAnimation:enter -target=fig-left` |
| `miniAvatar` | 小頭像 | `miniAvatar:avatar.png` |
| `unlockCg` | 解鎖CG | `unlockCg:cg.jpg -name=CG名稱` |
| `unlockBgm` | 解鎖BGM | `unlockBgm:music.mp3 -name=曲名` |
| `pixiPerform` | 特效演出 | `pixiPerform:rain` |

## 🧮 WebGAL 內建函式參考

> **注意**：WebGAL 使用 `angular-expressions` 解析器，支援的表達式功能有限。以下列出的是**實際支援**的函式。

### WebGAL 原生支援的函式

| 函式 | 說明 | 範例 | 返回值 |
|------|------|------|--------|
| `random()` | WebGAL 內建亂數函式 | `setVar:dice=random(1,6)` | 1-6 之間的隨機整數 |
| `random()` | 無參數時等同 Math.random() | `setVar:rand=random()` | 0.0 ~ 1.0 |
| `Math.random()` | JavaScript 原生亂數 | `setVar:num=Math.random()` | 0.0 ~ 1.0 |

### 基本運算支援

WebGAL 支援基本的數學運算：
- **四則運算**：`+`, `-`, `*`, `/`
- **括號運算**：`()`
- **比較運算**：`>`, `<`, `>=`, `<=`, `==`, `!=`

```webgal
; 基本數學運算
setVar:result=5 + 3 * 2;        ; 結果: 11
setVar:score=player_score + bonus; ; 變數相加
setVar:percentage=current / max * 100; ; 計算百分比

; 條件表達式
setVar:is_high_score=player_score > 1000;
setVar:can_afford=money >= item_price;
```

### 亂數生成範例

```webgal
; 使用 WebGAL 內建亂數函式
setVar:dice_roll=random(1,6);     ; 1-6 之間的隨機整數
setVar:coin_flip=random(0,1);     ; 0 或 1
setVar:random_float=random();     ; 0.0-1.0 之間的隨機小數

; 複雜的亂數計算（需要手動實現）
setVar:random_int=Math.random() * 100; ; 0-100 的隨機小數
setVar:random_choice=random(1,3);      ; 1-3 之間的隨機整數

; 根據亂數進行條件判斷
setVar:dice_roll=random(1,6);
if:dice_roll >= 4 -when=1;
  角色:運氣不錯！骰子顯示 ${dice_roll}；
else;
  角色:運氣不佳...骰子顯示 ${dice_roll}；
endif;
```

### 實際可用的範例

```webgal
; 基本變數操作
setVar:player_score=100;
setVar:bonus=50;
setVar:total_score=player_score + bonus; ; 150

; 條件判斷
setVar:is_winner=total_score > 1000;
setVar:can_buy=money >= item_price;

; 簡單的遊戲邏輯
setVar:health=100;
setVar:damage=random(10,20);
setVar:new_health=health - damage;
setVar:is_alive=new_health > 0;

; 使用在對話中
if:is_alive -when=1;
  角色:我還活著！生命值：${new_health}；
else;
  角色:我被擊敗了...；
endif;
```

### ⚠️ 不支援的功能

以下 JavaScript 功能在 WebGAL 中**不支援**：
- `Math.floor()`, `Math.ceil()`, `Math.round()` 等數學函式
- `String.toUpperCase()`, `String.toLowerCase()` 等字串函式  
- `Array.push()`, `Array.pop()` 等陣列函式
- `Date.now()`, `new Date()` 等日期函式

如需這些功能，請考慮在 WebGAL 引擎層面擴展或使用其他方式實現。

## 專案結構建議

```
game/
├── scene/              # 場景腳本
│   ├── start.txt
│   ├── chapter1/       # 支持多層目錄
│   │   ├── act1/       # 第二層
│   │   │   ├── scene1.txt
│   │   │   └── scene2.txt
│   │   └── act2/       # 第二層
│   ├── chapter2/       # 第一層
│   │   └── act1/       # 第二層
│   └── endings/        # 結局目錄
├── background/         # 背景圖片
├── figure/            # 立繪
├── bgm/               # 背景音樂
├── vocal/             # 語音文件
├── video/             # 視頻文件
└── config.txt         # 遊戲配置
```

### 🆕 多層目錄場景引用示例

```webgal
; 支持相對路徑引用
changeScene:chapter1/act1/scene1.txt;
callScene:../act2/intro.txt;

; 支持自動添加 .txt 擴展名
changeScene:chapter1/act1/scene2;

; 智能路徑解析，自動搜索多種可能路徑
changeScene:scene1.txt;  ; 會提示選擇多個匹配項
```

## 常見問題

### Q: 資源補全不工作？
A: 確保 `webgal.gamePath` 配置正確，並運行 "WebGAL: 掃描資源" 命令。

### Q: 如何自定義語法高亮顏色？
A: 在設置中修改 `editor.tokenColorCustomizations`。

### Q: 支持多語言嗎？
A: 目前支持繁體中文界面，腳本內容可使用任何語言。

### Q: 如何創建多層目錄的場景文件？
A: 使用 "WebGAL: 場景創建嚮導" 命令，可以輸入如 `chapter1/act1/scene1.txt` 的多層路徑。

### Q: 場景跳轉找不到文件怎麼辦？
A: 擴展會自動搜索多種可能的路徑，如果找不到會提供創建選項。確保 `webgal.gameBasePath` 配置正確。

### Q: WebGAL 支援哪些內建函式？
A: WebGAL 使用 `angular-expressions` 解析器，支援的功能有限。主要支援：
- `random(min,max)` - 生成指定範圍的隨機整數
- `random()` - 生成 0-1 的隨機小數
- `Math.random()` - JavaScript 原生亂數
- 基本數學運算：`+`, `-`, `*`, `/`, `()`
- 比較運算：`>`, `<`, `>=`, `<=`, `==`, `!=`

### Q: 如何快速查看所有可用的命令和函式？
A: 
- 在任意位置按 `Ctrl+Space` 查看所有補全選項
- 輸入命令名後按 `:` 查看參數補全
- 輸入 `random` 查看亂數函式補全
- 使用 `Ctrl+Shift+P` → 輸入 "WebGAL" 查看所有擴展命令

### Q: 為什麼有些 JavaScript 函式不能使用？
A: WebGAL 為了安全性和效能考量，使用受限的 `angular-expressions` 解析器，不支援完整的 JavaScript 功能。如需更多函式，建議在 WebGAL 引擎層面擴展。

## 反饋與貢獻

- 問題反饋：[GitHub Issues](https://github.com/your-repo/issues)
- 功能建議：歡迎提交 Pull Request

## 版本歷史

### 0.2.0 (2025-10-15) 🆕
- **🎯 場景創建嚮導**：快速創建新場景文件或目錄
- **📁 多層目錄支援**：支持最多10層深度的目錄結構
- **🔍 跨目錄場景跳轉**：支持相對路徑和絕對路徑
- **⚡ 智能場景管理**：自動生成場景模板
- **🛠️ 新增命令**：`createSceneWizard`、`createScene`、`gotoScene`
- **🔧 增強補全**：跨目錄場景文件補全
- **🧮 內建函式支援**：WebGAL 實際支援的函式補全（random、Math.random、基本運算）
- **📚 函式文檔**：準確的內建函式說明和實際可用範例
- **⚡ 一鍵查看**：快速查看所有可用命令和函式
- **⚠️ 功能限制說明**：明確標示不支援的 JavaScript 功能

### 0.1.0 (2025-10-14)
- ✨ 初始版本發布
- 🎨 語法高亮支持
- ✨ 智能補全功能
- 🔍 定義跳轉
- 📖 Hover 提示
- 🗺️ 大綱視圖
- 🔧 語法診斷
- 🔄 重構工具

## 授權

MIT License

---

由 WebGAL 社區開發 ❤️ 為視覺小說創作者提供最佳編輯體驗

