/**
 * WebGAL 腳本擴展 - 引用查找提供器
 * 
 * 查找標籤、變數、場景的所有引用位置
 */

import * as vscode from 'vscode';
import { parseLine, findLabelReferences } from '../parsers/scriptParser';
import { VariableTracker } from '../parsers/variableTracker';

export class WebGALReferenceProvider implements vscode.ReferenceProvider {
  constructor(private variableTracker: VariableTracker) {}
  
  async provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.ReferenceContext,
    token: vscode.CancellationToken
  ): Promise<vscode.Location[] | null> {
    const line = document.lineAt(position).text;
    const wordRange = document.getWordRangeAtPosition(position);
    
    if (!wordRange) {
      return null;
    }
    
    const word = document.getText(wordRange);
    
    // 檢查是否為標籤
    if (line.includes('label:')) {
      return this.findLabelReferences(word, document, context.includeDeclaration);
    }
    
    // 檢查是否為變數
    const tracking = this.variableTracker.getVariable(word);
    if (tracking) {
      return this.findVariableReferences(word, context.includeDeclaration);
    }
    
    return null;
  }
  
  /**
   * 查找標籤的所有引用
   */
  private findLabelReferences(
    labelName: string,
    document: vscode.TextDocument,
    includeDeclaration: boolean
  ): vscode.Location[] {
    const content = document.getText();
    const locations: vscode.Location[] = [];
    
    // 查找 jumpLabel 引用
    const references = findLabelReferences(content, labelName);
    for (const lineNumber of references) {
      const position = new vscode.Position(lineNumber, 0);
      locations.push(new vscode.Location(document.uri, position));
    }
    
    // 包含定義
    if (includeDeclaration) {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const parsed = parseLine(lines[i], i);
        if (parsed.type === 'command' && parsed.command === 'label' && parsed.content === labelName) {
          const position = new vscode.Position(i, 0);
          locations.push(new vscode.Location(document.uri, position));
        }
      }
    }
    
    return locations;
  }
  
  /**
   * 查找變數的所有引用
   */
  private findVariableReferences(
    varName: string,
    includeDeclaration: boolean
  ): vscode.Location[] {
    const tracking = this.variableTracker.getVariable(varName);
    if (!tracking) {
      return [];
    }
    
    const locations: vscode.Location[] = [];
    
    // 包含定義
    if (includeDeclaration) {
      for (const def of tracking.definitions) {
        const uri = vscode.Uri.file(def.filePath);
        const position = new vscode.Position(def.lineNumber, 0);
        locations.push(new vscode.Location(uri, position));
      }
    }
    
    // 所有使用
    for (const usage of tracking.usages) {
      const uri = vscode.Uri.file(usage.filePath);
      const position = new vscode.Position(usage.lineNumber, 0);
      locations.push(new vscode.Location(uri, position));
    }
    
    return locations;
  }
}

