// ============================================================
//  src/screens/camp/CourtPanel.ts — 朝廷面板 UI
// ============================================================
//  庙堂之上 — 显示玩家朝廷身份、四维属性、影响力、晋升进度
//  支持文武分途选择、分心惩罚提示
// ============================================================

import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { showToast } from '../../ui/toast';
import type { CourtRank, CourtPath, CourtStats, LastActionType } from '../../data/sandboxTypes';
import {
  canPromoteCourt,
  executeCourtPromotion,
  getCourtRankLabel,
  getSplitFocusMessage,
  COURT_STAT_LABELS,
  COURT_PATH_WEN_STATS,
  COURT_PATH_WU_STATS,
} from '../../systems/CourtSystem';

export function renderCourtPanel(content: HTMLElement): void {
  const p = getPlayer();
  const courtStats = p.courtStats ?? { strategy: 10, eloquence: 10, charisma: 10, scholarship: 10 };
  const influence = p.influence ?? 0;
  const courtPath = (p.courtPath ?? null) as CourtPath | null;
  const courtRank = (p.courtRank ?? 'commoner') as CourtRank;
  const lastAction = (p.lastActionType ?? 'idle') as LastActionType;

  // 晋升检查
  const promoCheck = canPromoteCourt(p);
  const rankLabel = getCourtRankLabel(courtRank, courtPath);

  // ── 文武分途选择区（未选择时显示）──
  let pathSelectionHtml = '';
  if (!courtPath) {
    pathSelectionHtml = `
    <div style="margin-bottom:20px;padding:18px;background:rgba(155,89,182,0.08);border:2px solid rgba(155,89,182,0.35);border-radius:8px;text-align:center;">
      <div style="font-size:14px;color:#c39bd3;letter-spacing:2px;margin-bottom:6px;">🎯 选择庙堂之路</div>
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:14px;">一旦选定路线，将不可更改——请在文武之间慎重选择</div>
      <div style="display:flex;gap:14px;justify-content:center;">
        <button class="btn" id="btn-choose-wen" style="background:linear-gradient(135deg,#4a6fa5,#6b8dbe);color:#fff;padding:12px 24px;font-size:14px;letter-spacing:2px;border:none;border-radius:8px;cursor:pointer;box-shadow:0 0 15px rgba(74,111,165,0.3);min-width:140px;">
          📜 文 官 之 路<br><span style="font-size:10px;opacity:0.8;">侧重：口才 · 学识</span>
        </button>
        <button class="btn" id="btn-choose-wu" style="background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff;padding:12px 24px;font-size:14px;letter-spacing:2px;border:none;border-radius:8px;cursor:pointer;box-shadow:0 0 15px rgba(192,57,43,0.3);min-width:140px;">
          ⚔️ 武 将 之 路<br><span style="font-size:10px;opacity:0.8;">侧重：智谋 · 魅力</span>
        </button>
      </div>
    </div>`;
  }

  // ── 分心惩罚提示 ──
  let penaltyHtml = '';
  if (lastAction !== 'idle' && lastAction !== 'court') {
    penaltyHtml = `
    <div style="margin-bottom:14px;padding:10px 14px;background:rgba(230,126,34,0.12);border:1px solid rgba(230,126,34,0.35);border-radius:6px;font-size:11px;color:#f0b27a;letter-spacing:1px;text-align:center;">
      ⚠️ 分心之伤：你刚从武林归来，朝堂事务将受到 -30% 影响力收益惩罚<br>
      <span style="font-size:10px;color:var(--text-dim);">休息片刻可消除此效果</span>
    </div>`;
  }

  // ── 四维属性展示 ──
  const statKeys = Object.keys(courtStats) as (keyof CourtStats)[];
  const isWen = courtPath === 'wen';
  const isWu = courtPath === 'wu';
  const emphasizedStats = isWen ? COURT_PATH_WEN_STATS : isWu ? COURT_PATH_WU_STATS : [];

  const statBarsHtml = statKeys.map(key => {
    const val = courtStats[key];
    const label = COURT_STAT_LABELS[key];
    const isEmphasized = emphasizedStats.includes(key);
    const barColor = isEmphasized
      ? (isWen ? 'linear-gradient(90deg,#4a6fa5,#6b8dbe)' : 'linear-gradient(90deg,#c0392b,#e74c3c)')
      : 'linear-gradient(90deg,#5dade2,#9b59b6)';
    const emphasisMark = isEmphasized ? ' <span style="font-size:9px;color:#f0b27a;">★侧重要求</span>' : '';

    return `
    <div class="court-stat-row">
      <div class="court-stat-header">
        <span class="court-stat-icon">${label.icon}</span>
        <span class="court-stat-name">${label.name}${emphasisMark}</span>
        <span class="court-stat-val">${val}</span>
      </div>
      <div class="court-stat-bar-track">
        <div class="court-stat-bar-fill" style="width:${val}%;background:${barColor};"></div>
      </div>
      <div class="court-stat-desc">${label.desc}</div>
    </div>`;
  }).join('');

  // ── 影响力与晋升区 ──
  let promoHtml = '';
  if (promoCheck.nextRank) {
    const nextLabel = getCourtRankLabel(promoCheck.nextRank, courtPath);
    const progPct = Math.floor(promoCheck.progress * 100);
    const barColor = promoCheck.canPromote ? '#27ae60' : '#f39c12';

    promoHtml = `
    <div style="margin-bottom:20px;padding:14px 16px;background:rgba(155,89,182,0.06);border:1px solid rgba(155,89,182,0.25);border-radius:6px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:12px;color:#c39bd3;letter-spacing:2px;">🏛️ 朝廷晋升</span>
        <span style="font-size:12px;color:var(--text-dim);">${rankLabel} → <span style="color:#c39bd3;">${nextLabel}</span></span>
      </div>
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:6px;">
        影响力进度：<span style="color:${barColor};">${influence} / ${promoCheck.minInfluence}</span>
      </div>
      <div style="height:8px;background:#1a1a2e;border-radius:4px;overflow:hidden;margin-bottom:10px;">
        <div style="height:100%;width:${progPct}%;background:${barColor};border-radius:4px;transition:width 0.3s;"></div>
      </div>
      ${promoCheck.canPromote ? `
      <button class="btn" id="btn-execute-court-promotion" style="width:100%;background:linear-gradient(135deg,#9b59b6,#8e44ad);color:#fff;padding:10px 16px;font-size:13px;letter-spacing:2px;border:none;border-radius:6px;cursor:pointer;box-shadow:0 0 15px rgba(155,89,182,0.4);">
        🏛️ 申 请 晋 升
      </button>` : `
      <div style="font-size:11px;color:#e67e22;text-align:center;letter-spacing:1px;">⚠ ${promoCheck.reason}</div>`}
    </div>`;
  } else if (promoCheck.reason) {
    promoHtml = `
    <div style="margin-bottom:20px;padding:14px 16px;background:rgba(39,174,96,0.06);border:1px solid rgba(39,174,96,0.2);border-radius:6px;text-align:center;">
      <span style="font-size:12px;color:#27ae60;letter-spacing:2px;">🏆 ${promoCheck.reason}</span>
    </div>`;
  }

  // ── 组装 ──
  content.innerHTML = `
    <div class="title-deco"><h2>庙 堂 之 上</h2></div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
      <span style="font-size:36px;">${isWu ? '⚔️' : '🏛️'}</span>
      <div>
        <div style="font-size:18px;color:var(--text-gold);letter-spacing:3px;">${p.name}</div>
        <div style="font-size:12px;color:var(--text-dim);letter-spacing:2px;margin-top:4px;">
          ${courtPath ? (isWen ? '📜 文官 · ' : '⚔️ 武官 · ') : '❓ 未选择路线 · '}${rankLabel}
        </div>
        <div style="font-size:12px;color:var(--text-dim);margin-top:4px;">
          影响力：<strong style="color:#c39bd3;letter-spacing:1px;">${influence}</strong>
        </div>
      </div>
    </div>

    ${pathSelectionHtml}
    ${penaltyHtml}

    <div style="margin-bottom:18px;padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid var(--border-dim);border-radius:6px;">
      <div style="font-size:12px;color:var(--text-dim);letter-spacing:2px;margin-bottom:12px;">📖 朝廷四维</div>
      ${statBarsHtml}
    </div>

    ${promoHtml}

    ${courtPath ? `
    <div style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid var(--border-dim);border-radius:6px;">
      <div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;margin-bottom:8px;">📝 朝廷攻略</div>
      <div style="font-size:11px;color:var(--text-dim);line-height:1.8;">
        • 通过完成<span style="color:#c39bd3;">宗门主命</span>、<span style="color:#f0b27a;">外交任务</span>提升影响力<br>
        • ${isWen ? '文官侧重 <span style="color:#6b8dbe;">口才</span> 与 <span style="color:#6b8dbe;">学识</span>' : '武官侧重 <span style="color:#e74c3c;">智谋</span> 与 <span style="color:#e74c3c;">魅力</span>'}<br>
        • 同时涉足武林与朝堂将触发<span style="color:#e67e22;">分心惩罚</span>（-30%收益）<br>
        • 影响力如同修为，是晋升品阶的唯一标准
      </div>
    </div>` : ''}
  `;

  // ── 绑定事件 ──

  // 选择文官
  const wenBtn = content.querySelector('#btn-choose-wen');
  if (wenBtn) {
    wenBtn.addEventListener('click', () => {
      const player = getPlayer();
      const updated: typeof player = { ...player, courtPath: 'wen' as CourtPath };
      setPlayer(updated);
      saveGame(updated);
      showToast('📜 你选择了文官之路！侧重口才与学识。');
      renderCourtPanel(content);
    });
  }

  // 选择武官
  const wuBtn = content.querySelector('#btn-choose-wu');
  if (wuBtn) {
    wuBtn.addEventListener('click', () => {
      const player = getPlayer();
      const updated: typeof player = { ...player, courtPath: 'wu' as CourtPath };
      setPlayer(updated);
      saveGame(updated);
      showToast('⚔️ 你选择了武官之路！侧重智谋与魅力。');
      renderCourtPanel(content);
    });
  }

  // 朝廷晋升
  const promoBtn = content.querySelector('#btn-execute-court-promotion');
  if (promoBtn) {
    promoBtn.addEventListener('click', () => {
      const player = getPlayer();
      const result = executeCourtPromotion(player);
      if (!result.success) {
        showToast(result.reason || '晋升失败。');
        return;
      }
      setPlayer(result.updatedPlayer!);
      saveGame(getPlayer());
      const newLabel = getCourtRankLabel(result.newRank!, player.courtPath as CourtPath | null);
      showToast(`🏛️ 晋升成功！你已是${newLabel}！`);
      renderCourtPanel(content);
    });
  }
}
