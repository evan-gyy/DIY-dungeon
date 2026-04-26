import { getPlayer } from '../state/GameState';
import { SKILLS } from '../data/skills';
import { ITEMS } from '../data/items';
import { bus } from '../ui/events';
import { showScreen } from './ScreenManager';
import { enterCamp, switchCampTab } from './Camp';
import { renderAttrPanel } from './camp/AttrPanel';
import { checkLevelUp } from '../state/LevelSystem';
import {
  getBattleContext,
  playerUseSkill, playerBasicAttack, useHpPotion,
} from '../systems/BattleEngine';
import { predictNextAction } from '../systems/EnemyAI';
import type { SkillId, StatusType } from '../data/types';

const STATUS_ICONS: Partial<Record<StatusType, string>> = {
  stun: '😵眩晕', knockback: '💥击飞', poison: '☠️毒', strong_poison: '☠️剧毒',
  weaken_def: '🔻减防', buff_atk: '⚔️攻强', def_boost: '🛡️防强', evade: '🌀闪',
  regen_mp: '💧回蓝', regen_mp_pct: '♟️心经',
};

export function initBattleScreen(): void {
  bus.on('battle:started', ({ playerName, playerImg, enemyName, enemyIcon, enemyTier }) => {
    showScreen('battle');

    const setTxt = (id: string, v: string) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    const tierLabels = ['', '江湖喽啰', '武林好手', '一流高手'];
    setTxt('battle-enemy-name', enemyName);
    setTxt('battle-enemy-icon', enemyIcon);
    setTxt('battle-enemy-tier', tierLabels[enemyTier] ?? '');
    setTxt('battle-player-name', playerName);

    const playerImg_el = document.getElementById('battle-player-img') as HTMLImageElement | null;
    if (playerImg_el) playerImg_el.src = playerImg;

    const logEl = document.getElementById('battle-log');
    if (logEl) logEl.innerHTML = '';

    document.getElementById('battle-result-overlay')?.classList.add('hidden');

    renderBattleHUD();
    renderSkillBar();
  });

  bus.on('battle:log-add', ({ html }) => {
    const logEl = document.getElementById('battle-log');
    if (!logEl) return;
    const div = document.createElement('div');
    div.className = 'battle-log-entry';
    div.innerHTML = html;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  });

  bus.on('battle:updated', () => {
    renderBattleHUD();
    renderSkillBar();
  });

  bus.on('battle:end', ({ result, expGain, goldGain, loot }) => {
    showBattleResult(result, expGain, goldGain, loot);
  });
}

function renderBattleHUD(): void {
  const ctx = getBattleContext();
  if (!ctx) return;
  const { player: p, enemy: e } = ctx;

  const setBar = (id: string, pct: number) => {
    const el = document.getElementById(id) as HTMLElement | null;
    if (el) el.style.width = Math.max(0, pct) + '%';
  };
  const setTxt = (id: string, v: string) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  setBar('battle-player-hp-bar', p.hp / p.maxHp * 100);
  setTxt('battle-player-hp-val', `${Math.max(0, p.hp)} / ${p.maxHp}`);
  setBar('battle-player-mp-bar', p.mp / p.maxMp * 100);
  setTxt('battle-player-mp-val', `${Math.max(0, p.mp)} / ${p.maxMp}`);
  setBar('battle-enemy-hp-bar', e.hp / e.maxHp * 100);
  setTxt('battle-enemy-hp-val', `${Math.max(0, e.hp)} / ${e.maxHp}`);

  renderStatusBadges('battle-player-status', ctx.playerStatus.map(s => s.type));
  renderStatusBadges('battle-enemy-status', ctx.enemyStatus.map(s => s.type));
}

function renderStatusBadges(containerId: string, types: StatusType[]): void {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = types.map(t => `<span class="status-badge">${STATUS_ICONS[t] ?? t}</span>`).join('');
}

function renderSkillBar(): void {
  const bar = document.getElementById('skill-bar');
  if (!bar) return;
  const ctx = getBattleContext();
  const player = getPlayer();

  bar.innerHTML = '';

  // passive skills shown at left (always active)
  const passives = player.skills.filter(id => SKILLS[id]?.type === 'passive');
  for (const skId of passives) {
    const sk = SKILLS[skId];
    if (!sk) continue;
    const btn = document.createElement('button');
    btn.className = 'skill-btn skill-btn-passive';
    btn.innerHTML = `<span class="skill-btn-icon">${sk.icon}</span><span class="skill-btn-name">${sk.name}</span><span class="skill-btn-mp">被动</span>`;
    btn.disabled = true;
    btn.title = sk.battleTip || sk.desc;
    bar.appendChild(btn);
  }

  // basic attack
  const basicBtn = document.createElement('button');
  basicBtn.className = 'skill-btn skill-btn-basic';
  basicBtn.innerHTML = `<span class="skill-btn-icon">👊</span><span class="skill-btn-name">普通攻击</span><span class="skill-btn-mp">0 MP</span>`;
  basicBtn.disabled = ctx?.state !== 'player_turn';
  basicBtn.addEventListener('click', () => playerBasicAttack());
  bar.appendChild(basicBtn);

  // equipped skills
  for (const skId of player.equippedSkills) {
    const sk = skId ? SKILLS[skId] : null;
    if (sk?.type === 'passive') continue;
    const btn = document.createElement('button');
    const cd = skId && ctx ? (ctx.skillCooldowns[skId] ?? 0) : 0;
    const noMp = sk && ctx ? ctx.player.mp < sk.mp : false;
    const disabled = !sk || cd > 0 || noMp || ctx?.state !== 'player_turn';
    btn.className = `skill-btn ${!sk ? 'skill-btn-empty' : ''} ${cd > 0 ? 'skill-btn-cd' : ''} ${noMp ? 'skill-btn-nomb' : ''}`;
    if (!sk) {
      btn.innerHTML = `<span class="skill-btn-icon">—</span><span class="skill-btn-name">空槽</span>`;
      btn.disabled = true;
    } else {
      btn.innerHTML = `
        <span class="skill-btn-icon">${sk.icon}</span>
        <span class="skill-btn-name">${sk.name}</span>
        <span class="skill-btn-mp">${sk.mp} MP</span>
        ${cd > 0 ? `<span class="skill-btn-cd-overlay">CD:${cd}</span>` : ''}
      `;
      btn.disabled = disabled;
      btn.title = sk.battleTip || sk.desc;
      if (skId) btn.addEventListener('click', () => playerUseSkill(skId as SkillId));
    }
    bar.appendChild(btn);
  }

  // hp potion
  const potionCount = player.inventory.find(i => i.id === 'hp_potion')?.count ?? 0;
  const potionBtn = document.createElement('button');
  potionBtn.className = `skill-btn skill-btn-item ${potionCount === 0 ? 'skill-btn-nomb' : ''}`;
  potionBtn.innerHTML = `<span class="skill-btn-icon">🔴</span><span class="skill-btn-name">服药</span><span class="skill-btn-mp">×${potionCount}</span>`;
  potionBtn.disabled = potionCount === 0 || ctx?.state !== 'player_turn';
  potionBtn.addEventListener('click', () => useHpPotion());
  bar.appendChild(potionBtn);

  // prevision hint (弈理心经)
  if (ctx?.hasPrevision && ctx.enemy && ctx.state === 'player_turn') {
    const predicted = predictNextAction(ctx.enemy);
    const prevDiv = document.createElement('div');
    prevDiv.className = 'skill-btn';
    prevDiv.style.cssText = 'border-color:#8e44ad;opacity:0.85;cursor:default;min-width:110px;';
    prevDiv.innerHTML = `<span class="skill-btn-icon" style="font-size:16px;">👁</span><span class="skill-btn-name" style="font-size:10px;color:#c39bd3;">弈理心经</span><span style="font-size:11px;color:#e8c87a;letter-spacing:1px;">${ctx.enemy.icon ?? ''} ${predicted.icon} ${predicted.name}</span>`;
    bar.appendChild(prevDiv);
  }
}

function showBattleResult(result: 'win' | 'lose', expGain: number, goldGain: number, loot: string[]): void {
  const overlay = document.getElementById('battle-result-overlay');
  const title   = document.getElementById('battle-result-title');
  const detail  = document.getElementById('battle-result-detail');
  const btn     = document.getElementById('battle-result-btn');
  if (!overlay || !title || !detail || !btn) return;

  overlay.classList.remove('hidden');

  if (result === 'win') {
    title.textContent = '胜利！';
    (title as HTMLElement).style.color = '#e8c87a';
    const lootDesc = loot.length > 0
      ? loot.map(id => ITEMS[id as keyof typeof ITEMS]?.name ?? id).join('、')
      : '无';
    detail.innerHTML = `
      获得经验：<span style="color:#e8c87a">+${expGain}</span><br>
      获得金两：<span style="color:#e8c87a">+${goldGain}</span><br>
      战利品：${lootDesc}
    `;
    btn.textContent = '返回营地';
  } else {
    title.textContent = '落败…';
    (title as HTMLElement).style.color = '#e74c3c';
    detail.innerHTML = `气血告罄，侥幸逃得性命。<br>气血剩余 1 点，内力耗尽，速速回营地调养。`;
    btn.textContent = '回营地休整';
  }

  const newBtn = btn.cloneNode(true) as HTMLElement;
  btn.parentNode?.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    enterCamp();
    const p = getPlayer();
    const lvResult = checkLevelUp(p);
    if (lvResult.leveled) {
      const content = document.getElementById('camp-content');
      if (content) renderAttrPanel(content);
    } else {
      switchCampTab('story');
    }
  });
}
