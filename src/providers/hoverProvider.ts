/**
 * WebGAL 腳本擴展 - Hover 提示提供器
 * 
 * 提供命令說明、資源預覽、變數信息等懸停提示
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { COMMAND_DOCS } from '../utils/constants';
import { AssetScanner } from '../parsers/assetScanner';
import { VariableTracker } from '../parsers/variableTracker';
import { parseLine } from '../parsers/scriptParser';
import { IMAGE_EXTENSIONS, AUDIO_EXTENSIONS } from '../utils/constants';

export class WebGALHoverProvider implements vscode.HoverProvider {
  constructor(
    private assetScanner: AssetScanner,
    private variableTracker: VariableTracker
  ) {}
  
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    const line = document.lineAt(position).text;
    const parsed = parseLine(line, position.line);
    
    // 懸停在命令上
    if (parsed.type === 'command' && parsed.command) {
      const commandHover = this.getCommandHover(parsed.command, position, line);
      if (commandHover) {
        return commandHover;
      }
    }
    
    // 懸停在資源文件名上
    const resourceHover = await this.getResourceHover(position, line);
    if (resourceHover) {
      return resourceHover;
    }
    
    // 懸停在變數上
    const variableHover = this.getVariableHover(position, line);
    if (variableHover) {
      return variableHover;
    }
    
    return null;
  }
  
  /**
   * 獲取命令的懸停信息
   */
  private getCommandHover(command: string, position: vscode.Position, line: string): vscode.Hover | null {
    const doc = COMMAND_DOCS[command];
    if (!doc) {
      return null;
    }
    
    // 檢查鼠標是否在命令名上
    const commandIndex = line.indexOf(command);
    if (commandIndex === -1 || position.character < commandIndex || position.character > commandIndex + command.length) {
      return null;
    }
    
    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(`### ${doc.name}\n\n`);
    markdown.appendMarkdown(`${doc.description}\n\n`);
    markdown.appendMarkdown(`**用法：** \`${doc.usage}\`\n\n`);
    
    if (doc.parameters.length > 0) {
      markdown.appendMarkdown(`**參數：**\n\n`);
      for (const param of doc.parameters) {
        const required = param.required ? '**必需**' : '可選';
        markdown.appendMarkdown(`- \`${param.name}\` (${required}): ${param.description}\n`);
      }
      markdown.appendMarkdown('\n');
    }
    
    markdown.appendMarkdown(`**範例：**\n\n\`\`\`webgal\n${doc.examples.join('\n')}\n\`\`\`\n`);
    
    return new vscode.Hover(markdown);
  }
  
  /**
   * 獲取資源文件的懸停信息
   */
  private async getResourceHover(position: vscode.Position, line: string): Promise<vscode.Hover | null> {
    const config = vscode.workspace.getConfiguration('webgal');
    const enablePreview = config.get<boolean>('enablePreview', true);
    
    if (!enablePreview) {
      return null;
    }
    
    // 提取可能的文件名
    const fileNameMatch = line.match(/([a-zA-Z0-9_\-\/]+\.(jpg|jpeg|png|webp|gif|mp3|ogg|wav|mp4|webm|txt))/i);
    if (!fileNameMatch) {
      return null;
    }
    
    const fileName = fileNameMatch[1];
    const asset = this.assetScanner.findAsset(fileName);
    
    if (!asset) {
      return null;
    }
    
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    
    // 圖片預覽
    const ext = path.extname(asset.fileName).toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext)) {
      markdown.appendMarkdown(`### 圖片預覽\n\n`);
      markdown.appendMarkdown(`![${asset.fileName}](${vscode.Uri.file(asset.fullPath)})\n\n`);
      markdown.appendMarkdown(`**文件：** ${asset.fileName}\n\n`);
      markdown.appendMarkdown(`**路徑：** ${asset.relativePath}\n`);
    }
    // 音頻信息
    else if (AUDIO_EXTENSIONS.includes(ext)) {
      markdown.appendMarkdown(`### 音頻文件\n\n`);
      markdown.appendMarkdown(`**文件：** ${asset.fileName}\n\n`);
      markdown.appendMarkdown(`**路徑：** ${asset.relativePath}\n\n`);
      markdown.appendMarkdown(`**類型：** ${asset.type}\n`);
    }
    // 場景文件
    else if (ext === '.txt' && asset.type === 'scene') {
      markdown.appendMarkdown(`### 場景文件\n\n`);
      markdown.appendMarkdown(`**文件：** ${asset.fileName}\n\n`);
      markdown.appendMarkdown(`**路徑：** ${asset.relativePath}\n\n`);
      markdown.appendMarkdown(`[打開文件](${vscode.Uri.file(asset.fullPath)})\n`);
    }
    
    return new vscode.Hover(markdown);
  }
  
  /**
   * 獲取變數的懸停信息
   */
  private getVariableHover(position: vscode.Position, line: string): vscode.Hover | null {
    // 提取可能的變數名
    const varPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    let match;
    
    while ((match = varPattern.exec(line)) !== null) {
      const varName = match[1];
      const startPos = match.index;
      const endPos = startPos + varName.length;
      
      if (position.character >= startPos && position.character <= endPos) {
        const tracking = this.variableTracker.getVariable(varName);
        
        if (tracking && tracking.definitions.length > 0) {
          const markdown = new vscode.MarkdownString();
          markdown.appendMarkdown(`### 變數：${varName}\n\n`);
          
          markdown.appendMarkdown(`**定義位置：**\n\n`);
          for (const def of tracking.definitions) {
            const relativePath = path.basename(def.filePath);
            markdown.appendMarkdown(`- ${relativePath}:${def.lineNumber + 1}`);
            if (def.value) {
              markdown.appendMarkdown(` = \`${def.value}\``);
            }
            markdown.appendMarkdown('\n');
          }
          
          if (tracking.usages.length > 0) {
            markdown.appendMarkdown(`\n**使用次數：** ${tracking.usages.length}\n`);
          }
          
          return new vscode.Hover(markdown);
        }
        
        // 未定義的變數
        if (tracking && tracking.definitions.length === 0) {
          const markdown = new vscode.MarkdownString();
          markdown.appendMarkdown(`### ⚠️ 變數：${varName}\n\n`);
          markdown.appendMarkdown(`**警告：** 此變數尚未定義\n`);
          return new vscode.Hover(markdown);
        }
      }
    }
    
    return null;
  }
}

