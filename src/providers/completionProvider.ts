/**
 * WebGAL 腳本擴展 - 自動補全提供器
 * 
 * 提供命令、參數、資源、角色名、變數、標籤的自動補全
 */

import * as vscode from 'vscode';
import { WEBGAL_COMMANDS, COMMAND_DOCS } from '../utils/constants';
import { AssetScanner } from '../parsers/assetScanner';
import { VariableTracker } from '../parsers/variableTracker';
import { parseLine, extractLabels, extractCharacters } from '../parsers/scriptParser';
import { ScenePathResolver } from '../utils/scenePathUtils';

export class WebGALCompletionProvider implements vscode.CompletionItemProvider {
  private sceneResolver: ScenePathResolver;
  
  constructor(
    private assetScanner: AssetScanner,
    private variableTracker: VariableTracker
  ) {
    this.sceneResolver = ScenePathResolver.getInstance();
  }
  
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList> {
    const line = document.lineAt(position).text;
    const linePrefix = line.substring(0, position.character);
    
    // 在行首，提供命令補全
    if (this.shouldProvideCommandCompletion(linePrefix)) {
      return this.getCommandCompletions();
    }
    
    // 在參數位置，提供參數補全
    if (linePrefix.includes(':') && linePrefix.includes(' -')) {
      const parsed = parseLine(line, position.line);
      if (parsed.command) {
        return this.getParameterCompletions(parsed.command, linePrefix);
      }
    }
    
    // 在冒號後面，根據命令類型提供補全
    const colonMatch = linePrefix.match(/^(\w+):\s*$/);
    if (colonMatch) {
      const command = colonMatch[1];
      return await this.getCommandArgumentCompletions(command, document);
    }
    
    // 在參數值位置，提供資源文件補全
    if (linePrefix.match(/-\w+=$/)) {
      return this.getResourceCompletions(linePrefix);
    }
    
    return [];
  }
  
  /**
   * 判斷是否應該提供命令補全
   */
  private shouldProvideCommandCompletion(linePrefix: string): boolean {
    const trimmed = linePrefix.trim();
    
    // 空行或只有空格
    if (trimmed === '') {
      return true;
    }
    
    // 正在輸入命令，還沒有冒號
    if (!trimmed.includes(':') && !trimmed.includes(' ')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 獲取命令補全列表
   */
  private getCommandCompletions(): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];
    
    for (const command of WEBGAL_COMMANDS) {
      const item = new vscode.CompletionItem(command, vscode.CompletionItemKind.Function);
      const doc = COMMAND_DOCS[command];
      
      if (doc) {
        item.detail = doc.description;
        item.documentation = new vscode.MarkdownString(
          `**${doc.usage}**\n\n${doc.description}\n\n範例：\n\`\`\`\n${doc.examples.join('\n')}\n\`\`\``
        );
        
        // 提供插入文本
        if (doc.parameters.length > 0 && doc.parameters[0].required) {
          item.insertText = new vscode.SnippetString(`${command}:\${1}`);
        } else {
          item.insertText = `${command}:`;
        }
      }
      
      completions.push(item);
    }
    
    return completions;
  }
  
  /**
   * 獲取參數補全列表
   */
  private getParameterCompletions(command: string, linePrefix: string): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];
    const doc = COMMAND_DOCS[command];
    
    if (!doc) {
      return completions;
    }
    
    for (const param of doc.parameters) {
      // 跳過已經在行中的參數
      if (linePrefix.includes(`-${param.name}`)) {
        continue;
      }
      
      const item = new vscode.CompletionItem(`-${param.name}`, vscode.CompletionItemKind.Property);
      item.detail = param.description;
      
      if (param.type === 'boolean') {
        item.insertText = `-${param.name}`;
      } else {
        item.insertText = new vscode.SnippetString(`-${param.name}=\${1}`);
      }
      
      if (param.values) {
        item.documentation = `可選值：${param.values.join(', ')}`;
      }
      
      completions.push(item);
    }
    
    // 通用參數
    if (!linePrefix.includes('-next')) {
      const nextItem = new vscode.CompletionItem('-next', vscode.CompletionItemKind.Property);
      nextItem.detail = '立即執行下一句';
      nextItem.insertText = '-next';
      completions.push(nextItem);
    }
    
    if (!linePrefix.includes('-when')) {
      const whenItem = new vscode.CompletionItem('-when', vscode.CompletionItemKind.Property);
      whenItem.detail = '條件表達式';
      whenItem.insertText = new vscode.SnippetString('-when=${1:condition}');
      completions.push(whenItem);
    }
    
    return completions;
  }
  
  /**
   * 獲取命令參數補全（冒號後面）
   */
  private async getCommandArgumentCompletions(command: string, document: vscode.TextDocument): Promise<vscode.CompletionItem[]> {
    const completions: vscode.CompletionItem[] = [];
    
    // 根據命令類型提供不同的補全
    switch (command) {
      case 'changeBg':
        return this.getAssetCompletions('background');
      
      case 'changeFigure':
        return this.getAssetCompletions('figure');
      
      case 'bgm':
      case 'unlockBgm':
        return this.getAssetCompletions('bgm');
      
      case 'miniAvatar':
        return this.getAssetCompletions('figure');
      
      case 'playVideo':
        return this.getAssetCompletions('video');
      
      case 'changeScene':
      case 'callScene':
        return await this.getSceneCompletions(document);
      
      case 'jumpLabel':
      case 'chooseLabel':
        return this.getLabelCompletions(document);
      
      case 'label':
        // 標籤名通常由用戶自己輸入
        return [];
      
      default:
        return [];
    }
  }
  
  /**
   * 獲取資源文件補全
   */
  private getAssetCompletions(type: 'background' | 'figure' | 'bgm' | 'vocal' | 'video' | 'scene'): vscode.CompletionItem[] {
    const assets = this.assetScanner.getAssets(type);
    const completions: vscode.CompletionItem[] = [];
    
    for (const asset of assets) {
      const item = new vscode.CompletionItem(asset.fileName, vscode.CompletionItemKind.File);
      item.detail = asset.relativePath;
      item.insertText = asset.relativePath;
      completions.push(item);
    }
    
    // 對於某些命令，添加 "none" 選項
    if (type === 'figure' || type === 'bgm') {
      const noneItem = new vscode.CompletionItem('none', vscode.CompletionItemKind.Constant);
      noneItem.detail = '清除/停止';
      completions.unshift(noneItem);
    }
    
    return completions;
  }
  
  /**
   * 獲取標籤補全
   */
  private getLabelCompletions(document: vscode.TextDocument): vscode.CompletionItem[] {
    const content = document.getText();
    const labels = extractLabels(content, document.fileName);
    const completions: vscode.CompletionItem[] = [];
    
    for (const label of labels) {
      const item = new vscode.CompletionItem(label.name, vscode.CompletionItemKind.Reference);
      item.detail = `定義於第 ${label.lineNumber + 1} 行`;
      completions.push(item);
    }
    
    return completions;
  }
  
  /**
   * 獲取角色名補全（在對話中）
   */
  private getCharacterCompletions(document: vscode.TextDocument): vscode.CompletionItem[] {
    const content = document.getText();
    const characters = extractCharacters(content);
    const completions: vscode.CompletionItem[] = [];
    
    for (const character of characters) {
      const item = new vscode.CompletionItem(character, vscode.CompletionItemKind.User);
      item.detail = '角色名';
      item.insertText = `${character}:`;
      completions.push(item);
    }
    
    return completions;
  }
  
  /**
   * 獲取變數補全
   */
  private getVariableCompletions(): vscode.CompletionItem[] {
    const variables = this.variableTracker.getAllVariables();
    const completions: vscode.CompletionItem[] = [];
    
    for (const [name, tracking] of variables) {
      const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
      
      if (tracking.definitions.length > 0) {
        const lastDef = tracking.definitions[tracking.definitions.length - 1];
        item.detail = lastDef.value || '變數';
      }
      
      completions.push(item);
    }
    
    return completions;
  }
  
  /**
   * 獲取場景補全（支持跨目錄）
   */
  private async getSceneCompletions(document: vscode.TextDocument): Promise<vscode.CompletionItem[]> {
    const completions: vscode.CompletionItem[] = [];
    
    try {
      // 獲取所有場景文件
      const scenePaths = await this.sceneResolver.getAllSceneFiles();
      
      for (const scenePath of scenePaths) {
        const item = new vscode.CompletionItem(scenePath.relativePath, vscode.CompletionItemKind.File);
        item.detail = scenePath.exists ? '現有場景' : '建議創建';
        item.documentation = new vscode.MarkdownString(
          `**場景名稱:** ${scenePath.sceneName}\n\n` +
          `**路徑:** ${scenePath.relativePath}\n\n` +
          `**狀態:** ${scenePath.exists ? '✅ 已存在' : '⚠️ 不存在'}\n\n` +
          `**目錄:** ${scenePath.directory}`
        );
        
        // 如果文件不存在，提供創建選項
        if (!scenePath.exists) {
          item.kind = vscode.CompletionItemKind.Snippet;
          item.detail = '創建新場景';
          item.command = {
            title: '創建場景',
            command: 'webgal.createScene',
            arguments: [scenePath]
          };
        }
        
        completions.push(item);
      }
      
      // 添加創建新場景的選項
      const createItem = new vscode.CompletionItem('$(plus) 創建新場景...', vscode.CompletionItemKind.Snippet);
      createItem.detail = '啟動場景創建嚮導';
      createItem.documentation = new vscode.MarkdownString('啟動場景創建嚮導，可以選擇創建新文件、新目錄或從模板創建。');
      createItem.command = {
        title: '創建場景嚮導',
        command: 'webgal.createSceneWizard'
      };
      completions.unshift(createItem);
      
    } catch (error) {
      console.error('Error getting scene completions:', error);
    }
    
    return completions;
  }
  
  /**
   * 獲取資源文件補全（在參數中）
   */
  private getResourceCompletions(linePrefix: string): vscode.CompletionItem[] {
    // 判斷參數名來決定資源類型
    if (linePrefix.includes('-v=')) {
      return this.getAssetCompletions('vocal');
    }
    
    // 可以根據更多參數名擴展
    
    return [];
  }
}

