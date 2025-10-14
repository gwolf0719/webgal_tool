# WebGAL Script Extension 使用指南

## 安裝與設置

### 1. 安裝擴展

#### 從源碼安裝（開發版）

```bash
cd webgal_tool
npm install
npm run compile
```

然後在 VS Code / Cursor 中：
1. 按 `F5` 啟動調試模式
2. 或者使用 `vsce package` 打包成 .vsix 文件安裝

#### 從市場安裝（發布後）

在擴展市場搜索 "WebGAL Script Editor" 並安裝。

### 2. 配置工作區

在你的 WebGAL 專案根目錄創建 `.vscode/settings.json`：

```json
{
  "webgal.gamePath": "game",
  "webgal.enablePreview": true,
  "webgal.validateResources": true,
  "webgal.suggestCharacters": true,
  "webgal.autoScanResources": true
}
```

### 3. 專案結構

確保你的專案結構符合 WebGAL 標準：

```
your-project/
├── game/
│   ├── scene/              # 場景腳本（.txt 文件）
│   ├── background/         # 背景圖片
│   ├── figure/            # 立繪
│   ├── bgm/               # 背景音樂
│   ├── vocal/             # 語音文件
│   ├── video/             # 視頻文件
│   └── config.txt         # 遊戲配置
└── .vscode/
    └── settings.json      # VS Code 配置
```

## 功能使用

### 智能補全

#### 命令補全

在行首輸入命令名稱，會自動提示：

```webgal
cha[觸發補全]
→ changeBg, changeFigure, changeScene 等選項
```

#### 資源文件補全

輸入命令後，會自動提示對應類型的資源文件：

```webgal
changeBg:[觸發補全]
→ 顯示 background/ 目錄下的所有圖片

changeFigure:[觸發補全]
→ 顯示 figure/ 目錄下的所有立繪
```

#### 參數補全

在命令後輸入空格和 `-`，會提示可用參數：

```webgal
changeBg:bg.jpg -[觸發補全]
→ -next, -when= 等參數選項
```

#### 標籤補全

在 `jumpLabel:` 或 `choose:` 中會提示已定義的標籤：

```webgal
jumpLabel:[觸發補全]
→ 顯示當前文件中所有 label 定義
```

### 定義跳轉

#### 跳轉到標籤定義

將光標放在標籤名上，按 `F12` 或 `Cmd+Click`：

```webgal
jumpLabel:ending    ← 點擊這裡
↓
label:ending;       ← 跳轉到這裡
```

#### 跳轉到場景文件

將光標放在場景名上，按 `F12`：

```webgal
changeScene:chapter2.txt    ← 點擊這裡
↓ 打開 chapter2.txt 文件
```

#### 跳轉到變數定義

將光標放在變數名上，按 `F12`：

```webgal
jumpLabel:end -when=score>50    ← 點擊 score
↓
setVar:score=0;                 ← 跳轉到定義
```

### Hover 提示

將鼠標懸停在不同元素上會顯示相關信息：

#### 命令 Hover

```webgal
changeBg:bg.jpg
   ↑ 懸停顯示：命令說明、參數列表、使用範例
```

#### 資源 Hover

```webgal
changeBg:background.jpg
         ↑ 懸停顯示：圖片預覽、文件信息
```

#### 變數 Hover

```webgal
-when=score>50
      ↑ 懸停顯示：變數定義位置、當前值
```

### 大綱視圖

按 `Ctrl+Shift+O` (Windows/Linux) 或 `Cmd+Shift+O` (Mac) 打開大綱：

- 📍 標籤
- 🔀 選擇分支
- 🎬 場景切換
- 💾 變數定義
- 👤 立繪切換
- 🎵 音樂切換

點擊任意項目可快速跳轉。

### 語法診斷

擴展會即時檢查以下錯誤：

#### 命令拼寫錯誤

```webgal
changbg:bg.jpg    ← 錯誤：未知的命令
```

#### 資源不存在

```webgal
changeBg:notfound.jpg    ← 警告：資源文件不存在
```

#### 標籤未定義

```webgal
jumpLabel:nowhere    ← 錯誤：標籤未定義
```

#### 變數未定義

```webgal
jumpLabel:end -when=undefined_var>0    ← 警告：變數未定義
```

### 引用查找

右鍵點擊標籤或變數 → "查找所有引用" (或按 `Shift+F12`)

```webgal
label:ending;    ← 右鍵 → 查找所有引用
↓ 顯示所有使用此標籤的位置：
- jumpLabel:ending; (第 50 行)
- choose:結束:ending (第 30 行)
```

### 重命名

右鍵點擊標籤或變數 → "重命名符號" (或按 `F2`)

```webgal
label:old_name;    ← 按 F2，輸入 new_name
↓ 自動更新所有引用：
jumpLabel:new_name;
choose:選項:new_name|...
```

### 代碼片段

輸入以下前綴後按 `Tab`：

#### `dialogue` - 對話模板

```webgal
角色名:對話內容 -v=語音文件.ogg
```

#### `choose` - 選擇分支模板

```webgal
choose:選項1:label1|選項2:label2;

label:label1;
; 選項1的內容
jumpLabel:end;

label:label2;
; 選項2的內容

label:end;
```

#### `changeBg` - 更改背景

```webgal
changeBg:background.jpg -next;
```

#### `setVar` - 設置變數

```webgal
setVar:varName=value;
```

### 快捷命令

按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (Mac) 打開命令面板：

#### `WebGAL: 掃描資源`

手動觸發資源掃描，更新資源補全列表。

#### `WebGAL: 插入對話`

在當前位置插入對話模板。

#### `WebGAL: 插入選擇分支`

在當前位置插入完整的選擇分支結構。

#### `WebGAL: 跳轉到標籤`

顯示當前文件所有標籤的快速選擇列表。

## 最佳實踐

### 1. 場景文件組織

```
scene/
├── start.txt              # 開始場景
├── chapter1/
│   ├── _index.txt         # 章節索引
│   ├── scene1.txt
│   └── scene2.txt
├── chapter2/
│   └── ...
└── endings/
    ├── good_end.txt
    └── bad_end.txt
```

### 2. 使用註釋分隔符

使用代碼片段 `separator` 創建清晰的區塊分隔：

```webgal
;========================================
; 場景開始
;========================================

;========================================
; 選擇分支
;========================================
```

### 3. 場景頭部註釋

使用代碼片段 `scene-header` 為每個場景添加說明：

```webgal
;========================================
; 檔案名稱: chapter1_scene1.txt
; 描述: 第一章第一場景
; 說明: 主角與女主角初次相遇
;========================================
```

### 4. 變數命名規範

使用清晰的變數名：

```webgal
; 好的命名
setVar:player_affection=50;
setVar:chapter1_completed=true;
setVar:current_day=1;

; 不好的命名
setVar:x=50;
setVar:flag=true;
setVar:d=1;
```

### 5. 標籤命名規範

使用描述性的標籤名：

```webgal
; 好的命名
label:chapter1_start;
label:choice_help_or_ignore;
label:good_ending;

; 不好的命名
label:l1;
label:a;
label:end1;
```

## 故障排除

### 問題：補全不工作

**解決方案：**
1. 檢查 `webgal.gamePath` 配置是否正確
2. 運行 "WebGAL: 掃描資源" 命令
3. 確保文件語言模式設為 "WebGAL"

### 問題：資源文件找不到

**解決方案：**
1. 確認資源文件確實存在於對應目錄
2. 檢查文件名大小寫（某些系統區分大小寫）
3. 運行 "WebGAL: 掃描資源" 命令刷新索引

### 問題：跳轉功能不工作

**解決方案：**
1. 確保標籤已經定義
2. 檢查標籤名拼寫是否正確
3. 對於場景文件，確保文件存在於 `game/scene/` 目錄

### 問題：語法高亮不生效

**解決方案：**
1. 確認文件擴展名為 `.txt`
2. 手動設置語言模式：右下角點擊 "純文本" → 選擇 "WebGAL"
3. 重新加載視窗

## 進階技巧

### 1. 使用工作區設置

為不同專案設置不同的配置：

`.vscode/settings.json`：
```json
{
  "webgal.gamePath": "public/game",
  "webgal.validateResources": false,
  "files.associations": {
    "*.webgal": "webgal"
  }
}
```

### 2. 自定義代碼片段

在用戶設置中添加自己的代碼片段：

文件 → 首選項 → 用戶代碼片段 → WebGAL

### 3. 鍵盤快捷鍵

自定義常用命令的快捷鍵：

文件 → 首選項 → 鍵盤快捷方式 → 搜索 "webgal"

## 更多資源

- [WebGAL 官方文檔](https://docs.openwebgal.com/)
- [WebGAL GitHub](https://github.com/OpenWebGAL/WebGAL)
- [WebGAL_Terre 編輯器](https://github.com/OpenWebGAL/WebGAL_Terre)
- [擴展問題反饋](https://github.com/your-repo/issues)

---

祝你創作愉快！🎮✨

