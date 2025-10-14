/**
 * WebGAL 腳本擴展 - 大綱視圖提供器
 * 
 * 提供場景結構大綱，顯示標籤、分支、場景調用等
 */

import * as vscode from 'vscode';
import { parseLine } from '../parsers/scriptParser';

export class WebGALDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DocumentSymbol[]> {
    const symbols: vscode.DocumentSymbol[] = [];
    const content = document.getText();
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parsed = parseLine(line, i);
      
      if (parsed.type !== 'command' || !parsed.command) {
        continue;
      }
      
      const symbol = this.createSymbolForCommand(parsed.command, parsed.content || '', i, line);
      if (symbol) {
        symbols.push(symbol);
      }
    }
    
    return symbols;
  }
  
  /**
   * 為命令創建符號
   */
  private createSymbolForCommand(
    command: string,
    content: string,
    lineNumber: number,
    line: string
  ): vscode.DocumentSymbol | null {
    const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
    const selectionRange = new vscode.Range(lineNumber, 0, lineNumber, line.length);
    
    switch (command) {
      case 'label':
        return new vscode.DocumentSymbol(
          `📍 ${content}`,
          '標籤',
          vscode.SymbolKind.Namespace,
          range,
          selectionRange
        );
      
      case 'choose':
        return new vscode.DocumentSymbol(
          `🔀 ${this.formatChoiceText(content)}`,
          '選擇分支',
          vscode.SymbolKind.Enum,
          range,
          selectionRange
        );
      
      case 'changeScene':
        return new vscode.DocumentSymbol(
          `🎬 切換場景: ${content}`,
          '場景切換',
          vscode.SymbolKind.Event,
          range,
          selectionRange
        );
      
      case 'callScene':
        return new vscode.DocumentSymbol(
          `📞 調用場景: ${content}`,
          '場景調用',
          vscode.SymbolKind.Function,
          range,
          selectionRange
        );
      
      case 'setVar':
        return new vscode.DocumentSymbol(
          `💾 ${content}`,
          '變數設置',
          vscode.SymbolKind.Variable,
          range,
          selectionRange
        );
      
      case 'jumpLabel':
        return new vscode.DocumentSymbol(
          `➡️ 跳轉: ${content}`,
          '標籤跳轉',
          vscode.SymbolKind.Event,
          range,
          selectionRange
        );
      
      case 'if':
        return new vscode.DocumentSymbol(
          `❓ 條件判斷`,
          '條件',
          vscode.SymbolKind.Operator,
          range,
          selectionRange
        );
      
      case 'changeBg':
        return new vscode.DocumentSymbol(
          `🖼️ 背景: ${content}`,
          '背景切換',
          vscode.SymbolKind.Property,
          range,
          selectionRange
        );
      
      case 'changeFigure':
        return new vscode.DocumentSymbol(
          `👤 立繪: ${content}`,
          '立繪切換',
          vscode.SymbolKind.Property,
          range,
          selectionRange
        );
      
      case 'bgm':
        return new vscode.DocumentSymbol(
          `🎵 BGM: ${content}`,
          '音樂',
          vscode.SymbolKind.Property,
          range,
          selectionRange
        );
      
      case 'playVideo':
        return new vscode.DocumentSymbol(
          `🎥 視頻: ${content}`,
          '視頻播放',
          vscode.SymbolKind.Property,
          range,
          selectionRange
        );
      
      default:
        return null;
    }
  }
  
  /**
   * 格式化選擇分支文本
   */
  private formatChoiceText(content: string): string {
    const options = content.split('|');
    if (options.length <= 2) {
      return content;
    }
    
    // 只顯示選項數量
    return `${options.length} 個選項`;
  }
}

