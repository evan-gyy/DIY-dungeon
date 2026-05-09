// ============================================================
//  src/screens/SandboxCharCreate.ts — 沙盒模式角色创建
// ============================================================

import type { CharId, PlayerState } from '../data/types';
import type { SandboxOrigin } from '../data/sandbox/sandboxTypes';
import { ORIGIN_CONFIG } from '../data/sandbox/sandboxTypes';
import { setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { DEFAULT_INVENTORY } from '../data/items';
import { showToast } from '../ui/toast';
import { showScreen } from './ScreenManager';
import { initSandboxNpcDatabase } from '../systems/NpcBehavior';

let _pendingSlot: number | null = null;
let _charId: CharId | null = null;
let _origin: SandboxOrigin = 'street_kid';

export function setSandboxPendingSlot(slot: number): void {
  _pendingSlot = slot;
}

export function renderSandboxCreateScreen(): void {
  _charId = null;
  _origin = 'street_kid';

  const chars: Array<{ id: CharId; label: string; img: string }> = [
    { id: 'male_good',   label: '男·正派', img: 'picture/maincharacter/male_good.png' },
    { id: 'male_evil',   label: '男·邪派', img: 'picture/maincharacter/male_evil.png' },
    { id: 'female_good', label: '女·正派', img: 'picture/maincharacter/female_good.png' },
    { id: 'female_evil', label: '女·邪派', img: 'picture/maincharacter/female_evil.png' },
  ];

  const grid = document.getElementById('sandbox-char-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (const c of chars) {
    const div = document.createElement('div');
    div.className = 'char-card';
    div.dataset['id'] = c.id;
    const fallback = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect fill='%231a1a2e' width='160' height='160'/><text x='80' y='90' text-anchor='middle' fill='%23c9a84c' font-size='14'>${c.label}</text></svg>`;
    div.innerHTML = `
      <span class="selected-badge">已选</span>
      <img src="${c.img}" alt="${c.label}" onerror="this.src='${fallback}'">
      <div class="char-label">${c.label}</div>
    `;
    div.addEventListener('click', () => {
      grid.querySelectorAll('.char-card').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
      _charId = c.id;
    });
    grid.appendChild(div);
  }

  renderOriginSelect();
}

function renderOriginSelect(): void {
  const container = document.getElementById('sandbox-origin-grid');
  if (!container) return;
  container.innerHTML = '';

  const origins = Object.entries(ORIGIN_CONFIG) as Array<[SandboxOrigin, typeof ORIGIN_CONFIG[SandboxOrigin]]>;

  for (const [id, cfg] of origins) {
    const div = document.createElement('div');
    div.className = 'sandbox-origin-card' + (id === _origin ? ' selected' : '');
    div.innerHTML = `
      <div class="origin-icon">${cfg.icon}</div>
      <div class="origin-info">
        <div class="origin-label">${cfg.label}</div>
        <div class="origin-desc">${cfg.desc}</div>
      </div>
    `;
    div.addEventListener('click', () => {
      _origin = id;
      container.querySelectorAll('.sandbox-origin-card').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
    });
    container.appendChild(div);
  }
}

export function confirmSandboxCreate(): void {
  const nameInput = document.getElementById('sandbox-name-input') as HTMLInputElement | null;
  const name = nameInput?.value.trim() ?? '';
  if (!name) { showToast('请先输入角色名字'); return; }
  if (!_charId) { showToast('请选择角色立绘'); return; }
  if (_pendingSlot === null) { showToast('存档槽异常，请重新选择'); return; }

  const origin = ORIGIN_CONFIG[_origin];

  const player: PlayerState = {
    name,
    charId: _charId,
    charImg: `picture/maincharacter/${_charId}.png`,
    sect: 'none',
    hp: 80 + origin.bonusHp,
    maxHp: 80 + origin.bonusHp,
    mp: 20,
    maxMp: 20,
    atk: 8 + origin.bonusAtk,
    def: 4 + origin.bonusDef,
    agi: 5 + origin.bonusAgi,
    crit: 3,
    exp: 0,
    gold: 10 + origin.bonusGold,
    level: 0,
    skills: [],
    equippedSkills: [null, null, null, null] as [null, null, null, null],
    inventory: DEFAULT_INVENTORY.map(i => ({ ...i })),
    cultivationPoints: 0,
    attrBoosts: { hp: 0, atk: 0, def: 0, agi: 0, mp: 0 },
    equippedFabao: { weapon: null, armor: null, accessory: null },
    ownedFabao: [],
    tutorialDone: true,
    chapter: 0,
    act: 0,
    wudangMissionAccepted: false,
    wudangGateCleared: false,
    wudangMidCleared: false,
    wudangElderCleared: false,
    chapter2Route: '' as const,
    chapter3Breakthrough: false,
    master: '',
    blackmoonToken: false,
    luChenzhouRespect: 0,
    songZhiyuanGrowth: false,
    liuQinghanEngaged: false,
    trialChampion: false,
    trueDisciple: false,
    blackmoonMissionStarted: false,
    currentLocationId: 'linan_capital',
    playerTalent: 'dragon_vein',
    gameMode: 'sandbox',
    sandboxOrigin: _origin,
    sandboxData: {
      time: { year: 1208, month: 1, day: 1, hourSlot: 0, season: 'spring' },
      wulinReputation: { jianghuFame: 0, sectStanding: {}, alignment: 0 },
      courtReputation: { courtRank: 0, influence: 0, intelligence: 0 },
      identityProgress: 0,
      completedEvents: [],
      actionLog: [],
    },
    npcDatabase: initSandboxNpcDatabase(),
    _slot: _pendingSlot,
  };

  setPlayer(player);
  saveGame(player, _pendingSlot);
  showToast(`${name}，临安城的故事开始了！`);

  import('./SandboxHub').then(m => m.enterSandbox());
}
