/**
 * WebGAL 腳本擴展 - 腳本解析器
 * 
 * 解析 WebGAL 腳本，提取命令、參數、標籤、變數等信息
 */

import { WEBGAL_COMMANDS } from '../utils/constants';

/**
 * 解析結果接口
 */
export interface ParseResult {
  type: 'command' | 'dialogue' | 'comment' | 'empty';
  command?: string;
  speaker?: string;
  content?: string;
  args: Map<string, string>;
  rawLine: string;
  lineNumber: number;
}

/**
 * 標籤信息
 */
export interface LabelInfo {
  name: string;
  lineNumber: number;
  filePath: string;
}

/**
 * 變數信息
 */
export interface VariableInfo {
  name: string;
  value?: string;
  lineNumber: number;
  filePath: string;
}

/**
 * 場景引用信息
 */
export interface SceneReference {
  sceneName: string;
  type: 'changeScene' | 'callScene';
  lineNumber: number;
  condition?: string;
}

/**
 * 解析單行腳本
 */
export function parseLine(line: string, lineNumber: number): ParseResult {
  const trimmedLine = line.trim();
  
  // 空行
  if (trimmedLine === '') {
    return {
      type: 'empty',
      args: new Map(),
      rawLine: line,
      lineNumber,
    };
  }
  
  // 純註釋行
  if (trimmedLine.startsWith(';')) {
    return {
      type: 'comment',
      content: trimmedLine.substring(1).trim(),
      args: new Map(),
      rawLine: line,
      lineNumber,
    };
  }
  
  // 移除行尾註釋（未轉義的分號）
  let contentPart = trimmedLine;
  const commentMatch = trimmedLine.match(/(?<!\\);/);
  if (commentMatch && commentMatch.index !== undefined) {
    contentPart = trimmedLine.substring(0, commentMatch.index).trim();
  }
  
  // 處理轉義的分號
  contentPart = contentPart.replace(/\\;/g, ';');
  
  // 分離主要內容和參數
  const { mainPart, args } = parseArguments(contentPart);
  
  // 檢查是否為命令行
  const colonIndex = mainPart.indexOf(':');
  if (colonIndex > 0) {
    const beforeColon = mainPart.substring(0, colonIndex).trim();
    const afterColon = mainPart.substring(colonIndex + 1).trim();
    
    // 檢查是否為已知命令
    if (WEBGAL_COMMANDS.includes(beforeColon as any)) {
      return {
        type: 'command',
        command: beforeColon,
        content: afterColon,
        args,
        rawLine: line,
        lineNumber,
      };
    } else {
      // 角色對話
      return {
        type: 'dialogue',
        speaker: beforeColon,
        content: afterColon,
        args,
        rawLine: line,
        lineNumber,
      };
    }
  }
  
  // 無冒號的命令（如 pixiInit;）
  if (WEBGAL_COMMANDS.includes(mainPart as any)) {
    return {
      type: 'command',
      command: mainPart,
      args,
      rawLine: line,
      lineNumber,
    };
  }
  
  // 旁白或純文字
  return {
    type: 'dialogue',
    content: mainPart,
    args,
    rawLine: line,
    lineNumber,
  };
}

/**
 * 解析參數列表
 */
function parseArguments(content: string): { mainPart: string; args: Map<string, string> } {
  const args = new Map<string, string>();
  
  // 查找第一個 空格-
  const argStartMatch = content.match(/\s-/);
  if (!argStartMatch || argStartMatch.index === undefined) {
    return { mainPart: content, args };
  }
  
  const mainPart = content.substring(0, argStartMatch.index).trim();
  const argsPart = content.substring(argStartMatch.index).trim();
  
  // 解析參數
  const argPattern = /-([^\s-]+)/g;
  let match;
  
  while ((match = argPattern.exec(argsPart)) !== null) {
    const arg = match[1];
    const equalIndex = arg.indexOf('=');
    
    if (equalIndex > 0) {
      // 鍵值對參數
      const key = arg.substring(0, equalIndex);
      const value = arg.substring(equalIndex + 1);
      args.set(key, value);
    } else {
      // 布爾標記參數
      args.set(arg, 'true');
    }
  }
  
  return { mainPart, args };
}

/**
 * 從文件內容中提取所有標籤
 */
export function extractLabels(content: string, filePath: string): LabelInfo[] {
  const labels: LabelInfo[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i], i);
    
    if (parsed.type === 'command' && parsed.command === 'label' && parsed.content) {
      labels.push({
        name: parsed.content,
        lineNumber: i,
        filePath,
      });
    }
  }
  
  return labels;
}

/**
 * 從文件內容中提取所有變數定義
 */
export function extractVariables(content: string, filePath: string): VariableInfo[] {
  const variables: VariableInfo[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i], i);
    
    if (parsed.type === 'command' && parsed.command === 'setVar' && parsed.content) {
      const equalIndex = parsed.content.indexOf('=');
      if (equalIndex > 0) {
        const varName = parsed.content.substring(0, equalIndex).trim();
        const varValue = parsed.content.substring(equalIndex + 1).trim();
        
        variables.push({
          name: varName,
          value: varValue,
          lineNumber: i,
          filePath,
        });
      }
    }
  }
  
  return variables;
}

/**
 * 從文件內容中提取場景引用
 */
export function extractSceneReferences(content: string): SceneReference[] {
  const references: SceneReference[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i], i);
    
    if (parsed.type === 'command' && parsed.content) {
      if (parsed.command === 'changeScene') {
        references.push({
          sceneName: parsed.content,
          type: 'changeScene',
          lineNumber: i,
        });
      } else if (parsed.command === 'callScene') {
        const condition = parsed.args.get('when');
        references.push({
          sceneName: parsed.content,
          type: 'callScene',
          lineNumber: i,
          condition,
        });
      }
    }
  }
  
  return references;
}

/**
 * 從文件內容中提取所有角色名
 */
export function extractCharacters(content: string): Set<string> {
  const characters = new Set<string>();
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i], i);
    
    if (parsed.type === 'dialogue' && parsed.speaker) {
      characters.add(parsed.speaker);
    }
  }
  
  return characters;
}

/**
 * 查找標籤跳轉目標
 */
export function findLabelReferences(content: string, labelName: string): number[] {
  const references: number[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i], i);
    
    if (parsed.type === 'command') {
      // jumpLabel 命令
      if (parsed.command === 'jumpLabel' && parsed.content === labelName) {
        references.push(i);
      }
      // choose 命令中的標籤
      else if (parsed.command === 'choose' && parsed.content) {
        const options = parsed.content.split('|');
        for (const option of options) {
          const parts = option.split(':');
          if (parts.length >= 2 && parts[1].trim() === labelName) {
            references.push(i);
          }
        }
      }
    }
  }
  
  return references;
}

