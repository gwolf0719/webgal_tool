/**
 * WebGAL 腳本擴展 - 場景路徑工具
 * 
 * 提供場景文件路徑解析、跨目錄查找、創建等進階功能
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getGamePath, getScenePath } from './fileUtils';

/**
 * 場景路徑類型
 */
export interface ScenePathInfo {
  sceneName: string;
  fullPath: string;
  relativePath: string;
  exists: boolean;
  directory: string;
}

/**
 * 場景創建選項
 */
export interface SceneCreationOptions {
  createFile?: boolean;
  createDirectory?: boolean;
  directory?: string;
  fileName?: string;
}

/**
 * 場景路徑解析器類
 */
export class ScenePathResolver {
  private static instance: ScenePathResolver;
  
  private constructor() {}
  
  public static getInstance(): ScenePathResolver {
    if (!ScenePathResolver.instance) {
      ScenePathResolver.instance = new ScenePathResolver();
    }
    return ScenePathResolver.instance;
  }
  
  /**
   * 解析場景路徑，支持多種格式
   */
  public async resolveScenePath(sceneInput: string, currentFilePath?: string): Promise<ScenePathInfo[]> {
    const results: ScenePathInfo[] = [];
    
    // 獲取基礎路徑
    const gamePath = getGamePath();
    const scenePath = getScenePath();
    
    if (!gamePath || !scenePath) {
      return results;
    }
    
    // 清理輸入的路徑
    const cleanInput = sceneInput.trim().replace(/^['"]|['"]$/g, '');
    
    // 嘗試多種路徑解析方式
    const searchPaths = this.generateSearchPaths(cleanInput, currentFilePath, scenePath);
    
    for (const searchPath of searchPaths) {
      const fullPath = path.resolve(scenePath, searchPath);
      
      // 檢查是否為場景文件
      if (this.isSceneFile(fullPath)) {
        results.push({
          sceneName: path.basename(fullPath, '.txt'),
          fullPath,
          relativePath: path.relative(scenePath, fullPath),
          exists: fs.existsSync(fullPath),
          directory: path.dirname(fullPath),
        });
      }
    }
    
    // 去重並排序
    return this.deduplicateAndSort(results);
  }
  
  /**
   * 生成搜索路徑列表
   */
  private generateSearchPaths(input: string, currentFilePath?: string, scenePath?: string): string[] {
    const paths: string[] = [];
    
    // 1. 直接路徑
    paths.push(input);
    
    // 2. 添加 .txt 擴展名
    if (!input.endsWith('.txt')) {
      paths.push(input + '.txt');
    }
    
    // 3. 相對路徑（基於當前文件）
    if (currentFilePath && scenePath) {
      const currentDir = path.dirname(currentFilePath);
      const relativeToCurrent = path.relative(scenePath, currentDir);
      
      // 相對於當前文件的目錄
      paths.push(path.join(relativeToCurrent, input));
      if (!input.endsWith('.txt')) {
        paths.push(path.join(relativeToCurrent, input + '.txt'));
      }
      
      // 相對於當前文件的父目錄（多層級）
      this.addParentDirectoryPaths(relativeToCurrent, input, paths);
    }
    
    // 4. 常見的目錄結構（包括多層）
    const commonDirs = [
      '', 
      'chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5',
      'endings', 'events', 'prologue', 'epilogue',
      'chapter1/act1', 'chapter1/act2', 'chapter1/act3',
      'chapter2/act1', 'chapter2/act2', 'chapter2/act3',
      'chapter3/act1', 'chapter3/act2',
      'events/special', 'events/battle', 'events/dialogue',
      'endings/good', 'endings/bad', 'endings/true'
    ];
    
    for (const dir of commonDirs) {
      paths.push(path.join(dir, input));
      if (!input.endsWith('.txt')) {
        paths.push(path.join(dir, input + '.txt'));
      }
    }
    
    return paths;
  }
  
  /**
   * 添加父目錄路徑（支援多層級）
   */
  private addParentDirectoryPaths(relativeToCurrent: string, input: string, paths: string[]): void {
    let currentPath = relativeToCurrent;
    
    // 最多向上查找 5 層目錄
    for (let i = 0; i < 5; i++) {
      const parentDir = path.dirname(currentPath);
      
      if (parentDir === '.' || parentDir === currentPath) {
        break; // 已到達根目錄
      }
      
      paths.push(path.join(parentDir, input));
      if (!input.endsWith('.txt')) {
        paths.push(path.join(parentDir, input + '.txt'));
      }
      
      currentPath = parentDir;
    }
  }
  
  /**
   * 檢查是否為場景文件
   */
  private isSceneFile(filePath: string): boolean {
    return filePath.endsWith('.txt') && filePath.includes('scene');
  }
  
  /**
   * 去重並排序結果
   */
  private deduplicateAndSort(results: ScenePathInfo[]): ScenePathInfo[] {
    const seen = new Set<string>();
    const unique = results.filter(result => {
      const key = result.fullPath;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    
    // 按存在性排序（存在的文件優先）
    return unique.sort((a, b) => {
      if (a.exists && !b.exists) return -1;
      if (!a.exists && b.exists) return 1;
      return a.relativePath.localeCompare(b.relativePath);
    });
  }
  
  /**
   * 獲取所有可用的場景文件
   */
  public async getAllSceneFiles(): Promise<ScenePathInfo[]> {
    const scenePath = getScenePath();
    if (!scenePath) {
      return [];
    }
    
    const results: ScenePathInfo[] = [];
    
    try {
      this.scanDirectoryRecursive(scenePath, scenePath, results);
    } catch (error) {
      console.error('Error scanning scene directory:', error);
    }
    
    return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }
  
  /**
   * 遞歸掃描目錄
   */
  private scanDirectoryRecursive(dirPath: string, basePath: string, results: ScenePathInfo[]): void {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.scanDirectoryRecursive(fullPath, basePath, results);
      } else if (stat.isFile() && item.endsWith('.txt')) {
        results.push({
          sceneName: path.basename(item, '.txt'),
          fullPath,
          relativePath: path.relative(basePath, fullPath),
          exists: true,
          directory: path.dirname(fullPath),
        });
      }
    }
  }
  
  /**
   * 創建場景文件或目錄
   */
  public async createScene(options: SceneCreationOptions): Promise<vscode.Uri | null> {
    const scenePath = getScenePath();
    if (!scenePath) {
      return null;
    }
    
    try {
      let targetPath: string;
      
      if (options.createDirectory) {
        // 創建目錄
        targetPath = path.join(scenePath, options.directory || 'new_scene');
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }
        
        // 如果有文件名，在目錄中創建文件
        if (options.createFile && options.fileName) {
          const filePath = path.join(targetPath, options.fileName);
          if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, this.generateSceneTemplate(options.fileName));
          }
          return vscode.Uri.file(filePath);
        }
        
        return vscode.Uri.file(targetPath);
      } else if (options.createFile) {
        // 創建文件
        const fileName = options.fileName || 'new_scene.txt';
        const dir = options.directory ? path.join(scenePath, options.directory) : scenePath;
        
        // 確保目錄存在
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        targetPath = path.join(dir, fileName);
        if (!fs.existsSync(targetPath)) {
          fs.writeFileSync(targetPath, this.generateSceneTemplate(fileName));
        }
        
        return vscode.Uri.file(targetPath);
      }
    } catch (error) {
      console.error('Error creating scene:', error);
      vscode.window.showErrorMessage(`創建場景失敗: ${error}`);
    }
    
    return null;
  }
  
  /**
   * 生成場景模板
   */
  private generateSceneTemplate(fileName: string): string {
    const sceneName = path.basename(fileName, '.txt');
    const now = new Date().toLocaleDateString('zh-TW');
    
    return `;========================================
; 檔案名稱: ${fileName}
; 描述: ${sceneName} 場景
; 建立日期: ${now}
; 說明: 請在此處添加場景說明
;========================================

label:start;

; 場景開始
:歡迎來到 ${sceneName} 場景！;

; 在此處添加您的場景內容

end;
`;
  }
}

/**
 * 場景創建嚮導
 */
export class SceneCreationWizard {
  private resolver: ScenePathResolver;
  
  constructor() {
    this.resolver = ScenePathResolver.getInstance();
  }
  
  /**
   * 啟動場景創建嚮導
   */
  public async startWizard(): Promise<vscode.Uri | null> {
    // 選擇創建類型
    const createType = await vscode.window.showQuickPick([
      {
        label: '$(file) 創建新場景文件',
        description: '在現有目錄中創建新的場景文件',
        value: 'file'
      },
      {
        label: '$(folder) 創建新目錄',
        description: '創建新的場景目錄',
        value: 'directory'
      },
      {
        label: '$(file-directory) 創建目錄和文件',
        description: '創建新目錄並在其中創建場景文件',
        value: 'both'
      },
      {
        label: '$(search) 瀏覽現有場景',
        description: '從現有場景中選擇',
        value: 'existing'
      }
    ], {
      placeHolder: '選擇場景創建方式'
    });
    
    if (!createType) {
      return null;
    }
    
    switch (createType.value) {
      case 'file':
        return await this.createSceneFile();
      case 'directory':
        return await this.createDirectory();
      case 'both':
        return await this.createDirectoryAndFile();
      case 'existing':
        return await this.selectExistingScene();
      default:
        return null;
    }
  }
  
  /**
   * 創建場景文件
   */
  private async createSceneFile(): Promise<vscode.Uri | null> {
    // 選擇目錄
    const directories = await this.getAvailableDirectories();
    const selectedDir = await vscode.window.showQuickPick(directories, {
      placeHolder: '選擇目標目錄'
    });
    
    if (!selectedDir) {
      return null;
    }
    
    // 輸入文件名
    const fileName = await vscode.window.showInputBox({
      prompt: '輸入場景文件名',
      placeHolder: 'scene_name.txt',
      value: 'new_scene.txt',
      validateInput: (value) => {
        if (!value || !value.endsWith('.txt')) {
          return '文件名必須以 .txt 結尾';
        }
        return null;
      }
    });
    
    if (!fileName) {
      return null;
    }
    
    return await this.resolver.createScene({
      createFile: true,
      directory: selectedDir.value,
      fileName: fileName
    });
  }
  
  /**
   * 創建目錄
   */
  private async createDirectory(): Promise<vscode.Uri | null> {
    const dirName = await vscode.window.showInputBox({
      prompt: '輸入目錄名稱',
      placeHolder: 'chapter_name',
      value: 'new_chapter'
    });
    
    if (!dirName) {
      return null;
    }
    
    return await this.resolver.createScene({
      createDirectory: true,
      directory: dirName
    });
  }
  
  /**
   * 創建目錄和文件
   */
  private async createDirectoryAndFile(): Promise<vscode.Uri | null> {
    const dirName = await vscode.window.showInputBox({
      prompt: '輸入目錄名稱',
      placeHolder: 'chapter_name',
      value: 'new_chapter'
    });
    
    if (!dirName) {
      return null;
    }
    
    const fileName = await vscode.window.showInputBox({
      prompt: '輸入場景文件名',
      placeHolder: 'scene_name.txt',
      value: 'start.txt'
    });
    
    if (!fileName) {
      return null;
    }
    
    return await this.resolver.createScene({
      createDirectory: true,
      createFile: true,
      directory: dirName,
      fileName: fileName
    });
  }
  
  /**
   * 選擇現有場景
   */
  private async selectExistingScene(): Promise<vscode.Uri | null> {
    const scenes = await this.resolver.getAllSceneFiles();
    
    if (scenes.length === 0) {
      vscode.window.showInformationMessage('沒有找到現有場景文件');
      return null;
    }
    
    const items = scenes.map(scene => ({
      label: `$(file-text) ${scene.sceneName}`,
      description: scene.relativePath,
      detail: scene.directory,
      uri: vscode.Uri.file(scene.fullPath)
    }));
    
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: '選擇現有場景'
    });
    
    return selected?.uri || null;
  }
  
  /**
   * 獲取可用目錄列表
   */
  private async getAvailableDirectories(): Promise<Array<vscode.QuickPickItem & { value: string }>> {
    const scenePath = getScenePath();
    if (!scenePath) {
      return [];
    }
    
    const directories: Array<vscode.QuickPickItem & { value: string }> = [
      {
        label: '$(folder) 根目錄',
        description: '場景根目錄',
        value: ''
      }
    ];
    
    try {
      const scanDir = (dirPath: string, basePath: string, depth = 0) => {
        if (depth > 10) return; // 增加深度限制到 10 層
        
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            const relativePath = path.relative(basePath, fullPath);
            directories.push({
              label: '$(folder) ' + '  '.repeat(depth) + item,
              description: relativePath,
              value: relativePath
            });
            
            scanDir(fullPath, basePath, depth + 1);
          }
        }
      };
      
      scanDir(scenePath, scenePath);
    } catch (error) {
      console.error('Error scanning directories:', error);
    }
    
    return directories;
  }
}
