/**
 * WebGAL 腳本擴展 - 資源管理器視圖提供器
 * 
 * 提供 WebGAL 遊戲資源的樹狀結構顯示
 * 包括背景、立繪、音樂、語音、視頻、特效等分類
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getGamePath } from '../utils/fileUtils';
import { AssetScanner } from '../parsers/assetScanner';

/**
 * 資源類型定義
 */
export interface AssetType {
  id: string;
  name: string;
  directory: string;
  extensions: string[];
  icon: string;
}

/**
 * 資源項目介面
 */
export interface AssetItem {
  type: 'category' | 'file';
  name: string;
  path: string;
  relativePath: string;
  assetType?: AssetType;
  children?: AssetItem[];
  collapsibleState?: vscode.TreeItemCollapsibleState;
  fileSize?: number;
}

/**
 * WebGAL 資源類型配置
 */
export const ASSET_TYPES: AssetType[] = [
  {
    id: 'background',
    name: '背景圖片',
    directory: 'background',
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    icon: 'image'
  },
  {
    id: 'figure',
    name: '立繪',
    directory: 'figure',
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    icon: 'image'
  },
  {
    id: 'bgm',
    name: '背景音樂',
    directory: 'bgm',
    extensions: ['.mp3', '.ogg', '.wav', '.m4a'],
    icon: 'play'
  },
  {
    id: 'vocal',
    name: '語音',
    directory: 'vocal',
    extensions: ['.mp3', '.ogg', '.wav', '.m4a'],
    icon: 'mic'
  },
  {
    id: 'video',
    name: '視頻',
    directory: 'video',
    extensions: ['.mp4', '.webm', '.avi', '.mov'],
    icon: 'video'
  },
  {
    id: 'animation',
    name: '特效',
    directory: 'animation',
    extensions: ['.json', '.spine', '.dragonbones'],
    icon: 'sparkle'
  },
  {
    id: 'tex',
    name: '紋理',
    directory: 'tex',
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    icon: 'texture'
  }
];

/**
 * 資源管理器視圖提供器
 */
export class AssetTreeProvider implements vscode.TreeDataProvider<AssetItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<AssetItem | undefined | null | void> = new vscode.EventEmitter<AssetItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<AssetItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private gamePath: string | undefined;

  constructor(private assetScanner?: AssetScanner) {
    this.gamePath = getGamePath();
    
    // 訂閱資源變化事件
    if (this.assetScanner) {
      this.assetScanner.onDidChangeAssets(() => {
        this.refresh();
      });
    }
  }

  /**
   * 重新整理樹狀結構
   */
  public refresh(): void {
    this.gamePath = getGamePath();
    this._onDidChangeTreeData.fire();
  }

  /**
   * 取得樹狀結構的根項目
   */
  getTreeItem(element: AssetItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.name,
      element.type === 'category' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    );

    if (element.type === 'category') {
      treeItem.iconPath = new vscode.ThemeIcon(element.assetType?.icon || 'folder');
      treeItem.tooltip = `${element.assetType?.name} (${element.children?.length || 0} 個檔案)`;
      treeItem.contextValue = 'assetCategory';
    } else {
      // 檔案項目
      const icon = this.getFileIcon(element.relativePath);
      treeItem.iconPath = new vscode.ThemeIcon(icon);
      treeItem.tooltip = this.getFileTooltip(element);
      treeItem.contextValue = 'assetFile';
      
      // 顯示檔案大小
      if (element.fileSize) {
        treeItem.description = this.formatFileSize(element.fileSize);
      }
    }

    return treeItem;
  }

  /**
   * 取得子項目
   */
  getChildren(element?: AssetItem): Thenable<AssetItem[]> {
    try {
      if (!this.gamePath) {
        console.warn('WebGAL: 遊戲路徑未配置，請檢查 webgal.gamePath 設定');
        return Promise.resolve([{
          type: 'file',
          name: '⚠️ 未找到遊戲目錄',
          path: '',
          relativePath: '請在設定中配置 webgal.gamePath',
          collapsibleState: vscode.TreeItemCollapsibleState.None
        }]);
      }

      if (!element) {
        // 根項目 - 顯示所有資源分類
        return this.getAssetCategories();
      } else if (element.type === 'category') {
        // 分類項目 - 顯示該分類下的檔案
        return this.getAssetFiles(element.assetType!);
      }

      return Promise.resolve([]);
    } catch (error) {
      console.error('WebGAL: 資源管理器載入錯誤:', error);
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
   * 取得資源分類
   */
  private async getAssetCategories(): Promise<AssetItem[]> {
    const categories: AssetItem[] = [];

    for (const assetType of ASSET_TYPES) {
      const categoryPath = path.join(this.gamePath!, assetType.directory);
      const files = this.getFilesInDirectory(categoryPath, assetType.extensions);

      categories.push({
        type: 'category',
        name: assetType.name,
        path: categoryPath,
        relativePath: assetType.directory,
        assetType: assetType,
        children: files,
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
      });
    }

    return categories;
  }

  /**
   * 取得指定分類下的檔案
   */
  private async getAssetFiles(assetType: AssetType): Promise<AssetItem[]> {
    const categoryPath = path.join(this.gamePath!, assetType.directory);
    return this.getFilesInDirectory(categoryPath, assetType.extensions);
  }

  /**
   * 取得目錄中的檔案
   */
  private getFilesInDirectory(dirPath: string, extensions: string[]): AssetItem[] {
    try {
      if (!fs.existsSync(dirPath)) {
        return [];
      }

      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      const result: AssetItem[] = [];

      for (const file of files) {
        if (file.isFile()) {
          const ext = path.extname(file.name).toLowerCase();
          if (extensions.includes(ext)) {
            const fullPath = path.join(dirPath, file.name);
            const stats = fs.statSync(fullPath);
            
            result.push({
              type: 'file',
              name: file.name,
              path: fullPath,
              relativePath: path.relative(this.gamePath!, fullPath),
              fileSize: stats.size
            });
          }
        }
      }

      return result.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error reading asset directory:', error);
      return [];
    }
  }

  /**
   * 根據檔案副檔名取得圖示
   */
  private getFileIcon(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].includes(ext)) {
      return 'image';
    } else if (['.mp3', '.ogg', '.wav', '.m4a', '.aac'].includes(ext)) {
      return 'play';
    } else if (['.mp4', '.webm', '.avi', '.mov', '.mkv'].includes(ext)) {
      return 'video';
    } else if (['.json', '.spine', '.dragonbones'].includes(ext)) {
      return 'json';
    } else {
      return 'file';
    }
  }

  /**
   * 取得檔案提示文字
   */
  private getFileTooltip(item: AssetItem): string {
    let tooltip = `檔案: ${item.relativePath}`;
    
    if (item.fileSize) {
      tooltip += `\n大小: ${this.formatFileSize(item.fileSize)}`;
    }
    
    return tooltip;
  }

  /**
   * 格式化檔案大小
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

/**
 * 資源管理器命令提供器
 */
export class AssetTreeCommands {
  private provider: AssetTreeProvider;

  constructor(provider: AssetTreeProvider) {
    this.provider = provider;
  }

  /**
   * 重新整理資源管理器
   */
  public refresh(): void {
    this.provider.refresh();
  }

  /**
   * 在檔案總管中顯示檔案
   */
  public async revealInExplorer(item: AssetItem): Promise<void> {
    if (item.type === 'file') {
      await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(item.path));
    }
  }

  /**
   * 複製檔案路徑
   */
  public async copyFilePath(item: AssetItem): Promise<void> {
    if (item.type === 'file') {
      await vscode.env.clipboard.writeText(item.relativePath);
      vscode.window.showInformationMessage(`已複製路徑: ${item.relativePath}`);
    }
  }

  /**
   * 複製檔案名稱
   */
  public async copyFileName(item: AssetItem): Promise<void> {
    if (item.type === 'file') {
      await vscode.env.clipboard.writeText(item.name);
      vscode.window.showInformationMessage(`已複製檔案名稱: ${item.name}`);
    }
  }
}
