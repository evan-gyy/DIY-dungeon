// ============================================================
//  src/screens/camp/WorldPanel.ts — 江湖态势面板
//  废除虚假排名，改为按宗门层级+实际实力展示。
//  新增世界事件历史、可折叠个人日志。
// ============================================================

import { getPlayer } from '../../state/GameState';
import {
  getFactionRankings,
  tickWorldState,
  joinSect,
  canJoinSect,
  getChronicle,
  getSectTier,
  getWorldEventHistory,
  type FactionScore,
  type ChronicleEntry,
} from '../../systems/WorldState';
import {
  getFactionRelationLabel,
  getFactionTrust,
  getAlignmentLabel,
} from '../../systems/FactionSystem';
import { SECTS } from '../../data/sects';
import { WORLD_MAP } from '../../data/worldMap';
import type { SectId } from '../../data/types';

// ──── 宗门倾向标签渲染 ────

function alignmentBadge(alignment: string): string {
  const map: Record<string, { label: string; cssClass: string }> = {
    righteous:  { label: '正道', cssClass: 'wp-align-righteous' },
    neutral:    { label: '中立', cssClass: 'wp-align-neutral' },
    chaotic:    { label: '邪道', cssClass: 'wp-align-chaotic' },
    unorthodox: { label: '左道', cssClass: 'wp-align-unorthodox' },
  };
  const b = map[alignment] ?? { label: alignment, cssClass: 'wp-align-neutral' };
  return `<span class="wp-alignment-badge ${b.cssClass}">${b.label}</span>`;
}

function tierBadge(tier: string): string {
  const map: Record<string, string> = {
    supreme: 'wp-tier-supreme', first_rate: 'wp-tier-first', second_rate: 'wp-tier-second',
    fringe: 'wp-tier-fringe', special: 'wp-tier-special',
  };
  const css = map[tier] ?? 'wp-tier-special';
  return `<span class="wp-tier-badge ${css}">${tier}</span>`;
}

// ──── 渲染入口 ────

export function renderWorldPanel(container: HTMLElement): void {
  const p = getPlayer();

  if (p.gameMode !== 'sandbox') {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-dim);">
      <p style="font-size:16px;">📜 江湖态势仅在沙盒模式中可用</p>
      <p style="font-size:12px;margin-top:8px;">剧情模式请通过人物活动推进主线。</p>
    </div>`;
    return;
  }

  const currentTurn = p.worldState?.turn ?? 0;

  container.innerHTML = `
    <div class="world-panel">
      ${renderToolbar(currentTurn)}
      ${renderSectCards()}
      <div class="world-panel-grid">
        <div class="world-panel-left">
          ${renderEventHistory()}
        </div>
        <div class="world-panel-right">
          ${renderChronicleSection()}
        </div>
      </div>
    </div>
  `;

  bindButtons(container);
}

// ──── 顶部工具栏 ────

function renderToolbar(currentTurn: number): string {
  return `<div class="wp-toolbar">
    <span class="wp-toolbar-title">🌏 江湖态势</span>
    <span class="wp-turn-badge">第 ${currentTurn} 回合</span>
    <button class="wp-evolve-btn" id="wp-evolve-btn" title="手动推进世界演化">⏩ 推演</button>
  </div>`;
}

// ──── 宗门详情卡片（按层级分组）────

function renderSectCards(): string {
  const factions = getFactionRankings();
  const p = getPlayer();

  // 按层级分组
  const tierOrder = ['supreme', 'first_rate', 'second_rate', 'fringe', 'special'] as const;
  const tierNames: Record<string, string> = {
    supreme: '顶尖大派', first_rate: '一流门派', second_rate: '二流门派', fringe: '旁门左道', special: '特殊',
  };
  const grouped = new Map<string, FactionScore[]>();
  for (const f of factions) {
    const list = grouped.get(f.tier) ?? [];
    list.push(f);
    grouped.set(f.tier, list);
  }

  let html = '';
  for (const tier of tierOrder) {
    const list = grouped.get(tier);
    if (!list || list.length === 0) continue;
    html += `<div class="wp-tier-section">
      <div class="wp-tier-header">${tierNames[tier] ?? tier}</div>
      <div class="wp-cards-grid">
        ${list.map(r => renderOneSectCard(r, p)).join('')}
      </div>
    </div>`;
  }

  return html;
}

function renderOneSectCard(r: FactionScore, p: ReturnType<typeof getPlayer>): string {
  const sectData = SECTS[r.factionId];
  if (!sectData) return '';

  const isMySect = p.sect === r.factionId;
  const canJoinResult = p.sect !== r.factionId ? canJoinSect(r.factionId) : { canJoin: false, reason: '' };
  const alignment = sectData.alignment ?? 'neutral';

  // 宗主/掌门信息
  const leaderFromDb = Object.values(p.npcDatabase ?? {})
    .filter(n => n.sect === r.factionId && (n.discipleRank === 'leader' || n.discipleRank === 'elder'))
    .sort((a, b) => b.level - a.level)[0];
  const leaderInfo = leaderFromDb
    ? `${leaderFromDb.name}（Lv${leaderFromDb.level}）`
    : r.topNpcName !== '—' ? `${r.topNpcName}（Lv${r.maxLevel}）` : '暂无';

  // 加入按钮
  let joinBtn = '';
  if (!isMySect && canJoinResult.canJoin) {
    joinBtn = `<button class="wp-join-btn" data-join-sect="${r.factionId}">拜入</button>`;
  } else if (isMySect) {
    joinBtn = `<span class="wp-my-sect-badge">⚜️ 本门</span>`;
  } else if (canJoinResult.reason) {
    const short = canJoinResult.reason.length > 8 ? canJoinResult.reason.slice(0, 8) + '…' : canJoinResult.reason;
    joinBtn = `<span class="wp-join-hint" title="${canJoinResult.reason}">🔒 ${short}</span>`;
  }

  return `<div class="wp-sect-card">
    <div class="wp-sect-card-header">
      <span class="wp-sect-icon">${sectData.icon}</span>
      <div class="wp-sect-name-block">
        <span class="wp-sect-name" style="color:${sectData.color}">${sectData.name}</span>
        <span class="wp-sect-subtitle">${alignmentBadge(alignment)}</span>
      </div>
      ${joinBtn}
    </div>
    <div class="wp-sect-card-body">
      <div class="wp-sect-stat"><span class="wp-stat-label">弟子</span><span class="wp-stat-value">${r.npcCount} 人</span></div>
      <div class="wp-sect-stat"><span class="wp-stat-label">宗主</span><span class="wp-stat-value">${leaderInfo}</span></div>
      ${sectData.culture ? `<div class="wp-sect-culture">${sectData.culture.map((c: string) => `<span class="wp-culture-tag">#${c}</span>`).join(' ')}</div>` : ''}
    </div>
  </div>`;
}

// ──── 世界事件历史 ────

function renderEventHistory(): string {
  const events = getWorldEventHistory();

  const categoryIcon: Record<string, string> = {
    conflict: '⚔️', diplomacy: '🤝', discovery: '💎', disaster: '🦠', opportunity: '💰',
  };

  if (events.length === 0) {
    return `<div class="wp-section">
      <div class="wp-section-title">🌍 江湖事件</div>
      <div class="wp-chronicle-empty">
        <p>江湖风平浪静，暂无大事发生。</p>
        <p style="font-size:11px;">日常修行时将有概率触发江湖事件。</p>
      </div>
    </div>`;
  }

  const now = Date.now();
  const formatTime = (ts: number): string => {
    const diff = Math.floor((now - ts) / 1000);
    if (diff < 60) return '刚才';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  };

  const listHtml = events.slice(0, 15).map(e => {
    return `<div class="wp-event-entry">
      <div class="wp-event-icon">${categoryIcon[e.category] ?? '📌'}</div>
      <div class="wp-event-body">
        <div class="wp-event-title">${e.title}</div>
        <div class="wp-event-desc">${e.description}</div>
        <div class="wp-event-meta">
          <span>🕐 第 ${e.turn} 回合 · ${formatTime(e.timestamp)}</span>
        </div>
      </div>
    </div>`;
  }).join('');

  return `<div class="wp-section">
    <div class="wp-section-title">🌍 江湖事件 <span class="wp-turn-badge">共 ${events.length} 件</span></div>
    <div class="wp-event-list">${listHtml}</div>
  </div>`;
}

// ──── 个人日志（可折叠）────

function renderChronicleSection(): string {
  const entries = getChronicle();
  const collapsed = entries.length > 5; // 超过5条默认折叠

  const categoryIcon: Record<string, string> = {
    world_event: '🌍', sect_join: '🏯', rank_promotion: '⬆️', mission_complete: '✅',
    npc_interaction: '💬', travel: '🗺️', battle: '⚔️', discovery: '💎', court_affair: '🏛️',
  };

  const now = Date.now();
  const formatTime = (ts: number): string => {
    const diff = Math.floor((now - ts) / 1000);
    if (diff < 60) return '刚才';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  };

  if (entries.length === 0) {
    return `<div class="wp-section">
      <div class="wp-section-title">📖 个人日志</div>
      <div class="wp-chronicle-empty">
        <p>尚无记录。</p>
        <p style="font-size:11px;">完成日常修行、探索地图、与NPC互动都将记入日志。</p>
      </div>
    </div>`;
  }

  const listHtml = entries.slice(0, 30).map(e => {
    const locName = e.locationId ? (WORLD_MAP[e.locationId]?.name ?? '') : '';
    return `<div class="wp-chronicle-entry">
      <div class="wp-chronicle-icon">${categoryIcon[e.category] ?? '📌'}</div>
      <div class="wp-chronicle-body">
        <div class="wp-chronicle-title">${e.title}</div>
        <div class="wp-chronicle-desc">${e.description}</div>
        <div class="wp-chronicle-meta">
          ${locName ? `<span>📍 ${locName}</span>` : ''}
          <span>🕐 ${formatTime(e.timestamp)}</span>
        </div>
      </div>
    </div>`;
  }).join('');

  const collapseId = 'wp-chronicle-collapse';
  return `<div class="wp-section">
    <div class="wp-section-title wp-collapsible-header" data-collapse="${collapseId}" style="cursor:pointer;">
      📖 个人日志 <span class="wp-turn-badge">共 ${entries.length} 条</span>
      <span class="wp-collapse-arrow ${collapsed ? '' : 'wp-collapse-open'}" id="${collapseId}-arrow">${collapsed ? '▶' : '▼'}</span>
    </div>
    <div class="wp-chronicle-list ${collapsed ? 'wp-collapsed' : ''}" id="${collapseId}">
      ${listHtml}
    </div>
  </div>`;
}

// ──── 绑定按钮 ────

function bindButtons(container: HTMLElement): void {
  // 拜入宗门
  container.querySelectorAll<HTMLElement>('[data-join-sect]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sectId = btn.dataset['joinSect'] as SectId;
      if (!sectId) return;
      const sectName = SECTS[sectId]?.name ?? sectId;
      const confirmed = confirm(`确定要拜入【${sectName}】吗？`);
      if (!confirmed) return;
      joinSect(sectId);
      import('../Camp').then(m => m.enterCamp());
    });
  });

  // 手动推演
  const evolveBtn = container.querySelector('#wp-evolve-btn');
  if (evolveBtn) {
    evolveBtn.addEventListener('click', () => {
      const result = tickWorldState();
      import('../../ui/toast').then(m => {
        if (result.worldEvent?.showToPlayer) {
          const pe = result.worldEvent.playerEffect;
          const playerMsg = pe?.flavorText ? `\n\n🎁 ${pe.flavorText}` : '';
          m.showToast(`${result.worldEvent.title}\n${result.worldEvent.description}${playerMsg}`);
        } else {
          m.showToast('⏩ 江湖已推进一个回合。');
        }
      });
      const parent = container.parentElement;
      if (parent) renderWorldPanel(parent);
    });
  }

  // 日志折叠/展开
  container.querySelectorAll<HTMLElement>('[data-collapse]').forEach(header => {
    header.addEventListener('click', () => {
      const targetId = header.dataset['collapse'];
      if (!targetId) return;
      const target = document.getElementById(targetId);
      const arrow = document.getElementById(targetId + '-arrow');
      if (!target || !arrow) return;
      const isCollapsed = target.classList.contains('wp-collapsed');
      if (isCollapsed) {
        target.classList.remove('wp-collapsed');
        arrow.textContent = '▼';
        arrow.classList.add('wp-collapse-open');
      } else {
        target.classList.add('wp-collapsed');
        arrow.textContent = '▶';
        arrow.classList.remove('wp-collapse-open');
      }
    });
  });
}
