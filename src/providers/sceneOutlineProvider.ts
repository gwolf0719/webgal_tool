/**
 * WebGAL 腳本擴展 - 場景大綱視圖提供器
 * 
 * 提供場景檔案樹狀結構顯示，支援多層目錄結構
 * 允許使用者瀏覽和開啟場景檔案
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getScenePath } from '../utils/fileUtils';

/**
 * 場景大綱項目介面
 */
export interface SceneOutlineItem {
  type: 'file' | 'directory';
  name: string;
  path: string;
  relativePath: string;
  children?: SceneOutlineItem[];
  collapsibleState?: vscode.TreeItemCollapsibleState;
}

/**
 * 場景大綱視圖提供器
 */
export class SceneOutlineProvider implements vscode.TreeDataProvider<SceneOutlineItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SceneOutlineItem | undefined | null | void> = new vscode.EventEmitter<SceneOutlineItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SceneOutlineItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private scenePath: string | undefined;
  private watcher?: vscode.FileSystemWatcher;

  constructor() {
    this.scenePath = getScenePath();
    
    // 監聽場景目錄的變化
    if (this.scenePath) {
      const pattern = new vscode.RelativePattern(this.scenePath, '**/*.txt');
      this.watcher = vscode.workspace.createFileSystemWatcher(pattern);
      
      this.watcher.onDidCreate(() => this.refresh());
      this.watcher.onDidDelete(() => this.refresh());
      this.watcher.onDidChange(() => this.refresh());
    }
  }

  /**
   * 重新整理樹狀結構
   */
  public refresh(): void {
    this.scenePath = getScenePath();
    this._onDidChangeTreeData.fire();
  }

  /**
   * 清理資源
   */
  public dispose(): void {
    if (this.watcher) {
      this.watcher.dispose();
    }
  }

  /**
   * 取得樹狀結構的根項目
   */
  getTreeItem(element: SceneOutlineItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.name,
      element.type === 'directory' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    );

    if (element.type === 'file') {
      treeItem.command = {
        command: 'vscode.open',
        title: '開啟場景檔案',
        arguments: [vscode.Uri.file(element.path)]
      };
      treeItem.iconPath = new vscode.ThemeIcon('file-text');
      treeItem.tooltip = `場景檔案: ${element.relativePath}`;
      treeItem.contextValue = 'sceneFile';
    } else {
      treeItem.iconPath = new vscode.ThemeIcon('folder');
      treeItem.tooltip = `目錄: ${element.relativePath}`;
      treeItem.contextValue = 'sceneDirectory';
    }

    return treeItem;
  }

  /**
   * 取得子項目
   */
  getChildren(element?: SceneOutlineItem): Thenable<SceneOutlineItem[]> {
    try {
      if (!this.scenePath) {
        console.warn('WebGAL: 場景路徑未配置，請檢查 webgal.gamePath 設定');
        return Promise.resolve([{
          type: 'file',
          name: '⚠️ 未找到場景目錄',
          path: '',
          relativePath: '請在設定中配置 webgal.gamePath',
          collapsibleState: vscode.TreeItemCollapsibleState.None
        }]);
      }

      if (!element) {
        // 根項目 - 顯示場景目錄的內容
        return this.getSceneDirectoryContents(this.scenePath, '');
      } else if (element.type === 'directory') {
        // 目錄項目 - 顯示目錄內容
        return this.getSceneDirectoryContents(element.path, element.relativePath);
      }

      return Promise.resolve([]);
    } catch (error) {
      console.error('WebGAL: 場景大綱載入錯誤:', error);
      return Promise.resolve([{
        type: 'file',
        name: '❌ 載入錯誤',
        path: '',
        relativePath: `錯誤: ${error}`,
        collapsibleState: vscode.TreeItemCollapsibleState.None
      }]);
    }
  }

  /**
   * 取得場景目錄內容
   */
  private async getSceneDirectoryContents(dirPath: string, relativePath: string): Promise<SceneOutlineItem[]> {
    try {
      if (!fs.existsSync(dirPath)) {
        return [];
      }

      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      const result: SceneOutlineItem[] = [];

      // 先處理目錄
      const directories = items
        .filter(item => item.isDirectory())
        .map(item => ({
          type: 'directory' as const,
          name: item.name,
          path: path.join(dirPath, item.name),
          relativePath: relativePath ? path.join(relativePath, item.name) : item.name,
          collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      result.push(...directories);

      // 再處理檔案
      const files = items
        .filter(item => item.isFile() && item.name.endsWith('.txt'))
        .map(item => ({
          type: 'file' as const,
          name: item.name,
          path: path.join(dirPath, item.name),
          relativePath: relativePath ? path.join(relativePath, item.name) : item.name
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      result.push(...files);

      return result;
    } catch (error) {
      console.error('Error reading scene directory:', error);
      return [];
    }
  }
}

/**
 * 場景大綱命令提供器
 */
export class SceneOutlineCommands {
  private provider: SceneOutlineProvider;

  constructor(provider: SceneOutlineProvider) {
    this.provider = provider;
  }

  /**
   * 重新整理場景大綱
   */
  public refresh(): void {
    this.provider.refresh();
  }

  /**
   * 開啟場景檔案
   */
  public async openSceneFile(item: SceneOutlineItem): Promise<void> {
    if (item.type === 'file') {
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(item.path));
      await vscode.window.showTextDocument(document);
    }
  }

  /**
   * 在檔案總管中顯示檔案
   */
  public async revealInExplorer(item: SceneOutlineItem): Promise<void> {
    if (item.type === 'file') {
      await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(item.path));
    }
  }

  /**
   * 複製檔案路徑
   */
  public async copyFilePath(item: SceneOutlineItem): Promise<void> {
    if (item.type === 'file') {
      await vscode.env.clipboard.writeText(item.relativePath);
      vscode.window.showInformationMessage(`已複製路徑: ${item.relativePath}`);
    }
  }
}
