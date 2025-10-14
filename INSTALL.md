# WebGAL Script Extension 安裝指南

## 方法一：開發模式測試（推薦用於測試）

### 1. 確保已安裝必要工具

```bash
# 檢查 Node.js 版本（需要 v16 或更高）
node --version

# 檢查 npm 版本
npm --version
```

如果沒有安裝 Node.js，請到 [nodejs.org](https://nodejs.org/) 下載安裝。

### 2. 克隆或下載專案

```bash
# 如果使用 Git
git clone https://github.com/gwolf0719/webgal_tool.git
cd webgal_tool

# 或者直接下載 ZIP 文件並解壓
```

### 3. 安裝依賴

```bash
npm install
```

### 4. 編譯專案

```bash
npm run compile
```

### 5. 在 VS Code / Cursor 中測試

1. 用 VS Code 或 Cursor 打開 `webgal_tool` 資料夾
2. 按 `F5` 鍵（或點擊 Run → Start Debugging）
3. 會打開一個新的擴展開發窗口
4. 在新窗口中打開 `example/game/scene/test.txt` 測試功能

## 方法二：打包並安裝（推薦用於日常使用）

### 1. 安裝 vsce 工具

```bash
npm install -g @vscode/vsce
```

### 2. 打包擴展

```bash
cd /Users/james/Project/webgal_tool
vsce package
```

這會生成一個 `.vsix` 文件，例如 `webgal-script-extension-0.1.0.vsix`

### 3. 安裝 .vsix 文件

#### 在 VS Code 中：
1. 打開 VS Code
2. 點擊左側的擴展圖標（或按 `Cmd+Shift+X`）
3. 點擊右上角的 `...` 按鈕
4. 選擇 "從 VSIX 安裝..."
5. 選擇剛才生成的 `.vsix` 文件

#### 在 Cursor 中：
1. 打開 Cursor
2. 點擊左側的擴展圖標（或按 `Cmd+Shift+X`）
3. 點擊右上角的 `...` 按鈕
4. 選擇 "從 VSIX 安裝..."
5. 選擇剛才生成的 `.vsix` 文件

#### 使用命令行安裝：

```bash
# VS Code
code --install-extension webgal-script-extension-0.1.0.vsix

# Cursor
cursor --install-extension webgal-script-extension-0.1.0.vsix
```

## 方法三：發布到擴展市場（未來）

當擴展準備好公開發布時，可以發布到 VS Code Marketplace：

```bash
# 需要先創建 Publisher 帳號
vsce publish
```

發布後，用戶就可以直接在擴展市場搜索並安裝。

## 驗證安裝

### 1. 檢查擴展是否已安裝

1. 打開 VS Code / Cursor
2. 按 `Cmd+Shift+X` 打開擴展面板
3. 搜索 "WebGAL"
4. 應該能看到 "WebGAL Script Editor"

### 2. 測試功能

1. 創建或打開一個 `.txt` 文件
2. 在右下角點擊語言模式（顯示為 "純文本"）
3. 在彈出的選單中選擇 "WebGAL"
4. 或者使用快捷鍵 `Cmd+K M`，然後輸入 "webgal"

### 3. 測試語法高亮

在文件中輸入：

```webgal
label:test;
角色:這是一段對話;
changeBg:background.jpg -next;
```

應該看到不同顏色的語法高亮。

### 4. 測試自動補全

輸入 `cha` 然後按 `Ctrl+Space`，應該看到命令補全提示。

## 配置 WebGAL 專案

### 1. 專案結構

確保你的 WebGAL 專案結構如下：

```
your-project/
├── game/
│   ├── scene/              # 場景腳本
│   ├── background/         # 背景圖片
│   ├── figure/            # 立繪
│   ├── bgm/               # 背景音樂
│   ├── vocal/             # 語音文件
│   ├── video/             # 視頻文件
│   └── config.txt         # 遊戲配置
└── .vscode/
    └── settings.json      # VS Code 配置
```

### 2. 創建配置文件

在專案根目錄創建 `.vscode/settings.json`：

```json
{
  "webgal.gamePath": "game",
  "webgal.enablePreview": true,
  "webgal.validateResources": true,
  "webgal.suggestCharacters": true,
  "webgal.autoScanResources": true,
  "files.associations": {
    "*.txt": "webgal"
  }
}
```

### 3. 手動設置文件語言

如果 `.txt` 文件沒有自動識別為 WebGAL：

1. 打開 `.txt` 文件
2. 右下角點擊 "純文本"
3. 選擇 "WebGAL" 或 "WebGAL Script"

或者在設置中添加：

```json
{
  "files.associations": {
    "*.txt": "webgal"
  }
}
```

## 常見問題排除

### 問題 1：擴展沒有激活

**解決方案：**
1. 檢查文件是否識別為 WebGAL 語言
2. 重新加載窗口：`Cmd+Shift+P` → "重新加載窗口"
3. 查看擴展是否已啟用

### 問題 2：編譯失敗

**解決方案：**
```bash
# 清理並重新安裝
rm -rf node_modules package-lock.json
npm install
npm run compile
```

### 問題 3：vsce 命令找不到

**解決方案：**
```bash
# 重新安裝 vsce
npm install -g @vscode/vsce

# 或使用 npx
npx @vscode/vsce package
```

### 問題 4：安裝 .vsix 失敗

**解決方案：**
1. 確保 .vsix 文件完整下載
2. 嘗試使用命令行安裝
3. 檢查 VS Code / Cursor 版本是否支持

### 問題 5：語法高亮不顯示

**解決方案：**
1. 確認文件語言模式設為 "WebGAL"
2. 重新加載窗口
3. 檢查主題設置

## 更新擴展

### 從源碼更新：

```bash
cd webgal_tool
git pull
npm install
npm run compile
```

然後重新打包安裝。

### 從 .vsix 更新：

1. 卸載舊版本
2. 安裝新版本的 .vsix 文件

## 卸載擴展

### 在 VS Code / Cursor 中：

1. 打開擴展面板
2. 找到 "WebGAL Script Editor"
3. 點擊齒輪圖標 → "卸載"

### 使用命令行：

```bash
# VS Code
code --uninstall-extension webgal-community.webgal-script-extension

# Cursor
cursor --uninstall-extension webgal-community.webgal-script-extension
```

## 快速開始

安裝完成後，打開範例文件開始體驗：

```bash
cd webgal_tool
code example/game/scene/test.txt
```

或者在 Cursor 中：

```bash
cursor example/game/scene/test.txt
```

享受編寫 WebGAL 腳本的樂趣！🎮✨

---

如有問題，請訪問：
- GitHub Issues: https://github.com/gwolf0719/webgal_tool/issues
- WebGAL 官方文檔: https://docs.openwebgal.com/

