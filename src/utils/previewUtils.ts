/**
 * WebGAL 腳本擴展 - 預覽工具
 * 
 * 提供資源預覽相關的輔助函數
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { IMAGE_EXTENSIONS, AUDIO_EXTENSIONS } from './constants';

/**
 * 檢查文件是否為圖片
 */
export function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * 檢查文件是否為音頻
 */
export function isAudioFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return AUDIO_EXTENSIONS.includes(ext);
}

/**
 * 獲取文件大小（人類可讀格式）
 */
export function getFileSize(filePath: string): string {
  try {
    const stats = fs.statSync(filePath);
    const bytes = stats.size;
    
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  } catch {
    return 'Unknown';
  }
}

/**
 * 創建資源預覽的 Markdown
 */
export function createAssetPreviewMarkdown(
  assetPath: string,
  assetName: string,
  assetType: string
): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString();
  markdown.isTrusted = true;
  
  if (isImageFile(assetPath)) {
    markdown.appendMarkdown(`### 🖼️ 圖片預覽\n\n`);
    markdown.appendMarkdown(`![${assetName}](${vscode.Uri.file(assetPath)})\n\n`);
  } else if (isAudioFile(assetPath)) {
    markdown.appendMarkdown(`### 🎵 音頻文件\n\n`);
  } else {
    markdown.appendMarkdown(`### 📄 ${assetType}\n\n`);
  }
  
  markdown.appendMarkdown(`**文件名：** ${assetName}\n\n`);
  markdown.appendMarkdown(`**大小：** ${getFileSize(assetPath)}\n\n`);
  markdown.appendMarkdown(`**路徑：** \`${assetPath}\`\n`);
  
  return markdown;
}

/**
 * 在系統文件管理器中顯示文件
 */
export async function revealFileInFileManager(filePath: string): Promise<void> {
  try {
    await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(filePath));
  } catch (error) {
    vscode.window.showErrorMessage(`無法打開文件位置: ${error}`);
  }
}

/**
 * 打開外部程序預覽文件
 */
export async function openFileWithDefaultApp(filePath: string): Promise<void> {
  try {
    await vscode.env.openExternal(vscode.Uri.file(filePath));
  } catch (error) {
    vscode.window.showErrorMessage(`無法打開文件: ${error}`);
  }
}

