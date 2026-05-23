// ============================================================
//  src/screens/camp/SectLeaderPanel.ts — 掌门管理模式
// ============================================================
//  当玩家是掌门时，提供门派管理界面：
//  - 资源调配（资源→稳定度/繁荣度转换）
//  - 招生（消耗资源招募新弟子 NPC）
//  - 外交操作（宣战/停战/结盟）
// ============================================================

import type { SectId } from '../../data/types';
import type { LocationId } from '../../data/worldMap';
import type { NpcStats } from '../../data/npcStats';
import { getRandomInitialAge, getMaxAgeForLevel } from '../../data/npcStats';
import { SECTS } from '../../data/sects';
import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { getSectState, updateSectState, computeSectPower, getSectLeaderId } from '../../systems/SectManagement';
import { calculateFinalStats } from '../../data/realmConfig';
import { showToast } from '../../ui/toast';
import { renderSidebar } from '../Camp';

// ──── NPC 名字池 ────

const FIRST_NAMES = ['子', '明', '清风', '云', '羽', '青', '白', '玄', '灵', '若', '寒', '雨', '霜', '月', '飞', '落', '尘', '修', '逸', '远', '无', '道', '剑', '峰', '岳', '河', '山', '松', '柏', '鹤', '龙', '虎', '凤', '麟'];
const LAST_NAMES = ['', '子', '生', '客', '真人', '道人', '居士', '散人', '侠'];

function genNpcName(): string {
  const a = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]!;
  const b = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]!;
  const suffix = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]!;
  return a + b + suffix;
}

function genNpcId(): string {
  return 'recruit_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

// ──── 入口 ────

export function renderSectLeaderPanel(container: HTMLElement): void {
  const p = getPlayer();
  if (p.discipleRank !== 'leader') {
    container.innerHTML = `<div class="panel-empty">只有掌门才能查看此页面。</div>`;
    return;
  }

  const sect = p.sect as SectId;
  if (sect === 'none') {
    container.innerHTML = `<div class="panel-empty">无门无派的掌门？不可思议。</div>`;
    return;
  }

  const state = getSectState(sect);
  const sectName = SECTS[sect]?.name ?? sect;
  const power = computeSectPower(sect);
  const db = p.npcDatabase ?? {};
  const memberCount = Object.values(db).filter((n: NpcStats) => n.sect === sect).length;

  container.innerHTML = `
    <div class="leader-panel">
      <div class="leader-header">
        <div class="leader-title">🏯 ${sectName} · 掌门大殿</div>
        <div class="leader-rank">👑 掌门 · 执掌宗门</div>
      </div>

      <div class="leader-stats-grid">
        <div class="leader-stat-card">
          <div class="leader-stat-icon">💎</div>
          <div class="leader-stat-label">资源储备</div>
          <div class="leader-stat-value" id="sect-resources">${state.resources}</div>
        </div>
        <div class="leader-stat-card">
          <div class="leader-stat-icon">⚖️</div>
          <div class="leader-stat-label">门派稳定</div>
          <div class="leader-stat-value" id="sect-stability">${state.stability}</div>
        </div>
        <div class="leader-stat-card">
          <div class="leader-stat-icon">📈</div>
          <div class="leader-stat-label">繁荣度</div>
          <div class="leader-stat-value" id="sect-prosperity">${state.prosperity ?? 30}</div>
        </div>
        <div class="leader-stat-card">
          <div class="leader-stat-icon">⚔️</div>
          <div class="leader-stat-label">势力力量</div>
          <div class="leader-stat-value">${power}</div>
        </div>
        <div class="leader-stat-card">
          <div class="leader-stat-icon">👥</div>
          <div class="leader-stat-label">门人数量</div>
          <div class="leader-stat-value">${memberCount}</div>
        </div>
      </div>

      <div class="leader-section">
        <div class="leader-section-title">📋 资源调配</div>
        <div class="leader-section-desc">消耗资源以提升门派稳定度或繁荣度</div>
        <div class="leader-action-row">
          <button class="btn leader-btn" data-leader-action="boost-stability">
            🛡️ 整肃内务<br><small>消耗 100 资源 → 稳定度 +15~25</small>
          </button>
          <button class="btn leader-btn" data-leader-action="boost-prosperity">
            🏗️ 发展门派<br><small>消耗 100 资源 → 繁荣度 +15~25</small>
          </button>
          <button class="btn leader-btn" data-leader-action="train-disciples">
            🎯 集中练兵<br><small>消耗 80 资源 → 门人等级+2 (随机3名)</small>
          </button>
        </div>
      </div>

      <div class="leader-section">
        <div class="leader-section-title">👤 招生纳贤</div>
        <div class="leader-section-desc">消耗资源招募新弟子，壮大宗门</div>
        <div class="leader-action-row">
          <button class="btn leader-btn" data-leader-action="recruit-outer">
            🌱 招募外门弟子<br><small>消耗 50 资源 → 1~2 名外门弟子</small>
          </button>
          <button class="btn leader-btn" data-leader-action="recruit-elite">
            ⭐ 招揽江湖高手<br><small>消耗 200 资源 → 1 名内门以上高手</small>
          </button>
          <button class="btn leader-btn" data-leader-action="recruit-disciple">
            📢 广发英雄帖<br><small>消耗 350 资源 → 2~3 名随机人才</small>
          </button>
        </div>
      </div>

      <div class="leader-section">
        <div class="leader-section-title">🌍 外交决策</div>
        <div class="leader-section-desc">以掌门之名决定对外方略</div>
        <div class="leader-action-row">
          <button class="btn leader-btn" data-leader-action="declare-war">
            ⚔️ 宣战<br><small>向一敌对势力宣战，降低关系</small>
          </button>
          <button class="btn leader-btn" data-leader-action="offer-peace">
            🕊️ 求和<br><small>向敌对势力求和，消耗资源</small>
          </button>
          <button class="btn leader-btn" data-leader-action="propose-alliance">
            🤝 结盟<br><small>与友好势力结盟，共同进退</small>
          </button>
        </div>
      </div>
    </div>
  `;

  bindLeaderActions(container, sect);
}

// ──── 事件绑定 ────

function bindLeaderActions(container: HTMLElement, sect: SectId): void {
  container.querySelectorAll<HTMLButtonElement>('[data-leader-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset['leaderAction']!;
      handleLeaderAction(action, sect);
    });
  });
}

// ──── 行动处理 ────

function handleLeaderAction(action: string, sect: SectId): void {
  const state = getSectState(sect);

  switch (action) {
    case 'boost-stability': {
      if (state.resources < 100) { showToast('资源不足（需要 100）。'); return; }
      const gain = 15 + Math.floor(Math.random() * 11);
      updateSectState(sect, { resources: -100, stability: gain });
      saveGame(getPlayer());
      showToast(`🛡️ 整肃内务完毕，稳定度 +${gain}！`);
      refreshPanel();
      break;
    }
    case 'boost-prosperity': {
      if (state.resources < 100) { showToast('资源不足（需要 100）。'); return; }
      const gain = 15 + Math.floor(Math.random() * 11);
      updateSectState(sect, { resources: -100, prosperity: gain });
      saveGame(getPlayer());
      showToast(`🏗️ 发展门派完毕，繁荣度 +${gain}！`);
      refreshPanel();
      break;
    }
    case 'train-disciples': {
      if (state.resources < 80) { showToast('资源不足（需要 80）。'); return; }
      updateSectState(sect, { resources: -80 });
      const p = getPlayer();
      const db = { ...(p.npcDatabase ?? {}) };
      const sectNpcs = Object.values(db).filter((n: NpcStats) => n.sect === sect);
      const chosen = sectNpcs.sort(() => Math.random() - 0.5).slice(0, 3);
      const names: string[] = [];
      for (const npc of chosen) {
        db[npc.id] = { ...npc, level: npc.level + 2 };
        names.push(npc.name);
      }
      setPlayer({ ...p, npcDatabase: db });
      saveGame(getPlayer());
      showToast(`🎯 集中练兵完成：${names.join('、')} 等级 +2！`);
      refreshPanel();
      break;
    }
    case 'recruit-outer': {
      if (state.resources < 50) { showToast('资源不足（需要 50）。'); return; }
      updateSectState(sect, { resources: -50 });
      recruitNpcs(sect, 1 + Math.floor(Math.random() * 2), 'outer');
      break;
    }
    case 'recruit-elite': {
      if (state.resources < 200) { showToast('资源不足（需要 200）。'); return; }
      updateSectState(sect, { resources: -200 });
      recruitNpcs(sect, 1, 'inner');
      break;
    }
    case 'recruit-disciple': {
      if (state.resources < 350) { showToast('资源不足（需要 350）。'); return; }
      updateSectState(sect, { resources: -350 });
      const count = 2 + Math.floor(Math.random() * 2);
      recruitNpcs(sect, count, 'random');
      break;
    }
    case 'declare-war':
      handleDiplomacyAction(sect, 'war');
      break;
    case 'offer-peace':
      handleDiplomacyAction(sect, 'peace');
      break;
    case 'propose-alliance':
      handleDiplomacyAction(sect, 'alliance');
      break;
  }
}

// ──── 招募 NPC ────

function recruitNpcs(sect: SectId, count: number, minRank: string): void {
  const p = getPlayer();
  const db = { ...(p.npcDatabase ?? {}) };
  const names: string[] = [];

  for (let i = 0; i < count; i++) {
    const level = minRank === 'inner' ? 15 + Math.floor(Math.random() * 16)
      : minRank === 'outer' ? 5 + Math.floor(Math.random() * 11)
      : 5 + Math.floor(Math.random() * 21);
    const stats = calculateFinalStats(level, []);

    const npcId = genNpcId();
    const npc: NpcStats = {
      id: npcId,
      name: genNpcName(),
      sect,
      level,
      exp: 0,
      hp: stats.hp, maxHp: stats.hp,
      mp: stats.mp, maxMp: stats.mp,
      atk: stats.atk, def: stats.def, agi: stats.agi, crit: stats.crit,
      skills: [],
      equippedFabao: { weapon: null, armor: null, accessory: null },
      ownedFabao: [],
      currentLocationId: sectBaseLocation(sect),
      discipleRank: minRank === 'random'
        ? (Math.random() < 0.7 ? 'outer' : 'inner') as any
        : (minRank as any),
      courtRank: 'commoner' as any,
      personality: (['aloof', 'kind', 'cunning', 'upright', 'gentle', 'bold'] as const)[
        Math.floor(Math.random() * 6)
      ]!,
      courtStats: { strategy: 5, eloquence: 5, charisma: 5, scholarship: 5 },
      influence: 0,
      courtPath: null,
      gender: Math.random() < 0.5 ? 'male' : 'female',
      ambition: 'content',
      recentLog: [],
      age: getRandomInitialAge(level),
      maxAge: getMaxAgeForLevel(level),
      isAlive: true,
    };
    db[npcId] = npc;
    names.push(npc.name);
  }

  setPlayer({ ...p, npcDatabase: db });
  saveGame(getPlayer());
  showToast(`👤 招募完成：${names.join('、')} 加入本门！`);
  refreshPanel();
  renderSidebar();
}

function sectBaseLocation(sect: SectId): LocationId {
  const bases: Record<string, string> = {
    wudang: 'wudang_mountain', shaolin: 'shaolin_temple', emei: 'emei_mountain',
    beggar: 'beggar_hq', maoshan: 'maoshan_daoyuan', kunlun: 'kunlun_mountain',
    qingcheng: 'qingcheng_mountain', tangmen: 'tangmen_estate', xiaoyao: 'xiaoyao_valley',
    quanzhen: 'zhongnan_mountain', kongtong: 'kongtong_mountain', diancang: 'diancang_mountain',
    huashan: 'huashan_base', riyue: 'heimu_cliff',
    demon: 'heimu_cliff', tiezhang: 'chongqing_city', wudu: 'dali_city',
    xuedao: 'liangzhou_city', haisha: 'mingzhou_city',
  };
  return (bases[sect] ?? 'kaifeng_city') as LocationId;
}

// ──── 外交操作 ────

function handleDiplomacyAction(sect: SectId, type: 'war' | 'peace' | 'alliance'): void {
  const p = getPlayer();
  const relations = { ...(p.factionRelations ?? {}) };
  const playerKey = sect as string;

  if (!relations[playerKey]) relations[playerKey] = {};

  const actionLabel = type === 'war' ? '向谁宣战？' : type === 'peace' ? '向谁求和？' : '与谁结盟？';
  const actionIcon = type === 'war' ? '⚔️' : type === 'peace' ? '🕊️' : '🤝';

  const allSects = Object.entries(SECTS)
    .filter(([id]) => id !== 'none' && id !== sect && id !== 'imperial_court');

  let targetList = '';
  for (const [sectId, sectData] of allSects) {
    const currentRel = relations[playerKey]?.[sectId];
    const trust = currentRel?.trust ?? 50;
    const relLabel = currentRel?.relation ?? 'neutral';

    if (type === 'peace') {
      if (relLabel !== 'hostile' && relLabel !== 'war') continue;
    }
    if (type === 'alliance') {
      if (trust < 30) continue;
    }

    targetList += `
      <div class="diplomacy-target" data-target="${sectId}" style="padding:8px 14px;margin:4px;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
        <span>${sectData.name}</span>
        <span style="font-size:10px;color:var(--text-dim);">信任: ${trust} · ${relLabel}</span>
      </div>`;
  }

  const overlay = document.createElement('div');
  overlay.className = 'career-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div class="career-dialog" style="max-width:500px;">
      <div class="career-title">${actionIcon} ${actionLabel}</div>
      <div style="max-height:300px;overflow-y:auto;">${targetList || '<div style="padding:20px;text-align:center;color:var(--text-dim);">没有可用目标</div>'}</div>
      <button class="btn" id="diplomacy-cancel" style="margin-top:12px;width:100%;">取消</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#diplomacy-cancel')?.addEventListener('click', () => overlay.remove());
  overlay.querySelectorAll('.diplomacy-target').forEach(el => {
    el.addEventListener('click', () => {
      const targetSect = (el as HTMLElement).dataset['target']!;
      executeDiplomacy(sect, targetSect as SectId, type);
      overlay.remove();
    });
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function executeDiplomacy(playerSect: SectId, targetSect: SectId, type: 'war' | 'peace' | 'alliance'): void {
  const p = getPlayer();
  const relations = { ...(p.factionRelations ?? {}) };
  const playerKey = playerSect as string;
  const targetKey = targetSect as string;

  if (!relations[playerKey]) relations[playerKey] = {};
  if (!relations[targetKey]) relations[targetKey] = {};

  const targetName = SECTS[targetSect]?.name ?? targetSect;

  switch (type) {
    case 'war':
      relations[playerKey]![targetKey] = { relation: 'war', trust: 0 };
      relations[targetKey]![playerKey] = { relation: 'war', trust: 0, lastEvent: '宣战' };
      showToast(`⚔️ 向${targetName}宣战！全面战争！`);
      break;
    case 'peace': {
      const cost = 150;
      const state = getSectState(playerSect);
      if (state.resources < cost) { showToast('资源不足，无法求和（需要 150）。'); return; }
      updateSectState(playerSect, { resources: -cost });
      relations[playerKey]![targetKey] = { relation: 'neutral', trust: 20 };
      relations[targetKey]![playerKey] = { relation: 'neutral', trust: 20, lastEvent: '停战' };
      showToast(`🕊️ 与${targetName}停战议和，消耗 150 资源。`);
      break;
    }
    case 'alliance':
      relations[playerKey]![targetKey] = { relation: 'allied', trust: 80 };
      relations[targetKey]![playerKey] = { relation: 'allied', trust: 80, lastEvent: '结盟' };
      showToast(`🤝 与${targetName}结成同盟！荣辱与共！`);
      break;
  }

  setPlayer({ ...p, factionRelations: relations });
  saveGame(getPlayer());
  refreshPanel();
}

// ──── 刷新面板 ────

function refreshPanel(): void {
  const container = document.getElementById('camp-content') as HTMLElement;
  if (container) renderSectLeaderPanel(container);
}
