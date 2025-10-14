/**
 * WebGAL 腳本擴展 - 重命名提供器
 * 
 * 支持重命名標籤和變數
 */

import * as vscode from 'vscode';
import { parseLine, findLabelReferences, extractLabels } from '../parsers/scriptParser';
import { VariableTracker } from '../parsers/variableTracker';

export class WebGALRenameProvider implements vscode.RenameProvider {
  constructor(private variableTracker: VariableTracker) {}
  
  async provideRenameEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string,
    token: vscode.CancellationToken
  ): Promise<vscode.WorkspaceEdit | null> {
    const line = document.lineAt(position).text;
    const wordRange = document.getWordRangeAtPosition(position);
    
    if (!wordRange) {
      return null;
    }
    
    const word = document.getText(wordRange);
    
    // 檢查是否為標籤
    if (line.includes('label:')) {
      return this.renameLabel(word, newName, document);
    }
    
    // 檢查是否為變數
    const tracking = this.variableTracker.getVariable(word);
    if (tracking) {
      return this.renameVariable(word, newName);
    }
    
    return null;
  }
  
  async prepareRename(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Range | { range: vscode.Range; placeholder: string } | null> {
    const line = document.lineAt(position).text;
    const wordRange = document.getWordRangeAtPosition(position);
    
    if (!wordRange) {
      return null;
    }
    
    const word = document.getText(wordRange);
    
    // 檢查是否可以重命名
    if (line.includes('label:') || this.variableTracker.getVariable(word)) {
      return {
        range: wordRange,
        placeholder: word,
      };
    }
    
    return null;
  }
  
  /**
   * 重命名標籤
   */
  private renameLabel(
    oldName: string,
    newName: string,
    document: vscode.TextDocument
  ): vscode.WorkspaceEdit {
    const edit = new vscode.WorkspaceEdit();
    const content = document.getText();
    const lines = content.split('\n');
    
    // 查找標籤定義
    const labels = extractLabels(content, document.fileName);
    for (const label of labels) {
      if (label.name === oldName) {
        const line = lines[label.lineNumber];
        const start = line.indexOf(oldName);
        if (start !== -1) {
          const range = new vscode.Range(
            label.lineNumber,
            start,
            label.lineNumber,
            start + oldName.length
          );
          edit.replace(document.uri, range, newName);
        }
      }
    }
    
    // 查找標籤引用
    const references = findLabelReferences(content, oldName);
    for (const lineNumber of references) {
      const line = lines[lineNumber];
      const start = line.indexOf(oldName);
      if (start !== -1) {
        const range = new vscode.Range(
          lineNumber,
          start,
          lineNumber,
          start + oldName.length
        );
        edit.replace(document.uri, range, newName);
      }
    }
    
    return edit;
  }
  
  /**
   * 重命名變數
   */
  private renameVariable(
    oldName: string,
    newName: string
  ): vscode.WorkspaceEdit {
    const tracking = this.variableTracker.getVariable(oldName);
    if (!tracking) {
      return new vscode.WorkspaceEdit();
    }
    
    const edit = new vscode.WorkspaceEdit();
    
    // 重命名所有定義
    for (const def of tracking.definitions) {
      const uri = vscode.Uri.file(def.filePath);
      const document = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === def.filePath);
      
      if (document) {
        const line = document.lineAt(def.lineNumber).text;
        const start = line.indexOf(oldName);
        if (start !== -1) {
          const range = new vscode.Range(
            def.lineNumber,
            start,
            def.lineNumber,
            start + oldName.length
          );
          edit.replace(uri, range, newName);
        }
      }
    }
    
    // 重命名所有使用
    for (const usage of tracking.usages) {
      const uri = vscode.Uri.file(usage.filePath);
      const document = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === usage.filePath);
      
      if (document) {
        const line = document.lineAt(usage.lineNumber).text;
        
        // 查找變數名的所有出現（可能有多個）
        const varPattern = new RegExp(`\\b${oldName}\\b`, 'g');
        let match;
        
        while ((match = varPattern.exec(line)) !== null) {
          const range = new vscode.Range(
            usage.lineNumber,
            match.index,
            usage.lineNumber,
            match.index + oldName.length
          );
          edit.replace(uri, range, newName);
        }
      }
    }
    
    return edit;
  }
}

