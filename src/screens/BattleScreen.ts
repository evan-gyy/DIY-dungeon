import { getPlayer } from '../state/GameState';
import { SKILLS } from '../data/skills';
import { ITEMS } from '../data/items';
import { bus } from '../ui/events';
import { showScreen } from './ScreenManager';
import { enterCamp, switchCampTab } from './Camp';
import { renderAttrPanel } from './camp/AttrPanel';
import { checkLevelUp } from '../state/LevelSystem';
import {
  getBattleContext, getCurrentUnit, getTargetableEnemies,
  playerUseSkill, playerBasicAttack, useHpPotion,
} from '../systems/BattleEngine';
import { predictNextAction } from '../systems/EnemyAI';
import type { SkillId, StatusType, StatusEffect, BattleUnit, BattleEnemyUnit } from '../data/types';

const STATUS_ICONS: Partial<Record<StatusType, string>> = {
  stun: '😵眩晕', knockback: '💥击飞', poison: '☠️毒', strong_poison: '☠️剧毒',
  weaken_def: '🔻减防', buff_atk: '⚔️攻强', def_boost: '🛡️防强', evade: '🌀闪',
  regen_mp: '💧回蓝', regen_mp_pct: '♟️心经',
};

let _selectedTargetId: string | null = null;
let _selectedSkillId: SkillId | null = null;

/** 获取单位的状态效果列表 */
function getUnitStatuses(unitId: string, side: 'ally' | 'enemy'): StatusEffect[] {
  const ctx = getBattleContext();
  if (!ctx) return [];
  const map = side === 'ally' ? ctx.allyStatuses : ctx.enemyStatuses;
  return map[unitId] ?? [];
}

export function initBattleScreen(): void {
  bus.on('battle:started', ({ allies, enemies, teamBattle }) => {
    showScreen('battle');
    _selectedTargetId = null;
    _selectedSkillId = null;

    document.getElementById('battle-result-overlay')?.classList.add('hidden');
    const logEl = document.getElementById('battle-log');
    if (logEl) logEl.innerHTML = '';

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

// ── 渲染战场HUD ──
function renderBattleHUD(): void {
  const ctx = getBattleContext();
  if (!ctx) return;

  // 渲染我方单位
  const allyContainer = document.getElementById('battle-allies');
  if (allyContainer) {
    allyContainer.innerHTML = ctx.allies.filter(u => u.alive).map((unit, i) => {
      const hpPct = Math.max(0, unit.hp / unit.maxHp * 100);
      const mpPct = unit.maxMp > 0 ? Math.max(0, unit.mp / unit.maxMp * 100) : 0;
      const isCurrent = ctx.turnOrder[ctx.currentUnitIndex]?.id === unit.id;
      const borderClass = isCurrent ? 'battle-unit-current' : '';
      const imgSrc = unit.charImg || unit.icon || '';
      const statuses = getUnitStatuses(unit.id, 'ally');
      const statusBadges = statuses.length > 0
        ? `<div class="battle-unit-statuses">${statuses.map(s => {
            const icon = STATUS_ICONS[s.type] ?? s.type;
            return `<span class="battle-unit-status-badge" title="${icon} 剩余${s.duration}回合">${icon}</span>`;
          }).join('')}</div>`
        : '';
      return `
        <div class="battle-unit-card ally-card ${borderClass}" data-unit-id="${unit.id}">
          <div class="battle-unit-avatar">
            ${unit.charImg ? `<img src="${imgSrc}" alt="${unit.name}" onerror="this.style.display='none'">` : `<span class="battle-unit-icon">${unit.icon || '👤'}</span>`}
          </div>
          <div class="battle-unit-info">
            <div class="battle-unit-name">${unit.name}${unit.isPlayer ? ' ⭐' : ''}</div>
            <div class="battle-unit-hp-bar"><div class="battle-unit-hp-fill ally-hp" style="width:${hpPct}%"></div></div>
            <div class="battle-unit-hp-text">HP: ${Math.max(0, unit.hp)}/${unit.maxHp}</div>
            ${unit.maxMp > 0 ? `
              <div class="battle-unit-mp-bar"><div class="battle-unit-mp-fill" style="width:${mpPct}%"></div></div>
              <div class="battle-unit-mp-text">MP: ${Math.max(0, unit.mp)}/${unit.maxMp}</div>
            ` : ''}
            ${statusBadges}
          </div>
        </div>`;
    }).join('');
  }

  // 渲染敌方单位
  const enemyContainer = document.getElementById('battle-enemies');
  if (enemyContainer) {
    const targetable = getTargetableEnemies();
    enemyContainer.innerHTML = ctx.enemies.filter(u => u.alive).map((unit, i) => {
      const hpPct = Math.max(0, unit.hp / unit.maxHp * 100);
      const isCurrent = ctx.turnOrder[ctx.currentUnitIndex]?.id === unit.id;
      const isTargeted = _selectedTargetId === unit.id;
      const isTargetable = ctx.state === 'player_turn' && targetable.some(e => e.id === unit.id);
      const borderClass = isCurrent ? 'battle-unit-current' : isTargeted ? 'battle-unit-targeted' : '';
      const clickable = isTargetable ? 'battle-unit-clickable' : '';
      const statuses = getUnitStatuses(unit.id, 'enemy');
      const statusBadges = statuses.length > 0
        ? `<div class="battle-unit-statuses">${statuses.map(s => {
            const icon = STATUS_ICONS[s.type] ?? s.type;
            return `<span class="battle-unit-status-badge" title="${icon} 剩余${s.duration}回合">${icon}</span>`;
          }).join('')}</div>`
        : '';
      return `
        <div class="battle-unit-card enemy-card ${borderClass} ${clickable}" data-unit-id="${unit.id}" data-enemy="true">
          <div class="battle-unit-avatar">
            <span class="battle-unit-icon">${unit.icon || '👹'}</span>
          </div>
          <div class="battle-unit-info">
            <div class="battle-unit-name">${unit.name}</div>
            <div class="battle-unit-hp-bar"><div class="battle-unit-hp-fill enemy-hp" style="width:${hpPct}%"></div></div>
            <div class="battle-unit-hp-text">HP: ${Math.max(0, unit.hp)}/${unit.maxHp}</div>
            ${statusBadges}
          </div>
        </div>`;
    }).join('');

    // 绑定点击事件
    enemyContainer.querySelectorAll<HTMLElement>('.battle-unit-clickable').forEach(el => {
      el.addEventListener('click', () => {
        const unitId = el.dataset['unitId'];
        if (unitId) {
          _selectedTargetId = unitId;
          if (_selectedSkillId) {
            playerUseSkill(_selectedSkillId, unitId);
            _selectedSkillId = null;
            _selectedTargetId = null;
          }
          renderBattleHUD();
        }
      });
    });
  }

  // 回合信息
  const setTxt = (id: string, v: string) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  setTxt('battle-round-info', ctx.teamBattle ? `团队战 · 第${ctx.round}回合` : `第 ${ctx.round} 回合`);
}

// ── 渲染技能栏 ──
function renderSkillBar(): void {
  const bar = document.getElementById('skill-bar');
  if (!bar) return;
  const ctx = getBattleContext();
  const player = getPlayer();
  const currentUnit = getCurrentUnit();

  bar.innerHTML = '';

  if (!ctx || ctx.state === 'win' || ctx.state === 'lose') {
    bar.innerHTML = '<div style="color:var(--text-dim);padding:12px;text-align:center;">战斗已结束</div>';
    return;
  }

  const isPlayerTurn = ctx.state === 'player_turn' && currentUnit?.isPlayer;

  // 当前行动单位提示
  const turnInfo = document.createElement('div');
  turnInfo.className = 'skill-bar-turn-info';
  if (isPlayerTurn) {
    turnInfo.textContent = _selectedSkillId
      ? `🎯 已选择技能 — 点击敌方目标释放`
      : '🎯 你的回合 — 选择技能（辅助技能直接释放）';
  } else {
    turnInfo.textContent = `⏳ ${currentUnit?.name ?? '...'} 行动中...`;
  }
  bar.appendChild(turnInfo);

  if (!isPlayerTurn) return;

  // 被动技能
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

  // 普通攻击
  const basicBtn = document.createElement('button');
  basicBtn.className = `skill-btn skill-btn-basic ${_selectedSkillId === null && _selectedTargetId ? 'skill-btn-selected' : ''}`;
  basicBtn.innerHTML = `<span class="skill-btn-icon">👊</span><span class="skill-btn-name">普通攻击</span><span class="skill-btn-mp">0 MP</span>`;
  basicBtn.addEventListener('click', () => {
    _selectedSkillId = null;
    if (_selectedTargetId) {
      playerBasicAttack(_selectedTargetId);
      _selectedTargetId = null;
    }
    renderSkillBar();
    renderBattleHUD();
  });
  bar.appendChild(basicBtn);

  // 装备的技能
  for (const skId of player.equippedSkills) {
    const sk = skId ? SKILLS[skId] : null;
    if (sk?.type === 'passive') continue;
    const btn = document.createElement('button');
    const cd = skId && ctx ? (ctx.skillCooldowns[skId] ?? 0) : 0;
    const noMp = sk && currentUnit ? currentUnit.mp < sk.mp : false;
    const isSelected = _selectedSkillId === skId;
    btn.className = `skill-btn ${!sk ? 'skill-btn-empty' : ''} ${cd > 0 ? 'skill-btn-cd' : ''} ${noMp ? 'skill-btn-nomb' : ''} ${isSelected ? 'skill-btn-selected' : ''}`;
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
      btn.disabled = cd > 0 || noMp;
      btn.title = sk.battleTip || sk.desc;
      if (skId && !cd && !noMp) {
        btn.addEventListener('click', () => {
          // 辅助/自我技能：直接释放，不需要选目标
          if (sk.type === 'support' && sk.target === 'self') {
            playerUseSkill(skId as SkillId);
            _selectedSkillId = null;
            _selectedTargetId = null;
            renderSkillBar();
            renderBattleHUD();
            return;
          }
          // 攻击/控制技能：先选中技能，等待点击目标
          _selectedSkillId = skId as SkillId;
          if (_selectedTargetId) {
            playerUseSkill(skId as SkillId, _selectedTargetId);
            _selectedSkillId = null;
            _selectedTargetId = null;
          }
          renderSkillBar();
          renderBattleHUD();
        });
      }
    }
    bar.appendChild(btn);
  }

  // 药品
  const potionCount = player.inventory.find(i => i.id === 'hp_potion')?.count ?? 0;
  const potionBtn = document.createElement('button');
  potionBtn.className = `skill-btn skill-btn-item ${potionCount === 0 ? 'skill-btn-nomb' : ''}`;
  potionBtn.innerHTML = `<span class="skill-btn-icon">🔴</span><span class="skill-btn-name">服药</span><span class="skill-btn-mp">×${potionCount}</span>`;
  potionBtn.disabled = potionCount === 0;
  potionBtn.addEventListener('click', () => useHpPotion());
  bar.appendChild(potionBtn);

  // 弈理心经预判
  if (ctx?.hasPrevision && ctx.enemies.length > 0 && ctx.state === 'player_turn') {
    const firstEnemy = ctx.enemies.find(e => e.alive);
    if (firstEnemy) {
      const predicted = predictNextAction(firstEnemy);
      const prevDiv = document.createElement('div');
      prevDiv.className = 'skill-btn';
      prevDiv.style.cssText = 'border-color:#8e44ad;opacity:0.85;cursor:default;min-width:110px;';
      prevDiv.innerHTML = `<span class="skill-btn-icon" style="font-size:16px;">👁</span><span class="skill-btn-name" style="font-size:10px;color:#c39bd3;">弈理心经</span><span style="font-size:11px;color:#e8c87a;letter-spacing:1px;">${firstEnemy.icon ?? ''} ${predicted.icon} ${predicted.name}</span>`;
      bar.appendChild(prevDiv);
    }
  }
}

// ── 战斗结果 ──
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