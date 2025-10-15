# WebGAL 多層目錄支援說明

## 🎯 支援的目錄層級

WebGAL 擴展**完全支援多層資料夾結構**，包括：

### ✅ **支援的層級深度**
- **理論上限**：10 層目錄深度
- **實際建議**：3-5 層（保持良好的組織結構）
- **遞歸掃描**：自動掃描所有子目錄

### 📁 **支援的目錄結構範例**

```
game/scene/
├── start.txt                           # 根目錄
├── daily_loop.txt                      # 根目錄
├── prologue/                           # 1層
│   └── intro.txt
├── chapter1/                           # 1層
│   ├── chapter1_main.txt              # 2層
│   ├── act1/                          # 2層
│   │   ├── scene1.txt                 # 3層
│   │   ├── scene2.txt                 # 3層
│   │   └── part1/                     # 3層
│   │       └── battle.txt             # 4層
│   └── act2/                          # 2層
│       └── dialogue.txt               # 3層
├── chapter2/                           # 1層
│   ├── act1/                          # 2層
│   │   └── scene1.txt                 # 3層
│   └── act2/                          # 2層
│       └── scene1.txt                 # 3層
├── events/                             # 1層
│   ├── special/                       # 2層
│   │   └── festival.txt               # 3層
│   └── battle/                        # 2層
│       └── boss.txt                   # 3層
└── endings/                            # 1層
    ├── good/                          # 2層
    │   └── true_ending.txt            # 3層
    └── bad/                           # 2層
        └── bad_ending.txt             # 3層
```

## 🔍 **路徑解析功能**

### **1. 相對路徑支援**
```webgal
; 在 chapter1/act1/scene1.txt 中
changeScene:scene2.txt;                    ; 同層級
changeScene:../chapter1_main.txt;          ; 上一層
changeScene:../../start.txt;               ; 上兩層
changeScene:../../../chapter2/act1/scene1.txt;  ; 跨章節
```

### **2. 絕對路徑支援**
```webgal
; 從任何位置跳轉
changeScene:chapter1/act1/scene1.txt;      ; 完整路徑
changeScene:events/special/festival.txt;   ; 三層目錄
changeScene:endings/good/true_ending.txt;  ; 結局路徑
```

### **3. 智能路徑解析**
擴展會自動嘗試以下路徑：
- 直接路徑
- 相對路徑（基於當前文件）
- 父目錄路徑（最多向上 5 層）
- 常見目錄結構

## 🛠️ **場景創建嚮導支援**

### **創建多層目錄**
1. 使用 `webgal.createSceneWizard` 命令
2. 選擇「創建目錄和文件」
3. 輸入路徑如：`chapter1/act1/scene1.txt`
4. 系統會自動創建所有必要的父目錄

### **支持的創建選項**
- ✅ 創建單個文件
- ✅ 創建單個目錄
- ✅ 創建目錄 + 文件
- ✅ 創建多層目錄結構

## 🧪 **測試多層目錄功能**

### **測試文件**
我們已經創建了以下測試文件：

1. **三層目錄**：`chapter1/act1/scene1.txt`
2. **同層級跳轉**：`chapter1/act1/scene2.txt`
3. **跨章節跳轉**：`chapter2/act1/scene1.txt`

### **測試步驟**

1. **打開測試文件**：
   ```bash
   cursor example/game/scene/chapter1/act1/scene1.txt
   ```

2. **測試跨層級跳轉**：
   - 點擊 `changeScene:../scene2.txt`
   - 點擊 `changeScene:../../start.txt`
   - 點擊 `changeScene:../chapter2/act1/scene1.txt`

3. **測試場景創建**：
   - 點擊不存在的場景路徑
   - 使用創建嚮導建立新目錄結構

## 📋 **實際使用範例**

### **範例 1：章節式結構**
```webgal
; 在 chapter1/act1/scene1.txt 中
主角:第一章第一幕開始;

; 跳轉到同章節的其他場景
changeScene:../act2/scene1.txt;
changeScene:chapter1_main.txt;

; 跳轉到其他章節
changeScene:../../chapter2/act1/scene1.txt;
```

### **範例 2：事件式結構**
```webgal
; 在 events/special/festival.txt 中
主角:參加節慶活動;

; 跳轉到戰鬥事件
changeScene:../battle/boss.txt;

; 跳轉到主線劇情
changeScene:../../chapter1/act1/scene1.txt;
```

### **範例 3：結局式結構**
```webgal
; 在 endings/good/true_ending.txt 中
主角:真正的結局;

; 跳轉到其他結局
changeScene:../bad/bad_ending.txt;

; 返回主線
changeScene:../../chapter1/act1/scene1.txt;
```

## ⚡ **性能優化**

### **掃描優化**
- 遞歸掃描限制在 10 層深度
- 自動去重和排序結果
- 緩存掃描結果

### **路徑解析優化**
- 智能路徑匹配
- 優先顯示存在的文件
- 快速失敗機制

## 🔧 **故障排除**

### **問題 1：找不到深層目錄的場景**
**解決方案**：
1. 檢查路徑是否正確
2. 使用完整相對路徑
3. 運行「WebGAL: 掃描資源」命令

### **問題 2：創建深層目錄失敗**
**解決方案**：
1. 確保有寫入權限
2. 使用場景創建嚮導
3. 手動創建父目錄

### **問題 3：路徑解析不準確**
**解決方案**：
1. 使用絕對路徑
2. 檢查目錄結構
3. 重新掃描資源

## 📊 **支援統計**

- ✅ **目錄深度**：最多 10 層
- ✅ **路徑解析**：相對 + 絕對路徑
- ✅ **自動掃描**：遞歸掃描所有子目錄
- ✅ **智能補全**：跨層級場景補全
- ✅ **創建支援**：多層目錄自動創建
- ✅ **跳轉支援**：跨層級場景跳轉

## 🎯 **最佳實踐建議**

1. **目錄命名**：使用有意義的英文名稱
2. **層級深度**：建議不超過 4-5 層
3. **路徑規範**：使用一致的命名規範
4. **文件組織**：按功能或章節組織
5. **定期掃描**：定期運行資源掃描

---

**結論**：WebGAL 擴展完全支援多層資料夾結構，提供強大的場景管理功能，讓您可以靈活組織複雜的遊戲項目！

