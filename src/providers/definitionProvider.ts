/**
 * WebGAL 腳本擴展 - 定義跳轉提供器
 * 
 * 提供標籤、場景、變數的定義跳轉功能
 */

import * as vscode from 'vscode';
import { extractLabels } from '../parsers/scriptParser';
import { VariableTracker } from '../parsers/variableTracker';
import { AssetScanner } from '../parsers/assetScanner';
import { resolveScenePath } from '../utils/fileUtils';

export class WebGALDefinitionProvider implements vscode.DefinitionProvider {
  constructor(
    private assetScanner: AssetScanner,
    private variableTracker: VariableTracker
  ) {}
  
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Location | vscode.Location[] | null> {
    const line = document.lineAt(position).text;
    const wordRange = document.getWordRangeAtPosition(position);
    
    if (!wordRange) {
      return null;
    }
    
    const word = document.getText(wordRange);
    
    // 檢查是否為 jumpLabel 或 choose 中的標籤
    if (line.includes('jumpLabel:') || line.includes('choose:')) {
      return this.findLabelDefinition(word, document);
    }
    
    // 檢查是否為場景引用
    if (line.includes('changeScene:') || line.includes('callScene:')) {
      return this.findSceneDefinition(word);
    }
    
    // 檢查是否為變數
    if (line.includes('-when=') || line.includes('setVar:')) {
      return this.findVariableDefinition(word);
    }
    
    return null;
  }
  
  /**
   * 查找標籤定義
   */
  private findLabelDefinition(labelName: string, document: vscode.TextDocument): vscode.Location | null {
    const content = document.getText();
    const labels = extractLabels(content, document.fileName);
    
    const label = labels.find(l => l.name === labelName);
    if (label) {
      const position = new vscode.Position(label.lineNumber, 0);
      return new vscode.Location(document.uri, position);
    }
    
    return null;
  }
  
  /**
   * 查找場景文件定義
   */
  private findSceneDefinition(sceneName: string): vscode.Location | null {
    // 移除可能的 .txt 擴展名
    const baseName = sceneName.replace(/\.txt$/, '');
    
    // 嘗試使用資源掃描器查找
    const asset = this.assetScanner.findAsset(`${baseName}.txt`, 'scene');
    if (asset) {
      const uri = vscode.Uri.file(asset.fullPath);
      return new vscode.Location(uri, new vscode.Position(0, 0));
    }
    
    // 嘗試解析路徑
    const scenePath = resolveScenePath(baseName);
    if (scenePath) {
      const uri = vscode.Uri.file(scenePath);
      return new vscode.Location(uri, new vscode.Position(0, 0));
    }
    
    return null;
  }
  
  /**
   * 查找變數定義
   */
  private findVariableDefinition(varName: string): vscode.Location | vscode.Location[] | null {
    const tracking = this.variableTracker.getVariable(varName);
    
    if (!tracking || tracking.definitions.length === 0) {
      return null;
    }
    
    const locations: vscode.Location[] = [];
    
    for (const def of tracking.definitions) {
      const uri = vscode.Uri.file(def.filePath);
      const position = new vscode.Position(def.lineNumber, 0);
      locations.push(new vscode.Location(uri, position));
    }
    
    return locations.length === 1 ? locations[0] : locations;
  }
}

