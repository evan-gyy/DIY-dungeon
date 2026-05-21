// ============================================================
//  src/screens/camp/WorldPanel.ts — 江湖态势面板
//  废除虚假排名，改为按宗门层级+实际实力展示。
//  新增世界事件历史、可折叠个人日志。
// ============================================================

import { getPlayer } from '../../state/GameState';
import {
  getFactionRankings,
  tickWorldState,
  resolveWorldEvent,
  getPendingWorldEventDef,
  joinSect,
  canJoinSect,
  getChronicle,
  getSectTier,
  getWorldEventHistory,
  type FactionScore,
  type ChronicleEntry,
  type WorldEvent,
} from '../../systems/WorldState';
import {
  getFactionRelationLabel,
  getFactionTrust,
  getAlignmentLabel,
  getActiveCoalitions,
  getAllRelationsSnapshot,
  getAvailableDiplomacyActions,
  playerDiplomaticAction,
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
  const pendingEvent = getPendingWorldEventDef();

  container.innerHTML = `
    <div class="world-panel">
      ${renderToolbar(currentTurn)}
      ${pendingEvent ? renderPendingEventBanner(pendingEvent) : ''}
      ${renderSectCards()}
      ${renderCoalitionSection()}
      ${renderDiplomacyGraph()}
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

// ──── 可介入事件横幅 ────

function renderPendingEventBanner(event: WorldEvent): string {
  const acceptLabel = event.acceptLabel ?? '⚔️ 参与';
  return `<div class="wp-pending-event">
    <div class="wp-pending-event-header">⚡ 江湖急讯</div>
    <div class="wp-pending-event-title">${event.title}</div>
    <div class="wp-pending-event-desc">${event.description}</div>
    <div class="wp-pending-event-reward">🎁 奖励：${event.playerEffect?.flavorText ?? '（无奖励）'}</div>
    <div class="wp-pending-event-btns">
      <button class="wp-pending-accept" id="wp-pending-accept">${acceptLabel}</button>
      <button class="wp-pending-skip" id="wp-pending-skip">⏩ 置之不理</button>
    </div>
  </div>`;
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

// ──── P7 联盟展示 ────

function renderCoalitionSection(): string {
  const coalitions = getActiveCoalitions();
  if (coalitions.length === 0) return '';

  const items = coalitions.map(c => {
    const targetName = SECTS[c.targetSect]?.name ?? c.targetSect;
    const memberNames = c.members.map(m => SECTS[m as SectId]?.name ?? m).join('、');
    return `
      <div class="wp-coalition-card">
        <div class="wp-coalition-header">
          <span class="wp-coalition-icon">⚔️</span>
          <span class="wp-coalition-name">${c.name}</span>
          <span class="wp-coalition-target">→ ${targetName}</span>
        </div>
        <div class="wp-coalition-members">盟员：${memberNames}</div>
        <div class="wp-coalition-expire">⏳ 剩余 ${Math.max(0, c.expireMonth - (getPlayer().gameMonth ?? 1))} 个月</div>
      </div>
    `;
  }).join('');

  return `
    <div class="wp-coalition-section">
      <div class="wp-section-title">🛡️ 天下联盟</div>
      ${items}
    </div>
  `;
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
        <p style="font-size:11px;">行走江湖时将有概率触发江湖事件。</p>
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
        <p style="font-size:11px;">完成行走江湖、探索地图、与NPC互动都将记入日志。</p>
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

// ──── 外交关系图 (Direction D) ────

const POS: Record<string, { x: number; y: number }> = {
  kunlun:  { x: 5,  y: 15 }, kongtong:  { x: 18, y: 22 }, xuedao:  { x: 12, y: 30 },
  huashan: { x: 48, y: 30 }, quanzhen:  { x: 30, y: 42 },
  riyue:   { x: 82, y: 10 }, rebels:    { x: 88, y: 8 },
  imperial_court: { x: 78, y: 32 }, shaolin: { x: 68, y: 48 },
  beggar:  { x: 38, y: 58 }, wudang:    { x: 32, y: 72 },
  demon:   { x: 78, y: 55 }, maoshan:   { x: 88, y: 55 }, xiaoyao: { x: 95, y: 68 },
  tangmen: { x: 15, y: 78 }, qingcheng:  { x: 8, y: 85 },
  emei:    { x: 5,  y: 95 }, tiezhang:  { x: 22, y: 88 },
  wudu:    { x: 8,  y: 108 }, diancang: { x: 5,  y: 118 },
  haisha:  { x: 92, y: 82 },
};

function trustToStrokeColor(trust: number): string {
  if (trust >= 80) return '#66bb6a';
  if (trust >= 60) return '#a5d6a7';
  if (trust >= 30) return '#9e9e9e';
  if (trust >= 15) return '#ef9a9a';
  return '#e57373';
}

function trustToStrokeWidth(trust: number): number {
  return trust >= 60 ? 2 : trust >= 30 ? 1.2 : 0.6;
}

function renderDiplomacyGraph(): string {
  const p = getPlayer();
  if (!p.sect || p.sect === 'none') return '';

  const snapshots = getAllRelationsSnapshot();
  if (snapshots.length === 0) return '';

  const w = 680; const h = 460;
  const pad = 30;

  // 缩放坐标
  const allX = Object.values(POS).map(p => p.x);
  const allY = Object.values(POS).map(p => p.y);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const scaleX = (w - pad * 2) / (maxX - minX || 1);
  const scaleY = (h - pad * 2) / (maxY - minY || 1);
  const tx = (v: number) => pad + (v - minX) * scaleX;
  const ty = (v: number) => pad + (v - minY) * scaleY;

  // 连线
  let lines = '';
  for (const s of snapshots) {
    const pa = POS[s.a];
    const pb = POS[s.b];
    if (!pa || !pb) continue;
    const color = trustToStrokeColor(s.trust);
    const sw = trustToStrokeWidth(s.trust);
    lines += `<line x1="${tx(pa.x)}" y1="${ty(pa.y)}" x2="${tx(pb.x)}" y2="${ty(pb.y)}"
      stroke="${color}" stroke-width="${sw}" opacity="0.45"
      data-trust="${s.trust}" data-a="${s.a}" data-b="${s.b}" data-rel="${s.relationLabel}" />`;
  }

  // 节点
  let nodes = '';
  const playerSect = p.sect;
  for (const [sectId, pos] of Object.entries(POS)) {
    const sid = sectId as SectId;
    const name = SECTS[sid]?.name ?? sectId;
    const icon = SECTS[sid]?.icon ?? '🏴';
    const isPlayer = sectId === playerSect;
    const r = isPlayer ? 12 : 8;
    const fill = isPlayer ? '#ffd700' : SECTS[sid]?.color ?? '#888';
    nodes += `<g class="dg-node" data-sect="${sectId}" data-name="${name}">
      <circle cx="${tx(pos.x)}" cy="${ty(pos.y)}" r="${r}" fill="${fill}"
        stroke="${isPlayer ? '#fff' : '#333'}" stroke-width="${isPlayer ? 2 : 1}"
        class="dg-node-circle ${isPlayer ? 'dg-player' : ''}" />
      <text x="${tx(pos.x)}" y="${ty(pos.y) + r + 12}" text-anchor="middle"
        fill="#ccc" font-size="10" class="dg-node-label">${icon}${name}</text>
    </g>`;
  }

  const coalitionSection = renderDiplomacyTooltip();

  return `
    <div class="wp-section">
      <div class="wp-section-title">🕸️ 天下大势图
        <span style="font-size:11px;color:#888;margin-left:8px;">点击节点查看外交行动</span>
      </div>
      <div class="dg-container">
        <svg viewBox="0 0 ${w} ${h}" class="dg-svg">
          ${lines}
          ${nodes}
        </svg>
        ${coalitionSection}
      </div>
    </div>`;
}

function renderDiplomacyTooltip(): string {
  return `<div class="dg-tooltip" id="dg-tooltip" style="display:none;">
    <div class="dg-tooltip-title" id="dg-tooltip-title"></div>
    <div class="dg-tooltip-body" id="dg-tooltip-body"></div>
    <div class="dg-tooltip-actions" id="dg-tooltip-actions"></div>
  </div>`;
}

let _selectedDiploTarget: string | null = null;

function bindDiplomacyGraph(container: HTMLElement): void {
  const tooltip = container.querySelector<HTMLElement>('#dg-tooltip');
  if (!tooltip) return;

  const svg = container.querySelector<HTMLElement>('.dg-svg');
  const lines = container.querySelectorAll<SVGLineElement>('line[data-trust]');

  // hover 连线高亮
  lines.forEach(line => {
    line.addEventListener('mouseenter', () => {
      line.style.opacity = '0.9';
      line.style.strokeWidth = '3';
    });
    line.addEventListener('mouseleave', () => {
      line.style.opacity = '0.45';
      line.style.strokeWidth = line.getAttribute('stroke-width') || '1';
    });
  });

  // click 节点 → 外交菜单
  container.querySelectorAll<HTMLElement>('.dg-node').forEach(node => {
    node.addEventListener('click', (e) => {
      e.stopPropagation();
      const sectId = node.dataset.sect;
      const name = node.dataset.name;
      if (!sectId || !name) return;

      const p = getPlayer();
      if (sectId === p.sect) {
        _selectedDiploTarget = null;
        tooltip.style.display = 'none';
        return;
      }

      _selectedDiploTarget = sectId;
      const trust = getFactionTrust(p.sect as SectId, sectId as SectId);
      const relLabel = getFactionRelationLabel(p.sect as SectId, sectId as SectId);
      const actions = getAvailableDiplomacyActions(sectId as SectId);

      const titleEl = tooltip.querySelector('#dg-tooltip-title');
      const bodyEl = tooltip.querySelector('#dg-tooltip-body');
      const actionsEl = tooltip.querySelector('#dg-tooltip-actions');
      if (titleEl) titleEl.textContent = `${name}`;
      if (bodyEl) bodyEl.innerHTML = `信任：<b>${trust}</b> · 关系：<b>${relLabel}</b>`;
      if (actionsEl) {
        actionsEl.innerHTML = actions.map(a =>
          `<button class="dg-action-btn ${a.enabled ? '' : 'dg-action-disabled'}"
            data-diplo-action="${a.action}" data-target="${sectId}"
            ${a.enabled ? '' : 'disabled'} title="${a.reason}">
            ${a.icon} ${a.label} <span class="dg-action-cost">${a.cost}</span>
          </button>`
        ).join('');

        // 绑定外交按钮
        actionsEl.querySelectorAll<HTMLElement>('[data-diplo-action]').forEach(btn => {
          btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const action = btn.dataset.diploAction as import('../../systems/FactionSystem').PlayerDiplomacyAction;
            const target = btn.dataset.target as SectId;
            if (!action || !target) return;
            const result = playerDiplomaticAction(action, target);
            import('../../ui/toast').then(m => m.showToast(result.message));
            const parent = container.closest('.world-panel');
            if (parent) {
              renderWorldPanel(parent as HTMLElement);
            }
            _selectedDiploTarget = null;
          });
        });
      }

      // 定位 tooltip
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const left = rect.left - containerRect.left + 20;
      const top = rect.top - containerRect.top - 10;
      tooltip.style.left = `${Math.max(0, Math.min(left, containerRect.width - 200))}px`;
      tooltip.style.top = `${Math.max(0, Math.min(top, containerRect.height - 200))}px`;
      tooltip.style.display = 'block';
    });
  });

  // 点击空白处关闭
  svg?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.dg-node')) return;
    _selectedDiploTarget = null;
    tooltip.style.display = 'none';
  });

  container.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.dg-node') || (e.target as HTMLElement).closest('#dg-tooltip')) return;
    _selectedDiploTarget = null;
    tooltip.style.display = 'none';
  });
}

// ──── 绑定按钮 ────

function bindButtons(container: HTMLElement): void {
  bindDiplomacyGraph(container);

  // 可介入事件：参与
  const acceptBtn = container.querySelector('#wp-pending-accept');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      const ev = getPendingWorldEventDef();
      resolveWorldEvent(true);
      import('../../ui/toast').then(m => {
        const reward = ev?.playerEffect?.flavorText ?? '';
        m.showToast(`✅ 已参与！${reward ? `\n🎁 ${reward}` : ''}`);
      });
      renderWorldPanel(container);
    });
  }

  // 可介入事件：跳过
  const skipBtn = container.querySelector('#wp-pending-skip');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      resolveWorldEvent(false);
      import('../../ui/toast').then(m => m.showToast('⏩ 你袖手旁观，事件就此过去。'));
      renderWorldPanel(container);
    });
  }

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
