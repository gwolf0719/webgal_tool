/**
 * WebGAL 腳本擴展 - 常量定義
 * 
 * 本文件定義了所有 WebGAL 支援的命令、參數和配置選項
 * 這些定義來自 WebGAL 官方解析器的 scriptConfig.ts
 */

/**
 * WebGAL 所有支援的命令類型
 */
export const WEBGAL_COMMANDS = [
  'say',              // 對話
  'changeBg',         // 更改背景
  'changeFigure',     // 更改立繪
  'bgm',              // 播放背景音樂
  'playVideo',        // 播放視頻
  'pixiPerform',      // Pixi 特效演出
  'pixiInit',         // Pixi 初始化
  'intro',            // 黑屏文字演示
  'miniAvatar',       // 小頭像
  'changeScene',      // 切換場景
  'choose',           // 分支選擇
  'end',              // 結束遊戲
  'setComplexAnimation', // 複雜動畫演出
  'setFilter',        // 設置濾鏡效果
  'label',            // 標籤定義
  'jumpLabel',        // 跳轉到標籤
  'chooseLabel',      // 選擇標籤
  'setVar',           // 設置變數
  'if',               // 條件判斷
  'callScene',        // 調用場景
  'showVars',         // 顯示變數
  'unlockCg',         // 解鎖 CG
  'unlockBgm',        // 解鎖 BGM
  'filmMode',         // 電影模式
  'setTextbox',       // 設置文本框
  'setAnimation',     // 設置動畫
  'playEffect',       // 播放音效
  'setTempAnimation', // 設置臨時動畫
  'setTransform',     // 設置變換
  'setTransition',    // 設置轉場
  'getUserInput',     // 獲取用戶輸入
  'applyStyle',       // 應用樣式
  'wait',             // 等待
] as const;

/**
 * 自動添加 -next 參數的命令列表
 */
export const AUTO_NEXT_COMMANDS = [
  'bgm',
  'pixiPerform',
  'pixiInit',
  'miniAvatar',
  'label',
  'if',
  'setVar',
  'unlockCg',
  'unlockBgm',
  'filmMode',
  'playEffect',
  'setTransition',
  'applyStyle',
] as const;

/**
 * 命令的詳細信息
 */
export interface CommandInfo {
  name: string;
  description: string;
  usage: string;
  parameters: ParameterInfo[];
  examples: string[];
}

/**
 * 參數信息
 */
export interface ParameterInfo {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'file';
  values?: string[];
}

/**
 * 命令詳細文檔
 */
export const COMMAND_DOCS: Record<string, CommandInfo> = {
  say: {
    name: 'say',
    description: '顯示對話',
    usage: '角色名:對話內容 -v=語音文件',
    parameters: [
      { name: 'speaker', description: '說話的角色名', required: false, type: 'string' },
      { name: 'v', description: '語音文件', required: false, type: 'file' },
    ],
    examples: [
      '角色:這是一段對話',
      '角色:這是一段對話 -v=voice.ogg',
      ':旁白文字（無角色名）',
    ],
  },
  changeBg: {
    name: 'changeBg',
    description: '更改背景圖片',
    usage: 'changeBg:圖片文件 -next',
    parameters: [
      { name: 'filename', description: '背景圖片文件名', required: true, type: 'file' },
      { name: 'next', description: '立即執行下一句', required: false, type: 'boolean' },
    ],
    examples: [
      'changeBg:bg1.jpg',
      'changeBg:bg1.jpg -next',
    ],
  },
  changeFigure: {
    name: 'changeFigure',
    description: '更改立繪',
    usage: 'changeFigure:立繪文件 -left -next',
    parameters: [
      { name: 'filename', description: '立繪文件名（none 為清除）', required: true, type: 'file' },
      { name: 'left', description: '顯示在左側', required: false, type: 'boolean' },
      { name: 'right', description: '顯示在右側', required: false, type: 'boolean' },
      { name: 'next', description: '立即執行下一句', required: false, type: 'boolean' },
    ],
    examples: [
      'changeFigure:character1.png',
      'changeFigure:character1.png -left -next',
      'changeFigure:none -left',
    ],
  },
  bgm: {
    name: 'bgm',
    description: '播放背景音樂',
    usage: 'bgm:音樂文件',
    parameters: [
      { name: 'filename', description: '音樂文件名', required: true, type: 'file' },
    ],
    examples: [
      'bgm:music.mp3',
      'bgm:none; 停止播放',
    ],
  },
  label: {
    name: 'label',
    description: '定義一個標籤，用於跳轉',
    usage: 'label:標籤名',
    parameters: [
      { name: 'name', description: '標籤名稱', required: true, type: 'string' },
    ],
    examples: [
      'label:start',
      'label:ending1',
    ],
  },
  jumpLabel: {
    name: 'jumpLabel',
    description: '跳轉到指定標籤',
    usage: 'jumpLabel:標籤名',
    parameters: [
      { name: 'name', description: '目標標籤名稱', required: true, type: 'string' },
    ],
    examples: [
      'jumpLabel:start',
      'jumpLabel:ending1',
    ],
  },
  choose: {
    name: 'choose',
    description: '顯示選擇分支',
    usage: 'choose:選項1文字:標籤1|選項2文字:標籤2',
    parameters: [
      { name: 'options', description: '選項列表，用 | 分隔', required: true, type: 'string' },
    ],
    examples: [
      'choose:選項A:labelA|選項B:labelB',
      'choose:同意:agree|拒絕:refuse',
    ],
  },
  setVar: {
    name: 'setVar',
    description: '設置變數',
    usage: 'setVar:變數名=值',
    parameters: [
      { name: 'expression', description: '變數賦值表達式', required: true, type: 'string' },
    ],
    examples: [
      'setVar:score=100',
      'setVar:name=玩家',
      'setVar:count=count+1',
    ],
  },
  callScene: {
    name: 'callScene',
    description: '調用子場景',
    usage: 'callScene:場景文件 -when=條件',
    parameters: [
      { name: 'filename', description: '場景文件名', required: true, type: 'file' },
      { name: 'when', description: '條件表達式', required: false, type: 'string' },
    ],
    examples: [
      'callScene:subscene.txt',
      'callScene:event.txt -when=score>50',
    ],
  },
  changeScene: {
    name: 'changeScene',
    description: '切換到另一個場景',
    usage: 'changeScene:場景文件',
    parameters: [
      { name: 'filename', description: '場景文件名', required: true, type: 'file' },
    ],
    examples: [
      'changeScene:chapter2.txt',
    ],
  },
  if: {
    name: 'if',
    description: '條件判斷',
    usage: 'command:args -when=條件',
    parameters: [
      { name: 'when', description: '條件表達式', required: true, type: 'string' },
    ],
    examples: [
      'jumpLabel:goodEnd -when=score>80',
      'changeFigure:happy.png -when=affection>50',
    ],
  },
  playVideo: {
    name: 'playVideo',
    description: '播放視頻',
    usage: 'playVideo:視頻文件',
    parameters: [
      { name: 'filename', description: '視頻文件名', required: true, type: 'file' },
    ],
    examples: [
      'playVideo:opening.mp4',
    ],
  },
  setAnimation: {
    name: 'setAnimation',
    description: '設置動畫效果',
    usage: 'setAnimation:動畫名 -target=目標',
    parameters: [
      { name: 'animation', description: '動畫名稱', required: true, type: 'string' },
      { name: 'target', description: '動畫目標', required: false, type: 'string', values: ['fig-left', 'fig-center', 'fig-right'] },
    ],
    examples: [
      'setAnimation:enter-from-left -target=fig-left',
      'setAnimation:shake -target=fig-center',
    ],
  },
  miniAvatar: {
    name: 'miniAvatar',
    description: '顯示小頭像',
    usage: 'miniAvatar:頭像文件',
    parameters: [
      { name: 'filename', description: '頭像文件名（none 為清除）', required: true, type: 'file' },
    ],
    examples: [
      'miniAvatar:avatar.png',
      'miniAvatar:none',
    ],
  },
  unlockCg: {
    name: 'unlockCg',
    description: '解鎖 CG 到鑑賞模式',
    usage: 'unlockCg:CG文件 -name=名稱',
    parameters: [
      { name: 'filename', description: 'CG 文件名', required: true, type: 'file' },
      { name: 'name', description: 'CG 顯示名稱', required: false, type: 'string' },
    ],
    examples: [
      'unlockCg:cg1.jpg -name=初次見面',
    ],
  },
  unlockBgm: {
    name: 'unlockBgm',
    description: '解鎖 BGM 到鑑賞模式',
    usage: 'unlockBgm:音樂文件 -name=名稱',
    parameters: [
      { name: 'filename', description: '音樂文件名', required: true, type: 'file' },
      { name: 'name', description: '音樂顯示名稱', required: false, type: 'string' },
    ],
    examples: [
      'unlockBgm:music.mp3 -name=主題曲',
    ],
  },
};

/**
 * 資源文件夾映射
 */
export const ASSET_FOLDERS = {
  background: 'background',
  figure: 'figure',
  bgm: 'bgm',
  vocal: 'vocal',
  video: 'video',
  scene: 'scene',
  tex: 'tex',
  animation: 'animation',
} as const;

/**
 * 支援的圖片格式
 */
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/**
 * 支援的音頻格式
 */
export const AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a'];

/**
 * 支援的視頻格式
 */
export const VIDEO_EXTENSIONS = ['.mp4', '.webm'];

/**
 * 場景文件擴展名
 */
export const SCENE_EXTENSION = '.txt';

