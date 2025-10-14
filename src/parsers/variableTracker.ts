/**
 * WebGAL 腳本擴展 - 變數追蹤器
 * 
 * 追蹤所有場景中的變數定義和使用
 */

import * as vscode from 'vscode';
import { extractVariables, VariableInfo } from './scriptParser';
import { getScenePath, listFilesRecursive, readFileContent } from '../utils/fileUtils';
import { SCENE_EXTENSION } from '../utils/constants';

/**
 * 變數使用位置
 */
export interface VariableUsage {
  filePath: string;
  lineNumber: number;
  context: string;
  type: 'read' | 'write';
}

/**
 * 變數追蹤信息
 */
export interface VariableTracking {
  name: string;
  definitions: VariableInfo[];
  usages: VariableUsage[];
}

/**
 * 變數追蹤器類
 */
export class VariableTracker {
  private variables: Map<string, VariableTracking> = new Map();
  private watcher?: vscode.FileSystemWatcher;
  
  /**
   * 掃描所有變數
   */
  public async scanAll(): Promise<void> {
    this.variables.clear();
    
    const scenePath = getScenePath();
    if (!scenePath) {
      return;
    }
    
    const sceneFiles = listFilesRecursive(scenePath, [SCENE_EXTENSION]);
    
    for (const filePath of sceneFiles) {
      await this.scanFile(filePath);
    }
  }
  
  /**
   * 掃描單個文件
   */
  public async scanFile(filePath: string): Promise<void> {
    const content = readFileContent(filePath);
    if (!content) {
      return;
    }
    
    // 提取變數定義
    const variables = extractVariables(content, filePath);
    
    for (const variable of variables) {
      this.addVariableDefinition(variable);
    }
    
    // 查找變數使用
    this.findVariableUsages(content, filePath);
  }
  
  /**
   * 添加變數定義
   */
  private addVariableDefinition(variable: VariableInfo): void {
    let tracking = this.variables.get(variable.name);
    
    if (!tracking) {
      tracking = {
        name: variable.name,
        definitions: [],
        usages: [],
      };
      this.variables.set(variable.name, tracking);
    }
    
    tracking.definitions.push(variable);
  }
  
  /**
   * 查找變數使用
   */
  private findVariableUsages(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 在 -when 條件中查找變數
      const whenMatch = line.match(/-when=([^;-]+)/);
      if (whenMatch) {
        const condition = whenMatch[1];
        this.extractVariablesFromExpression(condition, filePath, i, 'read', line);
      }
      
      // 在 setVar 中查找變數（右側的變數是讀取）
      const setVarMatch = line.match(/setVar:([^=]+)=(.+?)(?:\s|;|$)/);
      if (setVarMatch) {
        const varName = setVarMatch[1].trim();
        const expression = setVarMatch[2].trim();
        
        // 變數賦值（寫入）
        this.addVariableUsage(varName, filePath, i, 'write', line);
        
        // 表達式中的變數（讀取）
        this.extractVariablesFromExpression(expression, filePath, i, 'read', line);
      }
    }
  }
  
  /**
   * 從表達式中提取變數
   */
  private extractVariablesFromExpression(expression: string, filePath: string, lineNumber: number, type: 'read' | 'write', context: string): void {
    // 簡單的變數名匹配（字母開頭，包含字母數字下劃線）
    const varPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    let match;
    
    const keywords = new Set(['true', 'false', 'null', 'undefined', 'and', 'or', 'not']);
    
    while ((match = varPattern.exec(expression)) !== null) {
      const varName = match[1];
      
      // 排除關鍵字和數字
      if (!keywords.has(varName) && isNaN(Number(varName))) {
        this.addVariableUsage(varName, filePath, lineNumber, type, context);
      }
    }
  }
  
  /**
   * 添加變數使用記錄
   */
  private addVariableUsage(varName: string, filePath: string, lineNumber: number, type: 'read' | 'write', context: string): void {
    let tracking = this.variables.get(varName);
    
    if (!tracking) {
      tracking = {
        name: varName,
        definitions: [],
        usages: [],
      };
      this.variables.set(varName, tracking);
    }
    
    tracking.usages.push({
      filePath,
      lineNumber,
      context,
      type,
    });
  }
  
  /**
   * 獲取所有變數
   */
  public getAllVariables(): Map<string, VariableTracking> {
    return this.variables;
  }
  
  /**
   * 獲取變數信息
   */
  public getVariable(name: string): VariableTracking | undefined {
    return this.variables.get(name);
  }
  
  /**
   * 檢查變數是否已定義
   */
  public isVariableDefined(name: string): boolean {
    const tracking = this.variables.get(name);
    return tracking !== undefined && tracking.definitions.length > 0;
  }
  
  /**
   * 獲取未定義的變數
   */
  public getUndefinedVariables(): string[] {
    const undefined: string[] = [];
    
    for (const [name, tracking] of this.variables) {
      if (tracking.definitions.length === 0 && tracking.usages.length > 0) {
        undefined.push(name);
      }
    }
    
    return undefined;
  }
  
  /**
   * 啟動文件監視器
   */
  public startWatching(): void {
    this.stopWatching();
    
    const scenePath = getScenePath();
    if (!scenePath) {
      return;
    }
    
    const pattern = new vscode.RelativePattern(scenePath, '**/*.txt');
    this.watcher = vscode.workspace.createFileSystemWatcher(pattern);
    
    this.watcher.onDidCreate(() => this.scanAll());
    this.watcher.onDidDelete(() => this.scanAll());
    this.watcher.onDidChange((uri) => this.scanFile(uri.fsPath));
  }
  
  /**
   * 停止文件監視器
   */
  public stopWatching(): void {
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = undefined;
    }
  }
  
  /**
   * 清理資源
   */
  public dispose(): void {
    this.stopWatching();
    this.variables.clear();
  }
}

