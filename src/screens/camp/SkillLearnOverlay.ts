// ============================================================
//  src/screens/camp/SkillLearnOverlay.ts — 宗门习武技能学习弹窗
// ============================================================
//  在宗门据点点击"习武学功"后弹出，展示本派按境界分层的技能列表。
//  学习条件：达到对应等级 + 贡献值足够 + 未已学习。
//  贡献消耗：炼气20 / 筑基50 / 结丹100 / 元婴200 / 化神400 / 渡劫800
// ============================================================

import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { showToast } from '../../ui/toast';
import { SKILLS } from '../../data/skills';
import { SECT_SKILL_TABLES, getSkillRealm } from '../../data/sectSkillTables';
import type { SectId, SkillId } from '../../data/types';

const REALM_ORDER = [
  { name: '炼气', range: '1-10',   cost: 20,  color: '#e8e8e8', minLv: 1,  maxLv: 10  },
  { name: '筑基', range: '11-20',  cost: 50,  color: '#4caf50', minLv: 11, maxLv: 20  },
  { name: '结丹', range: '21-30',  cost: 100, color: '#42a5f5', minLv: 21, maxLv: 30  },
  { name: '元婴', range: '31-40',  cost: 200, color: '#ab47bc', minLv: 31, maxLv: 40  },
  { name: '化神', range: '41-50',  cost: 400, color: '#ffd700', minLv: 41, maxLv: 50  },
  { name: '渡劫', range: '51-60',  cost: 800, color: '#ff7043', minLv: 51, maxLv: 60  },
];

const SECT_NAME: Partial<Record<SectId, string>> = {
  wudang: '武当', shaolin: '少林', emei: '峨眉', beggar: '丐帮',
  huashan: '华山', maoshan: '茅山', kunlun: '昆仑', qingcheng: '青城',
  tangmen: '唐门', xiaoyao: '逍遥', quanzhen: '全真', kongtong: '崆峒',
  diancang: '点苍', riyue: '日月教',
};

export function showSkillLearnOverlay(): void {
  const p = getPlayer();
  const sect = p.sect as SectId | 'none';

  if (!sect || sect === 'none') {
    showToast('尚未入派，无法习武。');
    return;
  }

  const table = SECT_SKILL_TABLES[sect];
  if (!table) {
    showToast(`${SECT_NAME[sect] ?? sect}的技能习得尚未开放。`);
    return;
  }

  document.getElementById('skill-learn-overlay')?.remove();

  const sectLabel = SECT_NAME[sect] ?? sect;
  const contrib = p.sectContribution ?? 0;

  // 按境界分组构建技能列表 HTML
  const tiersHtml = REALM_ORDER.map(tier => {
    const tierSkills = table.filter(([lv]) => lv >= tier.minLv && lv <= tier.maxLv);
    if (tierSkills.length === 0) return '';

    const skillCards = tierSkills.map(([reqLv, skillId]) => {
      const skill = SKILLS[skillId as SkillId];
      if (!skill) return '';

      const learned  = p.skills?.includes(skillId as SkillId) ?? false;
      const canLevel = p.level >= reqLv;
      const canPay   = contrib >= tier.cost;

      let statusHtml: string;
      let cardClass = 'slp-skill-card';

      if (learned) {
        statusHtml = '<span class="slp-badge learned">✓ 已学</span>';
        cardClass += ' learned';
      } else if (!canLevel) {
        statusHtml = `<span class="slp-badge locked">需 Lv.${reqLv}</span>`;
        cardClass += ' locked';
      } else if (!canPay) {
        statusHtml = `<span class="slp-badge poor">贡献不足</span>`;
        cardClass += ' poor';
      } else {
        statusHtml = `<button class="slp-learn-btn" data-skill="${skillId}" data-cost="${tier.cost}">学 ${tier.cost}贡献</button>`;
        cardClass += ' available';
      }

      return `<div class="${cardClass}">
        <div class="slp-skill-icon">${skill.icon}</div>
        <div class="slp-skill-info">
          <div class="slp-skill-name">${skill.name}</div>
          <div class="slp-skill-desc">${skill.desc.substring(0, 40)}…</div>
        </div>
        ${statusHtml}
      </div>`;
    }).join('');

    return `<div class="slp-tier">
      <div class="slp-tier-header" style="color:${tier.color};">
        ${tier.name}期（Lv ${tier.range}）<span style="font-size:10px;color:var(--text-dim);margin-left:8px;">学习消耗 ${tier.cost} 贡献值</span>
      </div>
      <div class="slp-tier-skills">${skillCards}</div>
    </div>`;
  }).filter(Boolean).join('');

  const overlay = document.createElement('div');
  overlay.id = 'skill-learn-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:350;';

  overlay.innerHTML = `
    <div class="panel slp-panel" style="max-width:560px;width:94%;max-height:88vh;overflow-y:auto;padding:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div>
          <div style="font-size:16px;color:var(--text-gold);letter-spacing:2px;">📖 ${sectLabel}·习武学功</div>
          <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">当前贡献值：<span id="slp-contrib-val" style="color:#4caf50;font-weight:bold;">${contrib}</span></div>
        </div>
        <button class="btn slp-close-btn" id="slp-close">关 闭</button>
      </div>
      <div id="slp-tiers">${tiersHtml || '<p style="text-align:center;color:var(--text-dim);padding:24px;">本派暂无可习技能。</p>'}</div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 关闭
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('slp-close')?.addEventListener('click', () => overlay.remove());

  // 学习按钮
  overlay.querySelectorAll<HTMLElement>('.slp-learn-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const skillId = btn.dataset['skill'] as SkillId;
      const cost    = Number(btn.dataset['cost']);
      if (!skillId || !cost) return;

      const cur = getPlayer();
      if ((cur.skills ?? []).includes(skillId)) {
        showToast('已经学过这门技能了。');
        return;
      }
      if ((cur.sectContribution ?? 0) < cost) {
        showToast(`贡献值不足，需要 ${cost} 贡献值。`);
        return;
      }

      const skillName = SKILLS[skillId]?.name ?? skillId;
      const updated = {
        ...cur,
        skills:          [...(cur.skills ?? []), skillId],
        sectContribution: (cur.sectContribution ?? 0) - cost,
      };
      setPlayer(updated);
      saveGame(updated);

      showToast(`✅ 领悟「${skillName}」！消耗 ${cost} 贡献值。`);
      // 刷新弹窗
      overlay.remove();
      showSkillLearnOverlay();
    });
  });
}
