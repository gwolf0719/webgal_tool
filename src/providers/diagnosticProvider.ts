/**
 * WebGAL 腳本擴展 - 語法診斷提供器
 * 
 * 提供語法錯誤檢查、資源驗證等診斷功能
 */

import * as vscode from 'vscode';
import { WEBGAL_COMMANDS, COMMAND_DOCS } from '../utils/constants';
import { AssetScanner } from '../parsers/assetScanner';
import { VariableTracker } from '../parsers/variableTracker';
import { parseLine, extractLabels, findLabelReferences } from '../parsers/scriptParser';

export class WebGALDiagnosticProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  
  constructor(
    private assetScanner: AssetScanner,
    private variableTracker: VariableTracker
  ) {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('webgal');
  }
  
  /**
   * 診斷文檔
   */
  public async diagnose(document: vscode.TextDocument): Promise<void> {
    const config = vscode.workspace.getConfiguration('webgal');
    const validateResources = config.get<boolean>('validateResources', true);
    
    const diagnostics: vscode.Diagnostic[] = [];
    const content = document.getText();
    const lines = content.split('\n');
    
    // 提取標籤用於驗證
    const labels = extractLabels(content, document.fileName);
    const labelNames = new Set(labels.map(l => l.name));
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parsed = parseLine(line, i);
      
      if (parsed.type === 'command' && parsed.command) {
        // 檢查命令拼寫
        if (!WEBGAL_COMMANDS.includes(parsed.command as any)) {
          diagnostics.push(this.createDiagnostic(
            i,
            0,
            parsed.command.length,
            `未知的命令: ${parsed.command}`,
            vscode.DiagnosticSeverity.Error
          ));
          continue;
        }
        
        // 檢查必需參數
        const missingParams = this.checkRequiredParameters(parsed.command, parsed.content);
        if (missingParams.length > 0) {
          diagnostics.push(this.createDiagnostic(
            i,
            0,
            line.length,
            `缺少必需參數: ${missingParams.join(', ')}`,
            vscode.DiagnosticSeverity.Error
          ));
        }
        
        // 檢查資源文件是否存在
        if (validateResources && parsed.content) {
          const resourceError = this.checkResourceExists(parsed.command, parsed.content);
          if (resourceError) {
            const contentStart = line.indexOf(':') + 1;
            diagnostics.push(this.createDiagnostic(
              i,
              contentStart,
              contentStart + parsed.content.length,
              resourceError,
              vscode.DiagnosticSeverity.Warning
            ));
          }
        }
        
        // 檢查標籤跳轉目標是否存在
        if (parsed.command === 'jumpLabel' && parsed.content) {
          if (!labelNames.has(parsed.content)) {
            const contentStart = line.indexOf(':') + 1;
            diagnostics.push(this.createDiagnostic(
              i,
              contentStart,
              contentStart + parsed.content.length,
              `標籤未定義: ${parsed.content}`,
              vscode.DiagnosticSeverity.Error
            ));
          }
        }
        
        // 檢查 choose 中的標籤
        if (parsed.command === 'choose' && parsed.content) {
          const options = parsed.content.split('|');
          for (const option of options) {
            const parts = option.split(':');
            if (parts.length >= 2) {
              const labelName = parts[1].trim();
              if (labelName && !labelNames.has(labelName)) {
                diagnostics.push(this.createDiagnostic(
                  i,
                  0,
                  line.length,
                  `選擇分支中的標籤未定義: ${labelName}`,
                  vscode.DiagnosticSeverity.Error
                ));
              }
            }
          }
        }
        
        // 檢查未定義的變數
        if (parsed.args.has('when')) {
          const condition = parsed.args.get('when');
          if (condition) {
            const undefinedVars = this.checkVariablesInExpression(condition);
            if (undefinedVars.length > 0) {
              diagnostics.push(this.createDiagnostic(
                i,
                0,
                line.length,
                `條件中使用了未定義的變數: ${undefinedVars.join(', ')}`,
                vscode.DiagnosticSeverity.Warning
              ));
            }
          }
        }
      }
    }
    
    // 檢查未使用的標籤
    for (const label of labels) {
      const references = findLabelReferences(content, label.name);
      if (references.length === 0) {
        diagnostics.push(this.createDiagnostic(
          label.lineNumber,
          0,
          lines[label.lineNumber].length,
          `標籤 "${label.name}" 未被使用`,
          vscode.DiagnosticSeverity.Hint
        ));
      }
    }
    
    this.diagnosticCollection.set(document.uri, diagnostics);
  }
  
  /**
   * 檢查必需參數
   */
  private checkRequiredParameters(command: string, content: string | undefined): string[] {
    const doc = COMMAND_DOCS[command];
    if (!doc) {
      return [];
    }
    
    const missingParams: string[] = [];
    
    for (const param of doc.parameters) {
      if (param.required) {
        // 第一個參數通常是主要內容
        if (param.name === 'filename' || param.name === 'name' || param.name === 'expression') {
          if (!content || content.trim() === '') {
            missingParams.push(param.name);
          }
        }
      }
    }
    
    return missingParams;
  }
  
  /**
   * 檢查資源文件是否存在
   */
  private checkResourceExists(command: string, content: string): string | null {
    // 跳過特殊值
    if (content === 'none' || content === '') {
      return null;
    }
    
    let assetType: 'background' | 'figure' | 'bgm' | 'vocal' | 'video' | 'scene' | undefined;
    
    switch (command) {
      case 'changeBg':
      case 'unlockCg':
        assetType = 'background';
        break;
      case 'changeFigure':
      case 'miniAvatar':
        assetType = 'figure';
        break;
      case 'bgm':
      case 'unlockBgm':
        assetType = 'bgm';
        break;
      case 'playVideo':
        assetType = 'video';
        break;
      case 'changeScene':
      case 'callScene':
        assetType = 'scene';
        break;
      default:
        return null;
    }
    
    if (assetType) {
      const exists = this.assetScanner.assetExists(content, assetType);
      if (!exists) {
        return `資源文件不存在: ${content}`;
      }
    }
    
    return null;
  }
  
  /**
   * 檢查表達式中的變數
   */
  private checkVariablesInExpression(expression: string): string[] {
    const varPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    const undefinedVars: string[] = [];
    let match;
    
    const keywords = new Set(['true', 'false', 'null', 'undefined', 'and', 'or', 'not']);
    
    while ((match = varPattern.exec(expression)) !== null) {
      const varName = match[1];
      
      if (!keywords.has(varName) && isNaN(Number(varName))) {
        if (!this.variableTracker.isVariableDefined(varName)) {
          if (!undefinedVars.includes(varName)) {
            undefinedVars.push(varName);
          }
        }
      }
    }
    
    return undefinedVars;
  }
  
  /**
   * 創建診斷信息
   */
  private createDiagnostic(
    line: number,
    startChar: number,
    endChar: number,
    message: string,
    severity: vscode.DiagnosticSeverity
  ): vscode.Diagnostic {
    const range = new vscode.Range(line, startChar, line, endChar);
    const diagnostic = new vscode.Diagnostic(range, message, severity);
    diagnostic.source = 'WebGAL';
    return diagnostic;
  }
  
  /**
   * 清除診斷信息
   */
  public clear(): void {
    this.diagnosticCollection.clear();
  }
  
  /**
   * 清理資源
   */
  public dispose(): void {
    this.diagnosticCollection.dispose();
  }
}

