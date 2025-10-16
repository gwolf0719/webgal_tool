/**
 * WebGAL 腳本擴展 - 變數追蹤視圖提供器
 * 
 * 顯示 WebGAL 腳本中定義的所有變數
 * 提供變數定義位置、初始值和跳轉功能
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { VariableTracker } from '../parsers/variableTracker';

/**
 * 變數項目介面
 */
export interface VariableItem {
  type: 'file' | 'variable';
  name: string;
  path?: string;
  relativePath?: string;
  value?: string;
  lineNumber?: number;
  children?: VariableItem[];
  collapsibleState?: vscode.TreeItemCollapsibleState;
  variableName?: string;
  definition?: {
    file: string;
    line: number;
    value: string;
  };
}

/**
 * 變數追蹤視圖提供器
 */
export class VariableTreeProvider implements vscode.TreeDataProvider<VariableItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<VariableItem | undefined | null | void> = new vscode.EventEmitter<VariableItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<VariableItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private variableTracker: VariableTracker;

  constructor(variableTracker: VariableTracker) {
    this.variableTracker = variableTracker;
    
    // 訂閱變數變化事件
    this.variableTracker.onDidChangeVariables(() => {
      this.refresh();
    });
  }

  /**
   * 重新整理樹狀結構
   */
  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * 取得樹狀結構的根項目
   */
  getTreeItem(element: VariableItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.name,
      element.type === 'file' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    );

    if (element.type === 'file') {
      treeItem.iconPath = new vscode.ThemeIcon('file-text');
      treeItem.tooltip = `檔案: ${element.relativePath}\n變數數量: ${element.children?.length || 0}`;
      treeItem.contextValue = 'variableFile';
      treeItem.description = `${element.children?.length || 0} 個變數`;
    } else {
      // 變數項目
      treeItem.iconPath = new vscode.ThemeIcon('symbol-variable');
      treeItem.tooltip = this.getVariableTooltip(element);
      treeItem.contextValue = 'variable';
      
      // 顯示變數值
      if (element.value) {
        treeItem.description = element.value;
      }
    }

    return treeItem;
  }

  /**
   * 取得子項目
   */
  getChildren(element?: VariableItem): Thenable<VariableItem[]> {
    try {
      if (!element) {
        // 根項目 - 顯示所有包含變數的檔案
        return this.getFilesWithVariables();
      } else if (element.type === 'file') {
        // 檔案項目 - 顯示該檔案中的變數
        return this.getVariablesInFile(element.path!);
      }

      return Promise.resolve([]);
    } catch (error) {
      console.error('WebGAL: 變數追蹤載入錯誤:', error);
      return Promise.resolve([{
        type: 'variable',
        name: '❌ 載入錯誤',
        relativePath: `錯誤: ${error}`,
        collapsibleState: vscode.TreeItemCollapsibleState.None
      }]);
    }
  }

  /**
   * 取得包含變數的檔案列表
   */
  private async getFilesWithVariables(): Promise<VariableItem[]> {
    try {
      const variables = this.variableTracker.getAllVariables();
      const fileGroups = new Map<string, VariableItem[]>();

      // 按檔案分組變數
      for (const [variableName, variableTracking] of variables.entries()) {
        // 使用第一個定義作為主要定義
        const primaryDefinition = variableTracking.definitions[0];
        if (!primaryDefinition) continue;
        
        const filePath = primaryDefinition.filePath;
        const relativePath = path.basename(filePath);
        
        if (!fileGroups.has(filePath)) {
          fileGroups.set(filePath, []);
        }

        const variableItem: VariableItem = {
          type: 'variable',
          name: variableName,
          variableName: variableName,
          definition: {
            file: filePath,
            line: primaryDefinition.lineNumber,
            value: primaryDefinition.value || ''
          },
          value: primaryDefinition.value || '',
          lineNumber: primaryDefinition.lineNumber
        };

        fileGroups.get(filePath)!.push(variableItem);
      }

      // 轉換為檔案項目
      const result: VariableItem[] = [];
      for (const [filePath, variables] of fileGroups.entries()) {
        const relativePath = path.basename(filePath);
        
        result.push({
          type: 'file',
          name: relativePath,
          path: filePath,
          relativePath: relativePath,
          children: variables.sort((a, b) => a.name.localeCompare(b.name)),
          collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
        });
      }

      return result.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting files with variables:', error);
      return [];
    }
  }

  /**
   * 取得檔案中的變數
   */
  private async getVariablesInFile(filePath: string): Promise<VariableItem[]> {
    try {
      const variables = this.variableTracker.getAllVariables();
      const result: VariableItem[] = [];

      for (const [variableName, variableTracking] of variables.entries()) {
        // 找到在指定檔案中定義的變數
        const fileDefinition = variableTracking.definitions.find(def => def.filePath === filePath);
        if (fileDefinition) {
          result.push({
            type: 'variable',
            name: variableName,
            variableName: variableName,
            definition: {
              file: filePath,
              line: fileDefinition.lineNumber,
              value: fileDefinition.value || ''
            },
            value: fileDefinition.value || '',
            lineNumber: fileDefinition.lineNumber
          });
        }
      }

      return result.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting variables in file:', error);
      return [];
    }
  }

  /**
   * 取得變數提示文字
   */
  private getVariableTooltip(element: VariableItem): string {
    if (!element.definition) {
      return element.name;
    }

    let tooltip = `變數: ${element.name}`;
    
    if (element.value) {
      tooltip += `\n值: ${element.value}`;
    }
    
    tooltip += `\n檔案: ${element.definition.file}`;
    tooltip += `\n行號: ${element.definition.line + 1}`;
    
    return tooltip;
  }
}

/**
 * 變數追蹤命令提供器
 */
export class VariableTreeCommands {
  private provider: VariableTreeProvider;

  constructor(provider: VariableTreeProvider) {
    this.provider = provider;
  }

  /**
   * 重新整理變數追蹤
   */
  public refresh(): void {
    this.provider.refresh();
  }

  /**
   * 跳轉到變數定義
   */
  public async gotoVariableDefinition(item: VariableItem): Promise<void> {
    if (item.type === 'variable' && item.definition) {
      try {
        const document = await vscode.workspace.openTextDocument(vscode.Uri.file(item.definition.file));
        const editor = await vscode.window.showTextDocument(document);
        
        // 跳轉到定義行
        const position = new vscode.Position(item.definition.line, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(
          new vscode.Range(position, position),
          vscode.TextEditorRevealType.InCenter
        );
      } catch (error) {
        vscode.window.showErrorMessage(`無法開啟檔案: ${item.definition.file}`);
      }
    }
  }

  /**
   * 複製變數名稱
   */
  public async copyVariableName(item: VariableItem): Promise<void> {
    if (item.type === 'variable') {
      await vscode.env.clipboard.writeText(item.name);
      vscode.window.showInformationMessage(`已複製變數名稱: ${item.name}`);
    }
  }

  /**
   * 複製變數值
   */
  public async copyVariableValue(item: VariableItem): Promise<void> {
    if (item.type === 'variable' && item.value) {
      await vscode.env.clipboard.writeText(item.value);
      vscode.window.showInformationMessage(`已複製變數值: ${item.value}`);
    }
  }

  /**
   * 搜尋變數
   */
  public async searchVariables(): Promise<void> {
    const searchTerm = await vscode.window.showInputBox({
      prompt: '輸入要搜尋的變數名稱',
      placeHolder: '變數名稱'
    });

    if (!searchTerm) {
      return;
    }

    // 這裡可以實作搜尋功能，暫時顯示提示
    vscode.window.showInformationMessage(`搜尋變數: ${searchTerm}`);
  }
}
