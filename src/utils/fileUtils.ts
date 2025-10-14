/**
 * WebGAL 腳本擴展 - 文件工具
 * 
 * 提供文件路徑解析、資源查找等工具函數
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 獲取 WebGAL 遊戲根目錄
 */
export function getGamePath(): string | undefined {
  const config = vscode.workspace.getConfiguration('webgal');
  const gamePath = config.get<string>('gamePath', 'game');
  
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return undefined;
  }
  
  const rootPath = workspaceFolders[0].uri.fsPath;
  return path.join(rootPath, gamePath);
}

/**
 * 獲取場景目錄
 */
export function getScenePath(): string | undefined {
  const gamePath = getGamePath();
  if (!gamePath) {
    return undefined;
  }
  return path.join(gamePath, 'scene');
}

/**
 * 獲取資源目錄
 */
export function getAssetPath(type: 'background' | 'figure' | 'bgm' | 'vocal' | 'video' | 'tex' | 'animation' | 'scene'): string | undefined {
  const gamePath = getGamePath();
  if (!gamePath) {
    return undefined;
  }
  
  // scene 的路徑特殊處理
  if (type === 'scene') {
    return path.join(gamePath, type);
  }
  
  return path.join(gamePath, type);
}

/**
 * 檢查文件是否存在
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * 讀取文件內容
 */
export function readFileContent(filePath: string): string | undefined {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return undefined;
  }
}

/**
 * 列出目錄中的所有文件
 */
export function listFiles(dirPath: string, extensions?: string[]): string[] {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    
    const files = fs.readdirSync(dirPath);
    return files.filter(file => {
      if (extensions) {
        const ext = path.extname(file).toLowerCase();
        return extensions.includes(ext);
      }
      return true;
    });
  } catch {
    return [];
  }
}

/**
 * 遞歸列出目錄中的所有文件
 */
export function listFilesRecursive(dirPath: string, extensions?: string[]): string[] {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    
    let results: string[] = [];
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        results = results.concat(listFilesRecursive(fullPath, extensions));
      } else {
        if (extensions) {
          const ext = path.extname(file).toLowerCase();
          if (extensions.includes(ext)) {
            results.push(fullPath);
          }
        } else {
          results.push(fullPath);
        }
      }
    }
    
    return results;
  } catch {
    return [];
  }
}

/**
 * 解析場景文件路徑
 * 支持相對路徑和絕對路徑
 */
export function resolveScenePath(sceneName: string): string | undefined {
  const scenePath = getScenePath();
  if (!scenePath) {
    return undefined;
  }
  
  // 如果已經是 .txt 結尾，直接使用
  const sceneFile = sceneName.endsWith('.txt') ? sceneName : `${sceneName}.txt`;
  
  // 嘗試多種路徑
  const possiblePaths = [
    path.join(scenePath, sceneFile),
    path.join(scenePath, sceneName, sceneFile),
  ];
  
  for (const p of possiblePaths) {
    if (fileExists(p)) {
      return p;
    }
  }
  
  return undefined;
}

/**
 * 解析資源文件路徑
 */
export function resolveAssetPath(fileName: string, assetType: 'background' | 'figure' | 'bgm' | 'vocal' | 'video' | 'tex' | 'animation' | 'scene'): string | undefined {
  const assetPath = getAssetPath(assetType);
  if (!assetPath) {
    return undefined;
  }
  
  const fullPath = path.join(assetPath, fileName);
  if (fileExists(fullPath)) {
    return fullPath;
  }
  
  return undefined;
}

/**
 * 從文件路徑獲取相對於遊戲目錄的路徑
 */
export function getRelativeGamePath(filePath: string): string | undefined {
  const gamePath = getGamePath();
  if (!gamePath) {
    return undefined;
  }
  
  if (filePath.startsWith(gamePath)) {
    return path.relative(gamePath, filePath);
  }
  
  return undefined;
}

/**
 * 判斷文件是否為場景文件
 */
export function isSceneFile(filePath: string): boolean {
  const scenePath = getScenePath();
  if (!scenePath) {
    return false;
  }
  
  return filePath.startsWith(scenePath) && filePath.endsWith('.txt');
}

/**
 * 獲取文件的 URI
 */
export function getFileUri(filePath: string): vscode.Uri {
  return vscode.Uri.file(filePath);
}

/**
 * 在編輯器中打開文件
 */
export async function openFile(filePath: string, line?: number): Promise<void> {
  const uri = getFileUri(filePath);
  const document = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(document);
  
  if (line !== undefined && line >= 0) {
    const position = new vscode.Position(line, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
  }
}

