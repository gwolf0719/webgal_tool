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

### 數學函式

| 函式 | 說明 | 範例 | 返回值 |
|------|------|------|--------|
| `Math.random()` | 生成 0-1 之間的亂數 | `setVar:random_num=Math.random()` | 0.0 ~ 1.0 |
| `Math.floor()` | 向下取整 | `setVar:floor_num=Math.floor(3.7)` | 3 |
| `Math.ceil()` | 向上取整 | `setVar:ceil_num=Math.ceil(3.2)` | 4 |
| `Math.round()` | 四捨五入 | `setVar:round_num=Math.round(3.6)` | 4 |
| `Math.abs()` | 絕對值 | `setVar:abs_num=Math.abs(-5)` | 5 |
| `Math.max()` | 最大值 | `setVar:max_num=Math.max(1,5,3)` | 5 |
| `Math.min()` | 最小值 | `setVar:min_num=Math.min(1,5,3)` | 1 |
| `Math.pow()` | 次方 | `setVar:power=Math.pow(2,3)` | 8 |
| `Math.sqrt()` | 平方根 | `setVar:sqrt_num=Math.sqrt(16)` | 4 |

### 字串函式

| 函式 | 說明 | 範例 | 返回值 |
|------|------|------|--------|
| `String.length` | 字串長度 | `setVar:name_len=userName.length` | 字串長度 |
| `String.toUpperCase()` | 轉大寫 | `setVar:upper=userName.toUpperCase()` | 大寫字串 |
| `String.toLowerCase()` | 轉小寫 | `setVar:lower=userName.toLowerCase()` | 小寫字串 |
| `String.charAt()` | 取得字符 | `setVar:first_char=userName.charAt(0)` | 第0個字符 |
| `String.indexOf()` | 查找位置 | `setVar:pos=userName.indexOf("a")` | 字符位置 |
| `String.substring()` | 截取字串 | `setVar:sub=userName.substring(0,3)` | 截取的字串 |

### 陣列函式

| 函式 | 說明 | 範例 | 返回值 |
|------|------|------|--------|
| `Array.length` | 陣列長度 | `setVar:arr_len=myArray.length` | 陣列長度 |
| `Array.push()` | 添加元素 | `myArray.push("新元素")` | 新陣列長度 |
| `Array.pop()` | 移除最後元素 | `setVar:last=myArray.pop()` | 被移除的元素 |
| `Array.join()` | 連接陣列 | `setVar:joined=myArray.join(",")` | 連接後的字串 |

### 日期時間函式

| 函式 | 說明 | 範例 | 返回值 |
|------|------|------|--------|
| `Date.now()` | 當前時間戳 | `setVar:timestamp=Date.now()` | 毫秒時間戳 |
| `new Date()` | 創建日期物件 | `setVar:now=new Date()` | 日期物件 |
| `Date.getHours()` | 取得小時 | `setVar:hour=new Date().getHours()` | 0-23 |
| `Date.getMinutes()` | 取得分鐘 | `setVar:min=new Date().getMinutes()` | 0-59 |
| `Date.getDate()` | 取得日期 | `setVar:day=new Date().getDate()` | 1-31 |

### 亂數生成範例

```webgal
; 生成 1-100 的隨機整數
setVar:random_int=Math.floor(Math.random() * 100) + 1;

; 生成 0-10 的隨機小數
setVar:random_float=Math.random() * 10;

; 隨機選擇陣列元素
setVar:choices=["選項A","選項B","選項C"];
setVar:random_choice=choices[Math.floor(Math.random() * choices.length)];

; 根據亂數進行條件判斷
setVar:dice_roll=Math.floor(Math.random() * 6) + 1;
if:dice_roll >= 4 -when=1;
  角色:運氣不錯！骰子顯示 ${dice_roll}；
else;
  角色:運氣不佳...骰子顯示 ${dice_roll}；
endif;
```

### 字串處理範例

```webgal
; 取得玩家名稱的第一個字符
setVar:first_letter=userName.charAt(0);

; 檢查名稱是否包含特定字符
setVar:has_a=userName.indexOf("a") !== -1;

; 轉換為標題格式（首字母大寫）
setVar:title_name=userName.charAt(0).toUpperCase() + userName.substring(1).toLowerCase();

; 字串長度檢查
if:userName.length > 10 -when=1;
  角色:你的名字很長呢！；
else;
  角色:${userName}，是個好名字！；
endif;
```

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

### Q: 如何使用內建函式（如亂數、字串處理）？
A: 擴展支援完整的 WebGAL 內建函式補全。輸入 `$` 或 `Math.` 即可查看所有可用的函式。所有 JavaScript 標準函式都可在 `setVar` 命令中使用。

### Q: 如何快速查看所有可用的命令和函式？
A: 
- 在任意位置按 `Ctrl+Space` 查看所有補全選項
- 輸入命令名後按 `:` 查看參數補全
- 輸入 `$` 查看所有內建函式
- 使用 `Ctrl+Shift+P` → 輸入 "WebGAL" 查看所有擴展命令

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
- **🧮 內建函式支援**：完整的 WebGAL 內建函式補全（數學、字串、陣列、日期）
- **📚 函式文檔**：詳細的內建函式說明和範例
- **⚡ 一鍵查看**：快速查看所有可用命令和函式

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

