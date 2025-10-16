/**
 * WebGAL 腳本擴展 - 腳本移動工具
 * 
 * 提供將選中的腳本內容移動到新檔案的功能
 * 包括檔案創建、內容移動、路徑處理等
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getScenePath } from './fileUtils';

/**
 * 移動腳本到新檔案的主要函數
 */
export async function moveSelectedScriptToNewFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('請先開啟一個 WebGAL 腳本檔案');
    return;
  }

  // 檢查是否為 WebGAL 腳本檔案
  if (editor.document.languageId !== 'webgal') {
    vscode.window.showErrorMessage('此功能只能在 WebGAL 腳本檔案中使用');
    return;
  }

  // 檢查是否有選中的文字
  const selection = editor.selection;
  if (selection.isEmpty) {
    vscode.window.showErrorMessage('請先圈選要移動的腳本內容');
    return;
  }

  // 取得選中的文字內容
  const selectedText = editor.document.getText(selection);
  if (!selectedText.trim()) {
    vscode.window.showErrorMessage('選中的內容為空');
    return;
  }

  try {
    // 彈出輸入框讓使用者輸入目標檔案路徑
    const targetPath = await vscode.window.showInputBox({
      prompt: '輸入目標檔案路徑（相對於 scene 資料夾）',
      placeHolder: '例如: chapter1/act1/new_scene.txt 或 new_scene.txt',
      validateInput: (value) => {
        if (!value) {
          return '檔案路徑不能為空';
        }
        
        if (!value.endsWith('.txt')) {
          return '檔案必須以 .txt 結尾';
        }

        // 檢查路徑格式
        if (value.includes('..') || value.startsWith('/') || value.startsWith('\\')) {
          return '請使用相對於 scene 資料夾的路徑';
        }

        return null;
      }
    });

    if (!targetPath) {
      return; // 使用者取消
    }

    // 確認操作
    const confirmResult = await vscode.window.showWarningMessage(
      `確定要將選中的腳本移動到 "${targetPath}" 嗎？\n\n選中的內容將被刪除，並在原位置插入跳轉指令。`,
      '確定',
      '取消'
    );

    if (confirmResult !== '確定') {
      return;
    }

    // 執行移動操作
    const success = await performScriptMove(editor, selectedText, targetPath, selection);
    
    if (success) {
      vscode.window.showInformationMessage(`腳本已成功移動到 ${targetPath}`);
    }

  } catch (error) {
    console.error('Error moving script:', error);
    vscode.window.showErrorMessage(`移動腳本時發生錯誤: ${error}`);
  }
}

/**
 * 執行腳本移動操作
 */
async function performScriptMove(
  editor: vscode.TextEditor,
  selectedText: string,
  targetPath: string,
  selection: vscode.Selection
): Promise<boolean> {
  const scenePath = getScenePath();
  if (!scenePath) {
    vscode.window.showErrorMessage('無法取得場景目錄路徑');
    return false;
  }

  try {
    // 建立或追加到目標檔案
    const targetFilePath = await createOrAppendToFile(scenePath, targetPath, selectedText);
    if (!targetFilePath) {
      return false;
    }

    // 計算相對路徑用於 changePage 指令
    const changePageCommand = generateChangePageCommand(editor.document.fileName, targetFilePath);

    // 編輯原檔案：刪除選中內容並插入 changePage 指令
    await editor.edit((editBuilder) => {
      editBuilder.replace(selection, changePageCommand);
    });

    return true;
  } catch (error) {
    console.error('Error performing script move:', error);
    vscode.window.showErrorMessage(`執行移動操作時發生錯誤: ${error}`);
    return false;
  }
}

/**
 * 建立或追加內容到檔案
 */
async function createOrAppendToFile(
  scenePath: string,
  targetPath: string,
  content: string
): Promise<string | null> {
  try {
    const fullPath = path.resolve(scenePath, targetPath);
    const dirPath = path.dirname(fullPath);

    // 確保目錄存在
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // 檢查檔案是否存在
    const fileExists = fs.existsSync(fullPath);
    
    if (fileExists) {
      // 檔案已存在，追加內容
      fs.appendFileSync(fullPath, '\n' + content, 'utf-8');
      vscode.window.showInformationMessage(`內容已追加到現有檔案: ${targetPath}`);
    } else {
      // 檔案不存在，建立新檔案
      const fileContent = generateSceneFileTemplate(targetPath, content);
      fs.writeFileSync(fullPath, fileContent, 'utf-8');
      vscode.window.showInformationMessage(`已建立新檔案: ${targetPath}`);
    }

    return fullPath;
  } catch (error) {
    console.error('Error creating/appending file:', error);
    vscode.window.showErrorMessage(`建立檔案時發生錯誤: ${error}`);
    return null;
  }
}

/**
 * 生成 changePage 指令
 */
function generateChangePageCommand(currentFilePath: string, targetFilePath: string): string {
  // 計算相對路徑
  const currentDir = path.dirname(currentFilePath);
  const relativePath = path.relative(currentDir, targetFilePath);
  
  // 轉換為 WebGAL 格式的路徑（使用正斜線）
  const webgalPath = relativePath.replace(/\\/g, '/');
  
  // 移除 .txt 副檔名（WebGAL 不需要）
  const pathWithoutExt = webgalPath.replace(/\.txt$/, '');
  
  return `changePage:${pathWithoutExt};\n`;
}

/**
 * 生成場景檔案模板
 */
function generateSceneFileTemplate(fileName: string, content: string): string {
  const sceneName = path.basename(fileName, '.txt');
  const now = new Date().toLocaleDateString('zh-TW');
  
  return `;========================================
; 檔案名稱: ${fileName}
; 描述: ${sceneName} 場景
; 建立日期: ${now}
; 說明: 從其他檔案移動過來的腳本內容
;========================================

${content}

;========================================
; 檔案結束
;========================================
`;
}
