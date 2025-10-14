/**
 * WebGAL 腳本擴展 - 定義跳轉提供器
 * 
 * 提供標籤、場景、變數的定義跳轉功能，支持跨目錄場景查找
 */

import * as vscode from 'vscode';
import { extractLabels } from '../parsers/scriptParser';
import { VariableTracker } from '../parsers/variableTracker';
import { AssetScanner } from '../parsers/assetScanner';
import { resolveScenePath } from '../utils/fileUtils';
import { ScenePathResolver } from '../utils/scenePathUtils';

export class WebGALDefinitionProvider implements vscode.DefinitionProvider {
  private sceneResolver: ScenePathResolver;
  
  constructor(
    private assetScanner: AssetScanner,
    private variableTracker: VariableTracker
  ) {
    this.sceneResolver = ScenePathResolver.getInstance();
  }
  
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
    
    // 檢查是否為場景引用（支持跨目錄）
    if (line.includes('changeScene:') || line.includes('callScene:')) {
      return await this.findSceneDefinition(word, document);
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
   * 查找場景文件定義（支持跨目錄）
   */
  private async findSceneDefinition(sceneName: string, currentDocument?: vscode.TextDocument): Promise<vscode.Location | vscode.Location[] | null> {
    // 移除可能的 .txt 擴展名
    const baseName = sceneName.replace(/\.txt$/, '');
    
    // 使用增強的路徑解析器
    const currentFilePath = currentDocument?.fileName;
    const scenePaths = await this.sceneResolver.resolveScenePath(baseName, currentFilePath);
    
    if (scenePaths.length === 0) {
      // 回退到原有方法
      const asset = this.assetScanner.findAsset(`${baseName}.txt`, 'scene');
      if (asset) {
        const uri = vscode.Uri.file(asset.fullPath);
        return new vscode.Location(uri, new vscode.Position(0, 0));
      }
      
      const scenePath = resolveScenePath(baseName);
      if (scenePath) {
        const uri = vscode.Uri.file(scenePath);
        return new vscode.Location(uri, new vscode.Position(0, 0));
      }
      
      return null;
    }
    
    // 如果找到多個匹配項，顯示選擇器
    if (scenePaths.length > 1) {
      const locations = scenePaths.map(pathInfo => {
        const uri = vscode.Uri.file(pathInfo.fullPath);
        return new vscode.Location(uri, new vscode.Position(0, 0));
      });
      
      // 如果有現有的文件，優先顯示
      const existingPaths = scenePaths.filter(p => p.exists);
      if (existingPaths.length > 0) {
        return existingPaths.map(pathInfo => {
          const uri = vscode.Uri.file(pathInfo.fullPath);
          return new vscode.Location(uri, new vscode.Position(0, 0));
        });
      }
      
      return locations;
    }
    
    // 單一結果
    const scenePath = scenePaths[0];
    const uri = vscode.Uri.file(scenePath.fullPath);
    
    // 如果文件不存在，提供創建選項
    if (!scenePath.exists) {
      const shouldCreate = await vscode.window.showInformationMessage(
        `場景文件 "${sceneName}" 不存在。\n路徑: ${scenePath.relativePath}`,
        '創建文件',
        '取消'
      );
      
      if (shouldCreate === '創建文件') {
        const wizard = new (await import('../utils/scenePathUtils')).SceneCreationWizard();
        const createdUri = await wizard.startWizard();
        if (createdUri) {
          return new vscode.Location(createdUri, new vscode.Position(0, 0));
        }
      }
    }
    
    return new vscode.Location(uri, new vscode.Position(0, 0));
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

