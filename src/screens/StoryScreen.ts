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

export function runStoryIntro(): void {
  const p = getPlayer();
  const chapter = getChapter(p.chapter);
  _nodeId = chapter.startNode;
  showScreen('story');

  const bg = document.getElementById('story-bg');
  if (bg) { bg.classList.remove('visible'); (bg as HTMLElement).style.backgroundImage = ''; }

  const overlay = document.getElementById('story-overlay');
  if (overlay) overlay.onclick = _handleClick;

  if (_keyHandler) document.removeEventListener('keydown', _keyHandler);
  _keyHandler = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      _handleClick(e as unknown as Event);
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

  showStoryNode(chapter.startNode);
}

function _handleClick(e: Event): void {
  const target = e.target as HTMLElement;
  if (target.closest('.story-skip-btn') || target.closest('.story-choice-btn')) return;

  const p = getPlayer();
  const storyNodes = getChapter(p.chapter).storyNodes;

  // typing still in progress — complete it immediately
  if (_timer !== null) {
    clearInterval(_timer);
    _timer = null;
    const node = storyNodes[_nodeId];
    if (node && (node.type === 'narration' || node.type === 'dialogue')) {
      let text = (node as { text: string }).text ?? '';
      if (node.type === 'dialogue' && node.speaker === '我') {
        text = text.replace('%s%', p.name ?? '少年');
      }
      const textEl = document.getElementById(node.type === 'narration' ? 'story-narration-text' : 'story-dialogue-text');
      if (textEl) textEl.textContent = text;
    }
    document.getElementById('story-continue-hint')?.classList.remove('hidden');
    return;
  }

  if (!_waiting) return;
  const node = storyNodes[_nodeId];
  if (!node) return;
  if (node.type !== 'choice' && 'next' in node && node.next) {
    showStoryNode(node.next);
  }
}

export function showStoryNode(nodeId: string): void {
  if (nodeId === 'END') { finishStoryIntro(); return; }
  const p = getPlayer();
  const node = getChapter(p.chapter).storyNodes[nodeId];
  if (!node) { finishStoryIntro(); return; }
  _nodeId = nodeId;

  document.getElementById('story-continue-hint')?.classList.add('hidden');
  document.getElementById('story-narration-mode')?.classList.add('hidden');
  document.getElementById('story-dialogue-mode')?.classList.add('hidden');
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
  if (textEl) _typeText(textEl, node.text, 28, () => {
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
    if (bg) { bg.style.backgroundImage = `url('${node.bg}')`; bg.classList.add('visible'); }
  }

  const textEl = document.getElementById('story-dialogue-text');
  if (textEl) _typeText(textEl, text, 25, () => {
    document.getElementById('story-continue-hint')?.classList.remove('hidden');
  });

  document.getElementById('story-choices-area')!.innerHTML = '';
  _waiting = true;
}

function _showCG(node: { bg: string; delay: number; next: string }): void {
  _waiting = true; // allow click-to-skip during CG display
  const bg = document.getElementById('story-bg') as HTMLElement | null;
  if (bg) {
    bg.style.backgroundImage = `url('${node.bg}')`;
    bg.classList.remove('visible');
    setTimeout(() => {
      bg.classList.add('visible');
      _timer = setTimeout(() => { if (node.next) showStoryNode(node.next); }, node.delay ?? 3000) as unknown as ReturnType<typeof setInterval>;
    }, 200);
  }
}

function _doFlash(next: string): void {
  _waiting = false; // prevent double-advance during flash animation
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

function _startBattle(node: { enemyId: string; nextOnWin: string; nextOnLose?: string }): void {
  initBattle(node.enemyId as import('../data/types').EnemyId);
}

export function skipStoryIntro(): void {
  if (_keyHandler) { document.removeEventListener('keydown', _keyHandler); _keyHandler = null; }
  if (_timer !== null) { clearInterval(_timer); _timer = null; }
  finishStoryIntro();
}

function finishStoryIntro(): void {
  if (_keyHandler) { document.removeEventListener('keydown', _keyHandler); _keyHandler = null; }
  const p = getPlayer();
  if (p) {
    const chapter = getChapter(p.chapter);
    const wudangStats = {
      hp: 230, maxHp: 230, mp: 130, maxMp: 130,
      atk: 30, def: 15, agi: 15, crit: 5, level: 1,
    };
    const updated = { ...p, ...wudangStats, act: chapter.finalAct, tutorialDone: true };
    setPlayer(updated);
    saveGame(updated);
  }
  // unsubscribe story battle listeners
  bus.off('story:battle-end', () => {});
  bus.off('battle:end', () => {});
  enterCamp();
}
