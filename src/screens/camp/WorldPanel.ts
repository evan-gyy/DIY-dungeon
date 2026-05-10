// ============================================================
//  src/screens/camp/WorldPanel.ts — 江湖态势面板
//  门派排名全部从 npcDatabase 实时计算，无一编造。
// ============================================================

import { getPlayer } from '../../state/GameState';
import {
  getFactionRankings,
  tickWorldState,
  joinSect,
  canJoinSect,
  getChronicle,
  type FactionScore,
  type ChronicleEntry,
} from '../../systems/WorldState';
import {
  getFactionRelationLabel,
  getFactionTrust,
  getFactionAlignment,
  getAlignmentLabel,
} from '../../systems/FactionSystem';
import { SECTS } from '../../data/sects';
import { WORLD_MAP } from '../../data/worldMap';
import { FACTION_DEFS } from '../../data/sandboxTypes';
import type { SectId } from '../../data/types';

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

  container.innerHTML = `
    <div class="world-panel">
      ${renderSectPowerRanking()}
      <div class="world-panel-grid">
        <div class="world-panel-left">
          ${renderSectDetailCards()}
        </div>
        <div class="world-panel-right">
          ${renderChronicleSection()}
        </div>
      </div>
    </div>
  `;

  bindJoinSectButtons(container);
}

// ──── 宗门实力排行（数据来源：npcDatabase）────

function renderSectPowerRanking(): string {
  const rankings = getFactionRankings();
  const trendIcon = (t: string) => t === 'rising' ? '📈' : t === 'declining' ? '📉' : '➡️';
  const maxScore = Math.max(1, ...rankings.map(r => r.score));

  const levelLabel = (lv: number) => {
    if (lv >= 55) return '渡劫期';
    if (lv >= 45) return '化神期';
    if (lv >= 35) return '元婴期';
    if (lv >= 25) return '结丹期';
    if (lv >= 15) return '筑基期';
    if (lv >= 5)  return '炼气期';
    return '凡俗';
  };

  const bars = rankings.map(r => {
    const sectData = SECTS[r.factionId] ?? { name: r.factionId, color: '#888', icon: '🏯' };
    const barWidth = Math.round((r.score / maxScore) * 100);
    const alignment = FACTION_DEFS[r.factionId]?.alignment ?? 'neutral';
    const alignmentLabel = getAlignmentLabel(alignment);

    return `<div class="wp-rank-row" data-sect="${r.factionId}">
      <div class="wp-rank-num">#${r.rank}</div>
      <div class="wp-rank-icon">${sectData.icon}</div>
      <div class="wp-rank-info">
        <div class="wp-rank-name" style="color:${sectData.color}">
          ${r.name} <span class="wp-rank-trend">${trendIcon(r.trend)}</span>
        </div>
        <div class="wp-rank-bar-wrap">
          <div class="wp-rank-bar" style="width:${barWidth}%;background:${sectData.color}"></div>
        </div>
        <div class="wp-rank-stats">
          <span title="NPC人数">👥${r.npcCount}人</span>
          <span title="平均修为">📊${levelLabel(r.avgLevel)}</span>
          <span title="最高修为">🏆${r.topNpcName}(${levelLabel(r.maxLevel)})</span>
          <span class="wp-rank-score">实力 ${r.score}</span>
        </div>
      </div>
      <div class="wp-rank-align">${alignmentLabel}</div>
    </div>`;
  }).join('');

  const currentTurn = getPlayer().worldState?.turn ?? 0;

  return `<div class="wp-section">
    <div class="wp-section-title">
      🏆 宗門實力
      <span class="wp-turn-badge">第 ${currentTurn} 回合</span>
      <button class="wp-evolve-btn" id="wp-evolve-btn" title="手动推进世界演化">⏩ 推演</button>
    </div>
    <div class="wp-ranking-list">${bars}</div>
  </div>`;
}

// ──── 势力详情卡片 ────

function renderSectDetailCards(): string {
  const rankings = getFactionRankings();
  const p = getPlayer();

  return `<div class="wp-section">
    <div class="wp-section-title">📊 各派詳情</div>
    <div class="wp-cards-grid">
      ${rankings.map(r => {
        const sectData = SECTS[r.factionId] ?? { name: r.factionId, color: '#888', icon: '🏯' };
        const isMySect = p.sect === r.factionId;
        const canJoinResult = p.sect !== r.factionId ? canJoinSect(r.factionId) : { canJoin: false, reason: '' };

        // 列出该势力所有 NPC
        const npcs = Object.values(p.npcDatabase ?? {})
          .filter(n => n.sect === r.factionId)
          .sort((a, b) => b.level - a.level);

        const npcList = npcs.length > 0
          ? npcs.map(n => {
            const rankLabel = { outer:'外门', inner:'内门', true:'真传', elder:'长老', leader:'掌门' }[n.discipleRank as string] ?? n.discipleRank;
            return `<div class="wp-npc-row">
              <span class="wp-npc-name">${n.name}</span>
              <span class="wp-npc-lv">Lv${n.level}</span>
              <span class="wp-npc-rank-badge">${rankLabel}</span>
            </div>`;
          }).join('')
          : `<div class="wp-npc-empty">暂无弟子</div>`;

        // 外交关系
        const relations = ['wudang','shaolin','emei','beggar','huashan','demon',
          'maoshan','kunlun','qingcheng','tangmen','xiaoyao',
          'quanzhen','kongtong','diancang'] as SectId[];
        const relationTags = relations
          .filter(other => other !== r.factionId)
          .map(other => {
            const trust = getFactionTrust(r.factionId, other);
            const label = getFactionRelationLabel(r.factionId, other);
            const color = trust >= 60 ? 'var(--text-gold)' : trust >= 30 ? '#888' : '#ef5350';
            const shortName: Record<SectId, string> = {
              wudang:'武当', shaolin:'少林', emei:'峨眉', beggar:'丐帮', huashan:'华山', demon:'魔教',
              maoshan:'茅山', kunlun:'昆仑', qingcheng:'青城', tangmen:'唐门', xiaoyao:'逍遥',
              quanzhen:'全真', kongtong:'崆峒', diancang:'点苍', none:'散修',
            };
            return `<span class="wp-rel-tag" style="color:${color}" title="${label}(${trust})">${shortName[other] ?? other}:${trust}</span>`;
          }).join(' ');

        // 加入按钮
        const joinBtn = !isMySect && canJoinResult.canJoin
          ? `<button class="wp-join-btn" data-join-sect="${r.factionId}">拜入</button>`
          : isMySect
            ? `<span class="wp-my-sect-badge">⚜️ 本门</span>`
            : canJoinResult.reason
              ? `<span class="wp-join-hint" title="${canJoinResult.reason}">🔒 ${canJoinResult.reason.slice(0,8)}…</span>`
              : '';

        return `<div class="wp-sect-card">
          <div class="wp-sect-card-header">
            <span class="wp-sect-icon">${sectData.icon}</span>
            <div>
              <div class="wp-sect-name" style="color:${sectData.color}">${r.name}</div>
              <div class="wp-sect-rank">排名 #${r.rank} · 实力 ${r.score}（均Lv${r.avgLevel} × 5 + ${r.npcCount}人 × 2）</div>
            </div>
            ${joinBtn}
          </div>
          <div class="wp-sect-npc-list">
            <div class="wp-npc-list-title">📋 門人（${r.npcCount}人）</div>
            ${npcList}
          </div>
          <div class="wp-sect-relations">${relationTags}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ──── 个人日志 ────

function renderChronicleSection(): string {
  const entries = getChronicle();

  const categoryIcon: Record<string, string> = {
    world_event: '🌍',
    sect_join: '🏯',
    rank_promotion: '⬆️',
    mission_complete: '✅',
    npc_interaction: '💬',
    travel: '🗺️',
    battle: '⚔️',
    discovery: '💎',
    court_affair: '🏛️',
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

  const listHtml = entries.slice(0, 20).map(e => {
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

  return `<div class="wp-section">
    <div class="wp-section-title">📖 个人日志 <span class="wp-turn-badge">共 ${entries.length} 条</span></div>
    <div class="wp-chronicle-list">${listHtml}</div>
  </div>`;
}

// ──── 绑定按钮 ────

function bindJoinSectButtons(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('[data-join-sect]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sectId = btn.dataset['joinSect'] as SectId;
      if (!sectId) return;

      const sectName = SECTS[sectId]?.name ?? sectId;
      const confirmed = confirm(`确定要拜入【${sectName}】吗？`);
      if (!confirmed) return;

      joinSect(sectId);

      import('../Camp').then(m => {
        m.enterCamp();
      });
    });
  });

  // 手动推演按钮
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
}
