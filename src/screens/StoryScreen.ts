import { getPlayer, setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { getChapter } from '../data/chapters/index';
import { bus } from '../ui/events';
import { showScreen } from './ScreenManager';
import { enterCamp } from './Camp';
import { initBattle } from '../systems/BattleEngine';
import type { StoryNode } from '../data/types';

// ── VN engine state ──
let _nodeId  = 'start';
let _timer: ReturnType<typeof setInterval> | null = null;
let _waiting = false;
let _keyHandler: ((e: KeyboardEvent) => void) | null = null;
let _mouseHandler: ((e: MouseEvent) => void) | null = null;
let _finishCallback: (() => void) | null = null;
let _mouseDownTarget: EventTarget | null = null; // 记录 mousedown 的目标

export function runStoryIntro(startNodeId?: string, onFinish?: () => void): void {
  const p = getPlayer();
  const chapter = getChapter(p.chapter);
  _finishCallback = onFinish ?? null;
  _nodeId = startNodeId ?? chapter.startNode;
  showScreen('story');

  const bg = document.getElementById('story-bg');
  if (bg) { bg.classList.remove('visible'); (bg as HTMLElement).style.backgroundImage = ''; }

  // 使用 mousedown + mouseup 配对来避免拖拽选中文字时误触发
  // 只有 mousedown 和 mouseup 在同一个元素上（没有拖拽）才算有效点击
  if (_mouseHandler) document.removeEventListener('mousedown', _mouseHandler);
  _mouseHandler = (e: MouseEvent) => {
    _mouseDownTarget = e.target;
  };
  document.addEventListener('mousedown', _mouseHandler);

  const overlay = document.getElementById('story-overlay');
  if (overlay) {
    overlay.onclick = null;
    overlay.addEventListener('mouseup', _handleMouseUp);
  }

  if (_keyHandler) document.removeEventListener('keydown', _keyHandler);
  _keyHandler = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      _advanceStory();
    }
  };
  document.addEventListener('keydown', _keyHandler);

  document.getElementById('story-continue-hint')?.classList.add('hidden');

  // listen for story-battle results
  bus.on('story:battle-end', ({ result }) => {
    const node = chapter.storyNodes[_nodeId];
    if (node?.type !== 'battle') return;
    showScreen('story');
    const next = result === 'win' ? node.nextOnWin : (node.nextOnLose ?? node.nextOnWin);
    if (next) showStoryNode(next);
    else finishStoryIntro();
  });
  bus.on('battle:end', ({ result }) => {
    const node = chapter.storyNodes[_nodeId];
    if (node?.type !== 'battle') return;
    showScreen('story');
    const next = result === 'win' ? node.nextOnWin : (node.nextOnLose ?? node.nextOnWin);
    if (next) showStoryNode(next);
    else finishStoryIntro();
  });

  showStoryNode(_nodeId);
}

/** mouseup 处理：只有 mousedown 和 mouseup 在同一目标上（没有拖拽）才推进 */
function _handleMouseUp(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  // 忽略跳过按钮和选项按钮
  if (target.closest('.story-skip-btn') || target.closest('.story-choice-btn')) return;
  // 如果 mousedown 和 mouseup 的目标不同，说明发生了拖拽，忽略
  if (_mouseDownTarget !== e.target) return;
  _advanceStory();
}

/** 统一的推进逻辑：左键/空格/回车都走这里 */
function _advanceStory(): void {
  const p = getPlayer();
  const storyNodes = getChapter(p.chapter).storyNodes;
  const node = storyNodes[_nodeId];
  if (!node) return;

  // 正在打字中 → 立即完成打字，显示完整文字
  if (_timer !== null) {
    clearInterval(_timer);
    _timer = null;
    if (node.type === 'narration' || node.type === 'dialogue') {
      let text = (node as { text: string }).text ?? '';
      if (node.type === 'dialogue' && (node as { speaker: string }).speaker === '我') {
        text = text.replace('%s%', p.name ?? '少年');
      }
      // 替换 [主角名] 占位符
      text = text.replace(/\[主角名\]/g, p.name ?? '少年');
      const textEl = document.getElementById(node.type === 'narration' ? 'story-narration-text' : 'story-dialogue-text');
      if (textEl) textEl.textContent = text;
    }
    document.getElementById('story-continue-hint')?.classList.remove('hidden');
    return;
  }

  // 打字已完成，等待推进 → 进入下一句
  if (_waiting) {
    if (node.type !== 'choice' && 'next' in node && node.next) {
      showStoryNode(node.next);
    }
    return;
  }

  // CG 模式下点击跳过
  if (node.type === 'cg' && _timer !== null) {
    clearInterval(_timer);
    _timer = null;
    if ('next' in node && node.next) showStoryNode(node.next);
    return;
  }
}

export function showStoryNode(nodeId: string): void {
  if (nodeId === 'END') { finishStoryIntro(); return; }
  const p = getPlayer();
  const node = getChapter(p.chapter).storyNodes[nodeId];
  if (!node) { finishStoryIntro(); return; }
  _nodeId = nodeId;
  _waiting = false;

  document.getElementById('story-continue-hint')?.classList.add('hidden');
  document.getElementById('story-narration-mode')?.classList.add('hidden');
  document.getElementById('story-dialogue-mode')?.classList.add('hidden');
  // 清除 dialogue-bg class（CG/narration 节点不需要全屏 bg）
  document.getElementById('story-bg')?.classList.remove('dialogue-bg');
  if (_timer !== null) { clearInterval(_timer); _timer = null; }

  switch (node.type) {
    case 'narration': _showNarration(node); break;
    case 'dialogue':  _showDialogue(node);  break;
    case 'cg':        _showCG(node);        break;
    case 'flash':     _doFlash(node.next);  break;
    case 'choice':    _showChoices(node);   break;
    case 'battle':    _startBattle(node);   break;
    default:
      if ('next' in (node as StoryNode) && (node as { next?: string }).next)
        showStoryNode((node as { next: string }).next);
      else finishStoryIntro();
  }
}

function _typeText(el: HTMLElement, text: string, speed: number, cb: () => void): void {
  el.textContent = '';
  if (text == null) { cb(); return; }
  const str = String(text);
  let i = 0;
  _timer = setInterval(() => {
    if (i < str.length) { el.textContent += str[i]; i++; }
    if (i >= str.length) { clearInterval(_timer!); _timer = null; cb(); }
  }, speed);
}

function _showNarration(node: { text: string; next: string }): void {
  const el    = document.getElementById('story-narration-mode');
  const textEl = document.getElementById('story-narration-text');
  el?.classList.remove('hidden');
  const p = getPlayer();
  const text = node.text.replace(/\[主角名\]/g, p.name ?? '少年');
  if (textEl) _typeText(textEl, text, 28, () => {
    document.getElementById('story-continue-hint')?.classList.remove('hidden');
  });
  _waiting = true;
}

function _showDialogue(node: { speaker: string; text: string; portrait?: string; bg?: string; next: string }): void {
  const el = document.getElementById('story-dialogue-mode');
  el?.classList.remove('hidden');

  const p = getPlayer();
  let text = node.text;
  if (node.speaker === '我' && p) text = text.replace('%s%', p.name ?? '少年');
  // 替换所有对话中的 [主角名] 占位符
  if (p) text = text.replace(/\[主角名\]/g, p.name ?? '少年');

  const speakerEl = document.getElementById('story-speaker-name');
  if (speakerEl) speakerEl.textContent = node.speaker;

  const portrait = document.getElementById('story-char-portrait') as HTMLImageElement | null;
  if (portrait) {
    if (node.portrait) {
      portrait.src = node.portrait;
      portrait.style.display = 'block';
      portrait.onerror = () => { portrait.style.display = 'none'; };
    } else {
      portrait.style.display = 'none';
    }
  }

  if (node.bg) {
    const bg = document.getElementById('story-bg') as HTMLElement | null;
    if (bg) { bg.style.backgroundImage = `url('${node.bg}')`; bg.classList.add('visible', 'dialogue-bg'); }
  }

  // 清空选项区（安全写法，避免非空断言抛错）
  const choicesArea = document.getElementById('story-choices-area');
  if (choicesArea) choicesArea.innerHTML = '';

  const textEl = document.getElementById('story-dialogue-text');
  if (textEl) _typeText(textEl, text, 25, () => {
    document.getElementById('story-continue-hint')?.classList.remove('hidden');
  });

  _waiting = true;
}

function _showCG(node: { bg: string; delay: number; next: string }): void {
  _waiting = true;
  const bg = document.getElementById('story-bg') as HTMLElement | null;
  if (bg) {
    bg.style.backgroundImage = `url('${node.bg}')`;
    bg.classList.remove('visible');
    // 将外层淡入 timeout 也赋给 _timer，使其可被点击取消，防止幽灵 timer 二次触发
    _timer = setTimeout(() => {
      bg.classList.add('visible');
      _timer = setTimeout(() => { if (node.next) showStoryNode(node.next); }, node.delay ?? 3000) as unknown as ReturnType<typeof setInterval>;
    }, 200) as unknown as ReturnType<typeof setInterval>;
  }
}

function _doFlash(next: string): void {
  _waiting = false;
  const bg = document.getElementById('story-bg') as HTMLElement | null;
  if (bg) {
    bg.style.backgroundImage = '';
    bg.style.background = '#ffffff';
    bg.classList.add('visible');
    setTimeout(() => {
      bg.classList.remove('visible');
      bg.style.background = '';
      setTimeout(() => { if (next) showStoryNode(next); }, 300);
    }, 400);
  }
}

function _showChoices(node: { choices: Array<{ text: string; next: string }> }): void {
  const area = document.getElementById('story-choices-area');
  if (!area) return;
  area.innerHTML = '';

  const dialogMode = document.getElementById('story-dialogue-mode');
  dialogMode?.classList.remove('hidden');
  const speakerEl = document.getElementById('story-speaker-name');
  if (speakerEl) speakerEl.textContent = '';
  const textEl = document.getElementById('story-dialogue-text');
  if (textEl) textEl.textContent = '';
  for (const choice of node.choices) {
    const btn = document.createElement('button');
    btn.className = 'story-choice-btn';
    btn.textContent = choice.text;
    btn.addEventListener('click', () => {
      if (_timer !== null) { clearInterval(_timer); _timer = null; }
      showStoryNode(choice.next);
    });
    area.appendChild(btn);
  }
  _waiting = false;
  document.getElementById('story-continue-hint')?.classList.add('hidden');
}

function _startBattle(node: import('../data/types').BattleStoryNode): void {
  if (node.teamEnemies && node.teamEnemies.length > 0) {
    // 团队战模式
    const player = getPlayer();
    const allyDefs: Array<{
      name: string; hp: number; maxHp: number; mp: number; maxMp: number;
      atk: number; def: number; agi: number; crit: number;
      charImg?: string; icon?: string; skills: import('../data/types').SkillId[]; isPlayer: boolean;
    }> = [
      {
        name: player.name, hp: player.hp, maxHp: player.maxHp,
        mp: player.mp, maxMp: player.maxMp,
        atk: player.atk, def: player.def, agi: player.agi, crit: player.crit,
        charImg: player.charImg, skills: player.skills, isPlayer: true,
      },
    ];
    // 添加队友（如果未指定属性，则基于玩家等级动态生成）
    if (node.teamAllies) {
      for (const a of node.teamAllies) {
        allyDefs.push({ ...a, isPlayer: false });
      }
    }
    import('../systems/BattleEngine').then(m => {
      m.initTeamBattle(allyDefs, node.teamEnemies!);
    });
  } else {
    initBattle(node.enemyId as import('../data/types').EnemyId);
  }
}

export function skipStoryIntro(): void {
  if (_keyHandler) { document.removeEventListener('keydown', _keyHandler); _keyHandler = null; }
  if (_mouseHandler) { document.removeEventListener('mousedown', _mouseHandler); _mouseHandler = null; }
  if (_timer !== null) { clearInterval(_timer); _timer = null; }
  finishStoryIntro();
}

function finishStoryIntro(): void {
  if (_keyHandler) { document.removeEventListener('keydown', _keyHandler); _keyHandler = null; }
  if (_mouseHandler) { document.removeEventListener('mousedown', _mouseHandler); _mouseHandler = null; }
  bus.off('story:battle-end', () => {});
  bus.off('battle:end', () => {});

  const callback = _finishCallback;
  _finishCallback = null;

  if (callback) {
    callback();
    return;
  }

  // Default ch1 first-run behavior
  const p = getPlayer();
  if (p) {
    const chapter = getChapter(p.chapter);
    // 使用 realmConfig 计算炼气一层属性（含主角天赋 dragon_vein 加成）
    import('../data/realmConfig').then(({ calculateFinalStats }) => {
      const newStats = calculateFinalStats(1, [p.playerTalent]);
      const wudangStats = {
        hp: newStats.hp, maxHp: newStats.hp,
        mp: newStats.mp, maxMp: newStats.mp,
        atk: newStats.atk, def: newStats.def, agi: newStats.agi, crit: newStats.crit,
        level: 1, exp: 0,
      };
      const updated = { ...p, ...wudangStats, act: chapter.finalAct, tutorialDone: true };
      setPlayer(updated);
      saveGame(updated);
      enterCamp();
    });
    return;
  }
  enterCamp();
}