import type { CharId, PlayerState } from '../data/types';
import { setPlayer, getPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { DEFAULT_INVENTORY } from '../data/items';
import { showToast } from '../ui/toast';
import { closeSaveSelect } from './MainMenu';
import { runStoryIntro } from './StoryScreen';
import { showScreen } from './ScreenManager';
import { enterCamp } from './Camp';

let _pendingSlot: number | null = null;
let _charId: CharId | null = null;
let _gameMode: 'story' | 'sandbox' = 'story';

export function setPendingSlot(slot: number): void {
  _pendingSlot = slot;
}

/** 渲染模式选择界面 */
export function renderModeSelect(): void {
  const grid = document.getElementById('char-select-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const title = document.querySelector('.create-title') as HTMLElement | null;
  if (title) title.textContent = '选择游戏模式';

  grid.innerHTML = `
    <div class="mode-card" data-mode="story">
      <div class="mode-icon">📜</div>
      <div class="mode-name">剧情模式</div>
      <div class="mode-desc">跟随章节剧情推进，体验主线故事</div>
    </div>
    <div class="mode-card" data-mode="sandbox">
      <div class="mode-icon">🗺️</div>
      <div class="mode-name">沙盒模式</div>
      <div class="mode-desc">自由探索江湖，经营宗门与庙堂</div>
    </div>
  `;

  grid.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      const mode = (card as HTMLElement).dataset['mode'] as 'story' | 'sandbox';
      _gameMode = mode;
      renderCreateScreen();
    });
  });
}

export function renderCreateScreen(): void {
  _charId = null;

  const title = document.querySelector('.create-title') as HTMLElement | null;
  const modeLabel = _gameMode === 'sandbox' ? '沙盒模式' : '剧情模式';
  if (title) title.textContent = `创建角色 · ${modeLabel}`;

  const chars: Array<{ id: CharId; label: string; img: string }> = [
    { id: 'male_good',   label: '男·正派', img: 'picture/maincharacter/male_good.png' },
    { id: 'male_evil',   label: '男·邪派', img: 'picture/maincharacter/male_evil.png' },
    { id: 'female_good', label: '女·正派', img: 'picture/maincharacter/female_good.png' },
    { id: 'female_evil', label: '女·邪派', img: 'picture/maincharacter/female_evil.png' },
  ];

  const grid = document.getElementById('char-select-grid');
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
}

export function confirmCreate(): void {
  const nameInput = document.getElementById('char-name-input') as HTMLInputElement | null;
  const name = nameInput?.value.trim() ?? '';
  if (!name) { showToast('请先输入角色名字'); return; }
  if (!_charId) { showToast('请选择角色立绘'); return; }
  if (_pendingSlot === null) { showToast('存档槽异常，请重新选择'); return; }

  if (_gameMode === 'sandbox') {
    // ── 沙盒模式：无门无派的自由人起点 ──
    const player: PlayerState = {
      name,
      charId: _charId,
      charImg: `picture/maincharacter/${_charId}.png`,
      sect: 'none',
      gameMode: 'sandbox',
      hp: 80, maxHp: 80, mp: 20, maxMp: 20,
      atk: 8, def: 4, agi: 5, crit: 3,
      exp: 0, gold: 50, level: 0,
      skills: ['yi_li_xin_jing' as const],
      equippedSkills: [null, null, null, null] as [null, null, null, null],
      inventory: DEFAULT_INVENTORY.map(i => ({ ...i })),
      cultivationPoints: 0,
      attrBoosts: { hp: 0, atk: 0, def: 0, agi: 0, mp: 0 },
      equippedFabao: { weapon: null, armor: null, accessory: null },
      ownedFabao: [],
      tutorialDone: false,
      chapter: 1, act: 0,
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
      sectContribution: 0, contributionLog: [],
      completedTrials: [] as string[],
      reputation: 0,
      realmBreakUnlocked: [] as string[],
      discipleRank: 'outer' as string,
      courtRank: 'commoner' as string,
      npcCollection: {
        recruited: [] as string[],
        maxSlots: 0,
        assignments: {} as Record<string, string>,
        assignmentTargets: {} as Record<string, string>,
      },
      activeMissions: [] as Array<{ defId: string; status: string; acceptedAt: number; progress: number; progressMax: number }>,
      factionRelations: {} as Record<string, Record<string, { relation: string; trust: number; lastEvent?: string; lastEventTurn?: number }>>,
      diplomacyTickCounter: 0,
      npcAffection: {} as Record<string, number>,
      currentLocationId: 'kaifeng_city', // 沙盒起点：东京汴梁
      playerTalent: 'dragon_vein',
      _slot: _pendingSlot,
      courtStats: { strategy: 10, eloquence: 10, charisma: 10, scholarship: 10 },
      influence: 0,
      courtPath: null,
      lastActionType: 'idle',
    };

    setPlayer(player);
    saveGame(player, _pendingSlot);
    showToast(`存档已创建，${name}踏入江湖！`);
    closeSaveSelect(false);

    // 升级为炼气一层，直接进入开放世界
    import('../data/realmConfig').then(({ calculateFinalStats }) => {
      const newStats = calculateFinalStats(1, [player.playerTalent]);
      const updated = {
        ...player,
        hp: newStats.hp, maxHp: newStats.hp,
        mp: newStats.mp, maxMp: newStats.mp,
        atk: newStats.atk, def: newStats.def, agi: newStats.agi, crit: newStats.crit,
        level: 1, exp: 0,
        chapter: 2,  // 沙盒不使用章节系统，直接解锁日常修行
        tutorialDone: true,
      };
      setPlayer(updated);
      saveGame(updated);
      enterCamp();
    });
  } else {
    // ── 剧情模式：原有流程 ──
    const sect = 'wudang' as const;
    const player: PlayerState = {
      name,
      charId: _charId,
      charImg: `picture/maincharacter/${_charId}.png`,
      sect,
      gameMode: 'story',
      hp: 80, maxHp: 80, mp: 20, maxMp: 20,
      atk: 8, def: 4, agi: 5, crit: 3,
      exp: 0, gold: 10, level: 0,
      skills: ['yi_li_xin_jing' as const],
      equippedSkills: [null, null, null, null] as [null, null, null, null],
      inventory: DEFAULT_INVENTORY.map(i => ({ ...i })),
      cultivationPoints: 0,
      attrBoosts: { hp: 0, atk: 0, def: 0, agi: 0, mp: 0 },
      equippedFabao: { weapon: null, armor: null, accessory: null },
      ownedFabao: [],
      tutorialDone: false,
      chapter: 1, act: 0,
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
      sectContribution: 0, contributionLog: [],
      completedTrials: [] as string[],
      reputation: 0,
      realmBreakUnlocked: [] as string[],
      discipleRank: 'outer' as string,
      courtRank: 'commoner' as string,
      npcCollection: {
        recruited: [] as string[],
        maxSlots: 0,
        assignments: {} as Record<string, string>,
        assignmentTargets: {} as Record<string, string>,
      },
      activeMissions: [] as Array<{ defId: string; status: string; acceptedAt: number; progress: number; progressMax: number }>,
      factionRelations: {} as Record<string, Record<string, { relation: string; trust: number; lastEvent?: string; lastEventTurn?: number }>>,
      diplomacyTickCounter: 0,
      npcAffection: {} as Record<string, number>,
      currentLocationId: 'wudang_mountain',
      playerTalent: 'dragon_vein',
      _slot: _pendingSlot,
      courtStats: { strategy: 10, eloquence: 10, charisma: 10, scholarship: 10 },
      influence: 0,
      courtPath: null,
      lastActionType: 'idle',
    };
    setPlayer(player);
    saveGame(player, _pendingSlot);
    showToast(`存档已创建，欢迎，${name}！`);
    closeSaveSelect(false);
    runStoryIntro();
  }
}
