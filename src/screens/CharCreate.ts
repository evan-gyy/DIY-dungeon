import type { CharId, PlayerState } from '../data/types';
import { setPlayer } from '../state/GameState';
import { saveGame } from '../state/SaveSystem';
import { DEFAULT_INVENTORY } from '../data/items';
import { showToast } from '../ui/toast';
import { closeSaveSelect } from './MainMenu';
import { runStoryIntro } from './StoryScreen';

let _pendingSlot: number | null = null;
let _charId: CharId | null = null;

export function setPendingSlot(slot: number): void {
  _pendingSlot = slot;
}

export function renderCreateScreen(): void {
  _charId = null;

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

  const sect = 'wudang' as const;
  // Mortal stats — upgraded to sect stats in finishStoryIntro()
  const player: PlayerState = {
    name,
    charId: _charId,
    charImg: `picture/maincharacter/${_charId}.png`,
    sect,
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
    chapter: 1,
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
    _slot: _pendingSlot,
  };

  setPlayer(player);
  saveGame(player, _pendingSlot);
  showToast(`存档已创建，欢迎，${name}！`);
  closeSaveSelect(false);
  runStoryIntro();
}
