// ============================================================
//  src/screens/camp/SectPanel.ts — 宗门情况面板
// ============================================================
//  江湖线核心面板 — 显示宗门实力、身份权益、进阶路线
//  晋升通过角色属性面板的试炼系统完成，此面板仅供查看
// ============================================================

import { getPlayer } from '../../state/GameState';
import { showToast } from '../../ui/toast';
import { SECTS } from '../../data/sects';
import type { SectId } from '../../data/types';
import type { DiscipleRank } from '../../data/sandboxTypes';
import { DISCIPLE_RANK_ORDER, RANK_RECRUIT_SLOTS, RECRUIT_RANK_CAP } from '../../data/sandboxTypes';
import { getMaxRecruitSlots, getRecruitRankCap } from '../../systems/NPCManager';

const DISCIPLE_RANK_LABEL: Record<string, string> = {
  outer: '外门弟子', inner: '内门弟子', true: '真传弟子',
  elder: '长老', vice_leader: '副掌门', leader: '掌门',
};
const DISCIPLE_RANK_DESC: Record<string, string> = {
  outer: '宗门最基层弟子，每日做工换取微薄贡献。尚无招募随从资格。',
  inner: '获准入内门修炼，可修习更高深武学，可招募1名外门随从。',
  true: '掌门亲传，接触宗门核心武学与机密。可招募2名随从（≤内门）。',
  elder: '宗门长老，参与议事决策，威望崇高。可招募3名随从（≤真传）。',
  vice_leader: '一人之下万人之上，代掌门行令。可招募4名随从（≤长老）。',
  leader: '执掌宗门，号令群雄，一方霸主。可招募5名随从（≤副掌门）。',
};
const PROMOTION_CONTRIBUTION: Record<string, number> = {
  inner: 100, true: 300, elder: 800, vice_leader: 2000, leader: 5000,
};

export function renderSectPanel(content: HTMLElement): void {
  const p = getPlayer();
  const sectId = p.sect as SectId;
  const sectName = SECTS[sectId]?.name ?? '无门无派';
  const currentRank = (p.discipleRank ?? 'outer') as DiscipleRank;
  const contribution = p.sectContribution ?? 0;

  if (sectId === 'none' || !sectId) {
    content.innerHTML = `
      <div style="max-width:520px;margin:auto;text-align:center;padding:60px 20px;">
        <div style="font-size:48px;margin-bottom:16px;">🏯</div>
        <div style="font-size:16px;color:var(--text-light);letter-spacing:2px;margin-bottom:8px;">无门无派</div>
        <div style="font-size:12px;color:var(--text-dim);line-height:1.8;">
          你尚未加入任何门派势力<br><br>
          前往各门派山门拜师，踏入江湖之路<br>
          或前往开封府踏上庙堂之途
        </div>
      </div>`;
    return;
  }

  // 势力状态
  const sectState = p.sectState?.[sectId];
  const resources = sectState?.resources ?? 0;
  const stability = sectState?.stability ?? 0;
  const prosperity = sectState?.prosperity ?? 0;

  // 势力力量分估算
  const powerEstimate = Math.floor(resources * 0.5 + stability * 2 + prosperity * 3);

  // ── 当前身份权益 ──
  const followerSlots = getMaxRecruitSlots(currentRank);
  const followerCap = getRecruitRankCap(currentRank);
  const followerCapLabel = followerCap ? DISCIPLE_RANK_LABEL[followerCap] ?? followerCap : '—';
  const currentFollowers = (p.npcCollection?.recruited ?? []).length;

  // 下一阶信息
  const currentIdx = DISCIPLE_RANK_ORDER.indexOf(currentRank);
  const nextRank = currentIdx >= 0 && currentIdx < DISCIPLE_RANK_ORDER.length - 1
    ? DISCIPLE_RANK_ORDER[currentIdx + 1]
    : null;
  const requiredContrib = nextRank ? (PROMOTION_CONTRIBUTION[nextRank] ?? 999999) : 0;
  const progress = nextRank ? Math.min(1, contribution / requiredContrib) : 1;
  const nextSlots = nextRank ? (RANK_RECRUIT_SLOTS[nextRank] ?? 0) : followerSlots;

  const rankLabel = DISCIPLE_RANK_LABEL[currentRank] ?? currentRank;
  const rankDesc = DISCIPLE_RANK_DESC[currentRank] ?? '';

  content.innerHTML = `
    <div style="max-width:560px;margin:auto;padding:20px 10px;">

      <!-- 身份卡片 -->
      <div style="background:rgba(231,76,60,0.08);border:2px solid rgba(231,76,60,0.25);border-radius:12px;padding:24px;margin-bottom:20px;text-align:center;">
        <div style="font-size:12px;color:var(--text-dim);letter-spacing:3px;margin-bottom:8px;">🏯 江 湖 身 份</div>
        <div style="font-size:28px;color:#e87d72;letter-spacing:3px;margin-bottom:6px;">${rankLabel}</div>
        <div style="font-size:18px;color:var(--text-light);letter-spacing:2px;">${sectName}</div>
        <div style="font-size:12px;color:var(--text-dim);margin-top:10px;line-height:1.7;">${rankDesc}</div>
      </div>

      <!-- 势力概况 -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:20px;">
        <div style="background:var(--card-bg);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;">💰 资源</div>
          <div style="font-size:18px;color:var(--text-gold);">${resources}</div>
        </div>
        <div style="background:var(--card-bg);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;">🏛️ 稳定</div>
          <div style="font-size:18px;color:#c39bd3;">${stability}</div>
        </div>
        <div style="background:var(--card-bg);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;">🏘️ 繁荣</div>
          <div style="font-size:18px;color:#5dade2;">${prosperity}</div>
        </div>
        <div style="background:var(--card-bg);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;">⚡ 力量</div>
          <div style="font-size:18px;color:#e87d72;">${powerEstimate}</div>
        </div>
      </div>

      <!-- 当前身份权益 -->
      <div style="background:var(--card-bg);border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="font-size:13px;color:var(--text-light);letter-spacing:2px;margin-bottom:14px;">📜 ${rankLabel} 权益</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px;">
            <div style="font-size:10px;color:var(--text-dim);margin-bottom:6px;">👥 随从名额</div>
            <div style="font-size:22px;color:var(--text-gold);">
              ${currentFollowers}<span style="font-size:14px;color:var(--text-dim);">/${followerSlots}</span>
            </div>
            <div style="font-size:10px;color:var(--text-dim);margin-top:4px;">${followerSlots > 0 ? `已招募 ${currentFollowers} 人` : '外门弟子无权招募随从'}</div>
          </div>
          <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px;">
            <div style="font-size:10px;color:var(--text-dim);margin-bottom:6px;">🎖️ 招募上限</div>
            <div style="font-size:22px;color:#c39bd3;">${followerCapLabel}</div>
            <div style="font-size:10px;color:var(--text-dim);margin-top:4px;">最多招募至此身份</div>
          </div>
        </div>
        ${nextRank ? `
        <div style="margin-top:14px;padding:12px;background:rgba(231,76,60,0.06);border-radius:8px;">
          <div style="font-size:11px;color:var(--text-dim);margin-bottom:4px;">
            晋升至 <span style="color:#e87d72;">${DISCIPLE_RANK_LABEL[nextRank]}</span> 后：
          </div>
          <div style="font-size:12px;color:var(--text-light);">
            随从名额 ${followerSlots} → <span style="color:var(--text-gold);">${nextSlots}</span>
            ${nextSlots > followerSlots ? ' <span style="color:#4CAF50;">(+' + (nextSlots - followerSlots) + ')</span>' : ''}
            · 招募上限 ${followerCapLabel} → <span style="color:#c39bd3;">${DISCIPLE_RANK_LABEL[RECRUIT_RANK_CAP[nextRank] ?? 'outer'] ?? '—'}</span>
          </div>
        </div>
        ` : ''}
      </div>

      <!-- 贡献 & 晋升进度（仅查看，晋升在角色属性面板进行） -->
      <div style="background:var(--card-bg);border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:13px;color:var(--text-light);letter-spacing:1px;">🏅 宗门贡献</span>
          <span style="font-size:20px;color:var(--text-gold);font-weight:bold;">${contribution}</span>
        </div>
        ${nextRank ? `
        <div style="margin-bottom:8px;">
          <div style="font-size:11px;color:var(--text-dim);margin-bottom:4px;">
            下一阶：<span style="color:#e87d72;">${DISCIPLE_RANK_LABEL[nextRank]}</span> — 需要 ${requiredContrib} 贡献
          </div>
          <div style="background:rgba(255,255,255,0.06);border-radius:6px;height:14px;overflow:hidden;">
            <div style="background:linear-gradient(90deg,#e74c3c,#c0392b);height:100%;width:${Math.floor(progress * 100)}%;border-radius:6px;transition:width 0.5s;"></div>
          </div>
          <div style="font-size:10px;color:var(--text-dim);text-align:right;margin-top:2px;">${Math.floor(progress * 100)}%</div>
        </div>
        ` : `
        <div style="font-size:11px;color:#e87d72;text-align:center;padding:8px;">已达最高阶位</div>
        `}
        <div style="font-size:10px;color:var(--text-dim);text-align:center;margin-top:8px;padding:6px;background:rgba(255,255,255,0.02);border-radius:4px;">
          💡 晋升需在 <span style="color:var(--text-gold);">角色属性</span> 面板完成试炼任务
        </div>
      </div>

      <!-- 进阶路线 -->
      <div style="background:var(--card-bg);border-radius:12px;padding:20px;">
        <div style="font-size:13px;color:var(--text-light);letter-spacing:2px;margin-bottom:14px;">📋 宗门进阶之路</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${DISCIPLE_RANK_ORDER.map((r, i) => {
            const label = DISCIPLE_RANK_LABEL[r];
            const isCurrent = r === currentRank;
            const isPast = DISCIPLE_RANK_ORDER.indexOf(currentRank) >= i;
            const req = PROMOTION_CONTRIBUTION[r];
            const slots = RANK_RECRUIT_SLOTS[r] ?? 0;
            return `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:6px;${isCurrent ? 'background:rgba(231,76,60,0.12);border:1px solid rgba(231,76,60,0.3);' : isPast ? 'opacity:0.4;' : 'opacity:0.7;'}">
              <span style="font-size:16px;">${isPast ? '✅' : isCurrent ? '📍' : '⬜'}</span>
              <span style="flex:1;font-size:13px;color:${isCurrent ? '#e87d72' : 'var(--text-light)'};letter-spacing:1px;">${label}</span>
              ${req ? `<span style="font-size:10px;color:var(--text-dim);">${req} 贡献</span>` : ''}
              <span style="font-size:10px;color:var(--text-dim);">👥×${slots}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

    </div>`;
}
