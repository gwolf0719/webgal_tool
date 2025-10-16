/**
 * WebGAL 腳本擴展 - 資源掃描器
 * 
 * 掃描遊戲目錄中的所有資源文件，建立索引供補全和驗證使用
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { getAssetPath, getScenePath, listFiles, listFilesRecursive } from '../utils/fileUtils';
import { IMAGE_EXTENSIONS, AUDIO_EXTENSIONS, VIDEO_EXTENSIONS, SCENE_EXTENSION } from '../utils/constants';

/**
 * 資源類型
 */
export type AssetType = 'background' | 'figure' | 'bgm' | 'vocal' | 'video' | 'scene' | 'tex' | 'animation';

/**
 * 資源信息
 */
export interface AssetInfo {
  type: AssetType;
  fileName: string;
  fullPath: string;
  relativePath: string;
}

/**
 * 資源掃描器類
 */
export class AssetScanner {
  private assets: Map<AssetType, AssetInfo[]> = new Map();
  private watchers: vscode.FileSystemWatcher[] = [];
  private _onDidChangeAssets: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeAssets: vscode.Event<void> = this._onDidChangeAssets.event;
  private scanDebounceTimer?: NodeJS.Timeout;
  
  constructor() {
    this.initializeAssets();
  }
  
  /**
   * 初始化資源列表
   */
  private initializeAssets() {
    for (const type of ['background', 'figure', 'bgm', 'vocal', 'video', 'scene', 'tex', 'animation'] as AssetType[]) {
      this.assets.set(type, []);
    }
  }
  
  /**
   * 掃描所有資源
   */
  public async scanAll(): Promise<void> {
    this.assets.clear();
    this.initializeAssets();
    
    await Promise.all([
      this.scanBackground(),
      this.scanFigure(),
      this.scanBgm(),
      this.scanVocal(),
      this.scanVideo(),
      this.scanScene(),
      this.scanTex(),
      this.scanAnimation(),
    ]);
    
    // 通知視圖更新
    this._onDidChangeAssets.fire();
  }
  
  /**
   * 掃描背景圖片
   */
  private async scanBackground(): Promise<void> {
    await this.scanAssetFolder('background', IMAGE_EXTENSIONS);
  }
  
  /**
   * 掃描立繪
   */
  private async scanFigure(): Promise<void> {
    await this.scanAssetFolder('figure', IMAGE_EXTENSIONS);
  }
  
  /**
   * 掃描BGM
   */
  private async scanBgm(): Promise<void> {
    await this.scanAssetFolder('bgm', AUDIO_EXTENSIONS);
  }
  
  /**
   * 掃描語音
   */
  private async scanVocal(): Promise<void> {
    await this.scanAssetFolder('vocal', AUDIO_EXTENSIONS);
  }
  
  /**
   * 掃描視頻
   */
  private async scanVideo(): Promise<void> {
    await this.scanAssetFolder('video', VIDEO_EXTENSIONS);
  }
  
  /**
   * 掃描場景
   */
  private async scanScene(): Promise<void> {
    const scenePath = getScenePath();
    if (!scenePath) {
      return;
    }
    
    const files = listFilesRecursive(scenePath, [SCENE_EXTENSION]);
    const assetList: AssetInfo[] = [];
    
    for (const fullPath of files) {
      const relativePath = path.relative(scenePath, fullPath);
      const fileName = path.basename(fullPath);
      
      assetList.push({
        type: 'scene',
        fileName,
        fullPath,
        relativePath,
      });
    }
    
    this.assets.set('scene', assetList);
  }
  
  /**
   * 掃描材質
   */
  private async scanTex(): Promise<void> {
    await this.scanAssetFolder('tex', IMAGE_EXTENSIONS);
  }
  
  /**
   * 掃描動畫
   */
  private async scanAnimation(): Promise<void> {
    await this.scanAssetFolder('animation', [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);
  }
  
  /**
   * 掃描指定類型的資源文件夾
   */
  private async scanAssetFolder(type: AssetType, extensions: string[]): Promise<void> {
    const assetPath = getAssetPath(type);
    if (!assetPath) {
      return;
    }
    
    const files = listFiles(assetPath, extensions);
    const assetList: AssetInfo[] = [];
    
    for (const fileName of files) {
      const fullPath = path.join(assetPath, fileName);
      
      assetList.push({
        type,
        fileName,
        fullPath,
        relativePath: fileName,
      });
    }
    
    this.assets.set(type, assetList);
  }
  
  /**
   * 獲取指定類型的所有資源
   */
  public getAssets(type: AssetType): AssetInfo[] {
    return this.assets.get(type) || [];
  }
  
  /**
   * 獲取所有資源
   */
  public getAllAssets(): Map<AssetType, AssetInfo[]> {
    return this.assets;
  }
  
  /**
   * 查找資源
   */
  public findAsset(fileName: string, type?: AssetType): AssetInfo | undefined {
    if (type) {
      const assets = this.assets.get(type) || [];
      return assets.find(asset => asset.fileName === fileName || asset.relativePath === fileName);
    }
    
    // 在所有類型中搜索
    for (const [_, assets] of this.assets) {
      const found = assets.find(asset => asset.fileName === fileName || asset.relativePath === fileName);
      if (found) {
        return found;
      }
    }
    
    return undefined;
  }
  
  /**
   * 檢查資源是否存在
   */
  public assetExists(fileName: string, type?: AssetType): boolean {
    return this.findAsset(fileName, type) !== undefined;
  }
  
  /**
   * 防抖掃描
   */
  private debouncedScanAll(): void {
    if (this.scanDebounceTimer) {
      clearTimeout(this.scanDebounceTimer);
    }
    
    this.scanDebounceTimer = setTimeout(() => {
      this.scanAll();
    }, 500); // 500ms 防抖
  }

  /**
   * 啟動文件監視器
   */
  public startWatching(): void {
    this.stopWatching();
    
    const assetTypes: AssetType[] = ['background', 'figure', 'bgm', 'vocal', 'video', 'scene', 'tex', 'animation'];
    
    for (const type of assetTypes) {
      const assetPath = type === 'scene' ? getScenePath() : getAssetPath(type);
      if (!assetPath) {
        continue;
      }
      
      const pattern = new vscode.RelativePattern(assetPath, '**/*');
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);
      
      watcher.onDidCreate(() => this.debouncedScanAll());
      watcher.onDidDelete(() => this.debouncedScanAll());
      watcher.onDidChange(() => this.debouncedScanAll());
      
      this.watchers.push(watcher);
    }
  }
  
  /**
   * 停止文件監視器
   */
  public stopWatching(): void {
    for (const watcher of this.watchers) {
      watcher.dispose();
    }
    this.watchers = [];
  }
  
  /**
   * 清理資源
   */
  public dispose(): void {
    this.stopWatching();
    this.assets.clear();
  }
}

