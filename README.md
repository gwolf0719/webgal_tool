# WebGAL Script Editor Extension

功能強大的 WebGAL 腳本編輯器擴展，為 Cursor 和 VS Code 提供完整的 WebGAL 腳本開發支持。

## 快速安裝

### 方法一：直接下載安裝包

1. 下載 [webgal-script-extension-0.1.0.vsix](https://github.com/gwolf0719/webgal_tool/raw/main/webgal-script-extension-0.1.0.vsix)
2. 在 VS Code/Cursor 中：擴展面板 → `...` → 從 VSIX 安裝
3. 選擇下載的文件

### 方法二：命令行安裝

```bash
# 下載文件
curl -LO https://github.com/gwolf0719/webgal_tool/raw/main/webgal-script-extension-0.1.0.vsix

# 安裝
code --install-extension webgal-script-extension-0.1.0.vsix
# 或使用 Cursor
cursor --install-extension webgal-script-extension-0.1.0.vsix
```

詳細安裝說明請查看 [INSTALL.md](INSTALL.md)

## 功能特色

### 🎨 語法高亮
- 精美的語法著色，區分命令、角色名、對話、參數、註釋
- 自定義深色主題，提升閱讀體驗

### ✨ 智能補全
- **命令補全**：輸入時自動提示 40+ 種 WebGAL 命令
- **參數補全**：根據命令類型智能提示對應參數
- **資源補全**：自動掃描並補全圖片、音頻、場景文件
- **角色名補全**：追蹤腳本中出現的角色名
- **變數補全**：追蹤所有變數定義
- **標籤補全**：在跳轉時提示所有可用標籤

### 🔍 定義跳轉
- 點擊標籤名跳轉到定義位置
- 點擊場景名打開對應場景文件
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

### 4. 代碼片段

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

## 專案結構建議

```
game/
├── scene/              # 場景腳本
│   ├── start.txt
│   ├── chapter1/
│   └── endings/
├── background/         # 背景圖片
├── figure/            # 立繪
├── bgm/               # 背景音樂
├── vocal/             # 語音文件
├── video/             # 視頻文件
└── config.txt         # 遊戲配置
```

## 常見問題

### Q: 資源補全不工作？
A: 確保 `webgal.gamePath` 配置正確，並運行 "WebGAL: 掃描資源" 命令。

### Q: 如何自定義語法高亮顏色？
A: 在設置中修改 `editor.tokenColorCustomizations`。

### Q: 支持多語言嗎？
A: 目前支持繁體中文界面，腳本內容可使用任何語言。

## 反饋與貢獻

- 問題反饋：[GitHub Issues](https://github.com/your-repo/issues)
- 功能建議：歡迎提交 Pull Request

## 版本歷史

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

