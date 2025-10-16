/**
 * WebGAL 腳本擴展 - 主入口文件
 * 
 * 這是 WebGAL Cursor/VS Code 擴展的主入口，負責初始化所有功能模塊
 * 包括：語法高亮、自動補全、定義跳轉、hover 提示、大綱視圖、診斷等
 */

import * as vscode from 'vscode';
import { AssetScanner } from './parsers/assetScanner';
import { VariableTracker } from './parsers/variableTracker';
import { WebGALCompletionProvider } from './providers/completionProvider';
import { WebGALHoverProvider } from './providers/hoverProvider';
import { WebGALDefinitionProvider } from './providers/definitionProvider';
import { WebGALDocumentSymbolProvider } from './providers/documentSymbolProvider';
import { WebGALDiagnosticProvider } from './providers/diagnosticProvider';
import { WebGALReferenceProvider } from './providers/referenceProvider';
import { WebGALRenameProvider } from './providers/renameProvider';
import { SceneCreationWizard } from './utils/scenePathUtils';
import { SceneOutlineProvider, SceneOutlineCommands } from './providers/sceneOutlineProvider';
import { AssetTreeProvider, AssetTreeCommands } from './providers/assetTreeProvider';
import { VariableTreeProvider, VariableTreeCommands } from './providers/variableTreeProvider';
import { moveSelectedScriptToNewFile } from './utils/scriptMoveUtils';
import { getGamePath } from './utils/fileUtils';

const WEBGAL_LANGUAGE = 'webgal';

let assetScanner: AssetScanner;
let variableTracker: VariableTracker;
let diagnosticProvider: WebGALDiagnosticProvider;

// Tree view providers
let sceneOutlineProvider: SceneOutlineProvider;
let assetTreeProvider: AssetTreeProvider;
let variableTreeProvider: VariableTreeProvider;

/**
 * 擴展激活時調用
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('WebGAL Script Extension 正在激活...');
  
  // 初始化掃描器和追蹤器
  assetScanner = new AssetScanner();
  variableTracker = new VariableTracker();
  diagnosticProvider = new WebGALDiagnosticProvider(assetScanner, variableTracker);
  
  // 註冊語言提供器
  registerProviders(context);
  
  // 註冊樹狀視圖
  registerTreeViews(context);
  
  // 註冊命令
  registerCommands(context);
  
  // 初始化掃描
  await initializeScanning();
  
  // 監聽文檔變化
  setupDocumentListeners(context);
  
  // 顯示激活消息
  vscode.window.showInformationMessage('WebGAL Script Extension 已啟動！');
  
  console.log('WebGAL Script Extension 激活完成');
}

/**
 * 註冊所有語言提供器
 */
function registerProviders(context: vscode.ExtensionContext) {
  const documentSelector: vscode.DocumentSelector = { language: WEBGAL_LANGUAGE };
  
  // 自動補全
  const completionProvider = new WebGALCompletionProvider(assetScanner, variableTracker);
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      documentSelector,
      completionProvider,
      ':', '-', '='
    )
  );
  
  // Hover 提示
  const hoverProvider = new WebGALHoverProvider(assetScanner, variableTracker);
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(documentSelector, hoverProvider)
  );
  
  // 定義跳轉
  const definitionProvider = new WebGALDefinitionProvider(assetScanner, variableTracker);
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(documentSelector, definitionProvider)
  );
  
  // 大綱視圖
  const documentSymbolProvider = new WebGALDocumentSymbolProvider();
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(documentSelector, documentSymbolProvider)
  );
  
  // 引用查找
  const referenceProvider = new WebGALReferenceProvider(variableTracker);
  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(documentSelector, referenceProvider)
  );
  
  // 重命名
  const renameProvider = new WebGALRenameProvider(variableTracker);
  context.subscriptions.push(
    vscode.languages.registerRenameProvider(documentSelector, renameProvider)
  );
  
  console.log('所有語言提供器已註冊');
}

/**
 * 註冊樹狀視圖
 */
function registerTreeViews(context: vscode.ExtensionContext) {
  // 檢查遊戲目錄配置
  const gamePath = getGamePath();
  if (!gamePath) {
    vscode.window.showWarningMessage(
      'WebGAL: 未找到遊戲目錄。請在設定中配置 webgal.gamePath',
      '打開設定'
    ).then(selection => {
      if (selection === '打開設定') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'webgal.gamePath');
      }
    });
  }

  // 場景大綱視圖
  sceneOutlineProvider = new SceneOutlineProvider();
  const sceneOutlineTreeView = vscode.window.createTreeView('webgalSceneOutline', {
    treeDataProvider: sceneOutlineProvider,
    showCollapseAll: true
  });
  context.subscriptions.push(sceneOutlineTreeView);

  // 資源管理器視圖
  assetTreeProvider = new AssetTreeProvider(assetScanner);
  const assetTreeView = vscode.window.createTreeView('webgalAssets', {
    treeDataProvider: assetTreeProvider,
    showCollapseAll: true
  });
  context.subscriptions.push(assetTreeView);

  // 變數追蹤視圖
  variableTreeProvider = new VariableTreeProvider(variableTracker);
  const variableTreeView = vscode.window.createTreeView('webgalVariables', {
    treeDataProvider: variableTreeProvider,
    showCollapseAll: true
  });
  context.subscriptions.push(variableTreeView);

  console.log('所有樹狀視圖已註冊');
}

/**
 * 註冊命令
 */
function registerCommands(context: vscode.ExtensionContext) {
  // 掃描資源命令
  context.subscriptions.push(
    vscode.commands.registerCommand('webgal.scanResources', async () => {
      vscode.window.showInformationMessage('正在掃描 WebGAL 資源...');
      await assetScanner.scanAll();
      await variableTracker.scanAll();
      vscode.window.showInformationMessage('資源掃描完成！');
    })
  );
  
  // 插入對話命令
  context.subscriptions.push(
    vscode.commands.registerCommand('webgal.insertDialogue', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      
      editor.insertSnippet(
        new vscode.SnippetString('${1:角色名}:${2:對話內容}${3: -v=${4:語音.ogg}}')
      );
    })
  );
  
  // 插入選擇分支命令
  context.subscriptions.push(
    vscode.commands.registerCommand('webgal.insertChoice', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      
      const snippet = new vscode.SnippetString([
        'choose:${1:選項1}:${2:label1}|${3:選項2}:${4:label2};',
        '',
        'label:${2:label1};',
        '${5:; 選項1的內容}',
        'jumpLabel:${6:end};',
        '',
        'label:${4:label2};',
        '${7:; 選項2的內容}',
        '',
        'label:${6:end};'
      ].join('\n'));
      
      editor.insertSnippet(snippet);
    })
  );
  
  // 插入標籤命令
  context.subscriptions.push(
    vscode.commands.registerCommand('webgal.insertLabel', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      
      const labelName = await vscode.window.showInputBox({
        prompt: '請輸入標籤名稱',
        placeHolder: 'labelName'
      });
      
      if (labelName) {
        editor.insertSnippet(new vscode.SnippetString(`label:${labelName};`));
      }
    })
  );
  
  // 跳轉到標籤命令
  context.subscriptions.push(
    vscode.commands.registerCommand('webgal.gotoLabel', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      
      const document = editor.document;
      const content = document.getText();
      const { extractLabels } = require('./parsers/scriptParser');
      const labels = extractLabels(content, document.fileName);
      
      if (labels.length === 0) {
        vscode.window.showInformationMessage('當前文件中沒有找到標籤');
        return;
      }
      
      interface LabelQuickPickItem extends vscode.QuickPickItem {
        lineNumber: number;
      }
      
      const items: LabelQuickPickItem[] = labels.map((label: any) => ({
        label: label.name,
        description: `第 ${label.lineNumber + 1} 行`,
        lineNumber: label.lineNumber
      }));
      
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: '選擇要跳轉的標籤'
      });
      
      if (selected) {
        const position = new vscode.Position(selected.lineNumber, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(
          new vscode.Range(position, position),
          vscode.TextEditorRevealType.InCenter
        );
      }
    })
  );
  
  // 場景創建嚮導命令
  context.subscriptions.push(
    vscode.commands.registerCommand('webgal.createSceneWizard', async () => {
      const wizard = new SceneCreationWizard();
      const uri = await wizard.startWizard();
      if (uri) {
        await vscode.window.showTextDocument(uri);
      }
    })
  );

  // 重新整理場景大綱命令
  context.subscriptions.push(
    vscode.commands.registerCommand('webgal.refreshSceneOutline', () => {
      sceneOutlineProvider.refresh();
    })
  );

  // 重新整理資源管理器命令
  context.subscriptions.push(
    vscode.commands.registerCommand('webgal.refreshAssets', () => {
      assetTreeProvider.refresh();
    })
  );

  // 重新整理變數追蹤命令
  context.subscriptions.push(
    vscode.commands.registerCommand('webgal.refreshVariables', () => {
      variableTreeProvider.refresh();
    })
  );

  // 移動腳本到新檔案命令
  context.subscriptions.push(
    vscode.commands.registerCommand('webgal.moveScriptToNewFile', () => {
      moveSelectedScriptToNewFile();
    })
  );
  
  // 創建場景命令
  context.subscriptions.push(
    vscode.commands.registerCommand('webgal.createScene', async (scenePathInfo: any) => {
      const { ScenePathResolver } = await import('./utils/scenePathUtils');
      const resolver = ScenePathResolver.getInstance();
      
      const uri = await resolver.createScene({
        createFile: true,
        directory: scenePathInfo.directory,
        fileName: scenePathInfo.relativePath
      });
      
      if (uri) {
        await vscode.window.showTextDocument(uri);
      }
    })
  );
  
  // 跳轉到場景命令
  context.subscriptions.push(
    vscode.commands.registerCommand('webgal.gotoScene', async () => {
      const { ScenePathResolver } = await import('./utils/scenePathUtils');
      const resolver = ScenePathResolver.getInstance();
      
      const sceneName = await vscode.window.showInputBox({
        prompt: '輸入場景名稱或路徑',
        placeHolder: '例如: daily_loop.txt 或 chapter1/start.txt'
      });
      
      if (!sceneName) {
        return;
      }
      
      const scenePaths = await resolver.resolveScenePath(sceneName);
      
      if (scenePaths.length === 0) {
        vscode.window.showWarningMessage(`找不到場景: ${sceneName}`);
        return;
      }
      
      if (scenePaths.length === 1) {
        const scenePath = scenePaths[0];
        if (scenePath.exists) {
          const uri = vscode.Uri.file(scenePath.fullPath);
          await vscode.window.showTextDocument(uri);
        } else {
          const shouldCreate = await vscode.window.showInformationMessage(
            `場景文件不存在: ${scenePath.relativePath}`,
            '創建文件',
            '取消'
          );
          
          if (shouldCreate === '創建文件') {
            const wizard = new SceneCreationWizard();
            const createdUri = await wizard.startWizard();
            if (createdUri) {
              await vscode.window.showTextDocument(createdUri);
            }
          }
        }
      } else {
        // 多個匹配項，讓用戶選擇
        const items = scenePaths.map(pathInfo => ({
          label: pathInfo.relativePath,
          description: pathInfo.exists ? '現有文件' : '不存在',
          detail: pathInfo.directory,
          pathInfo
        }));
        
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: '選擇要跳轉的場景'
        });
        
        if (selected) {
          const scenePath = selected.pathInfo;
          if (scenePath.exists) {
            const uri = vscode.Uri.file(scenePath.fullPath);
            await vscode.window.showTextDocument(uri);
          } else {
            const shouldCreate = await vscode.window.showInformationMessage(
              `場景文件不存在: ${scenePath.relativePath}`,
              '創建文件',
              '取消'
            );
            
            if (shouldCreate === '創建文件') {
              const wizard = new SceneCreationWizard();
              const createdUri = await wizard.startWizard();
              if (createdUri) {
                await vscode.window.showTextDocument(createdUri);
              }
            }
          }
        }
      }
    })
  );
  
  console.log('所有命令已註冊');
}

/**
 * 初始化掃描
 */
async function initializeScanning() {
  const config = vscode.workspace.getConfiguration('webgal');
  const autoScan = config.get<boolean>('autoScanResources', true);
  
  if (autoScan) {
    console.log('開始初始掃描...');
    await assetScanner.scanAll();
    await variableTracker.scanAll();
    
    // 啟動文件監視
    assetScanner.startWatching();
    variableTracker.startWatching();
    
    console.log('初始掃描完成');
  }
}

/**
 * 設置文檔監聽器
 */
function setupDocumentListeners(context: vscode.ExtensionContext) {
  // 文檔打開時
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(async (document) => {
      if (document.languageId === WEBGAL_LANGUAGE) {
        await diagnosticProvider.diagnose(document);
      }
    })
  );
  
  // 文檔保存時
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (document.languageId === WEBGAL_LANGUAGE) {
        await variableTracker.scanFile(document.fileName);
        await diagnosticProvider.diagnose(document);
      }
    })
  );
  
  // 文檔變更時（延遲診斷）
  let diagnosticTimeout: NodeJS.Timeout | undefined;
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === WEBGAL_LANGUAGE) {
        if (diagnosticTimeout) {
          clearTimeout(diagnosticTimeout);
        }
        
        diagnosticTimeout = setTimeout(() => {
          diagnosticProvider.diagnose(event.document);
        }, 500);
      }
    })
  );
  
  // 文檔關閉時
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      if (document.languageId === WEBGAL_LANGUAGE) {
        // 可以在這裡清理相關資源
      }
    })
  );
  
  // 診斷當前打開的所有 WebGAL 文檔
  vscode.workspace.textDocuments.forEach((document) => {
    if (document.languageId === WEBGAL_LANGUAGE) {
      diagnosticProvider.diagnose(document);
    }
  });
  
  console.log('文檔監聽器已設置');
}

/**
 * 擴展停用時調用
 */
export function deactivate() {
  console.log('WebGAL Script Extension 正在停用...');
  
  if (assetScanner) {
    assetScanner.dispose();
  }
  
  if (variableTracker) {
    variableTracker.dispose();
  }
  
  if (diagnosticProvider) {
    diagnosticProvider.dispose();
  }
  
  console.log('WebGAL Script Extension 已停用');
}

