import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { SKILLS } from '../../data/skills';
import { showToast } from '../../ui/toast';
import type { SkillId } from '../../data/types';

const TYPE_TAG: Record<string, string> = { attack: '攻击', support: '辅助', control: '控制', passive: '被动' };
const TYPE_CLASS: Record<string, string> = { attack: 'tag-attack', support: 'tag-support', control: 'tag-control', passive: 'tag-passive' };

export function renderSkillPanel(content: HTMLElement): void {
  const p = getPlayer();

  const equippedHtml = `<div class="skill-slots">${
    p.equippedSkills.map((skId, i) => {
      const sk = skId ? SKILLS[skId] : null;
      return `<div class="skill-equip-slot ${sk ? '' : 'empty'}" title="${sk ? sk.name : '空槽'}" data-skill-slot="${i}" data-unequip="${skId ?? ''}">
        ${sk ? sk.icon : '＋'}
        <span class="slot-label">${sk ? sk.name : '空槽'}</span>
      </div>`;
    }).join('')
  }</div>`;

  const passives = p.skills.filter(id => SKILLS[id]?.type === 'passive');
  const actives  = p.skills.filter(id => SKILLS[id]?.type !== 'passive');

  let listHtml = '<div class="skill-list">';
  if (p.skills.length === 0) {
    listHtml += `<p style="color:var(--text-dim);font-size:13px;padding:20px 0;letter-spacing:1px;">尚未学会任何武功，前往「学功」处跟传功长老学习吧。</p>`;
  } else {
    if (passives.length > 0) {
      listHtml += `<div style="font-size:11px;color:#8e44ad;letter-spacing:2px;margin-bottom:6px;">── 被动天赋（始终生效，无需装备） ──</div>`;
      for (const skId of passives) {
        const sk = SKILLS[skId];
        if (!sk) continue;
        listHtml += `<div class="skill-item" style="border-color:rgba(142,68,173,0.3);">
          <span class="skill-icon">${sk.icon}</span>
          <div class="skill-info"><div class="skill-name">${sk.name}</div><div class="skill-desc">${sk.desc}</div></div>
          <span class="skill-tag tag-passive">被动</span>
          <span class="skill-mp">永久</span>
        </div>`;
      }
    }
    if (actives.length > 0) {
      listHtml += `<div style="font-size:11px;color:var(--text-dim);letter-spacing:2px;margin-top:12px;margin-bottom:6px;">── 主动武学（点击装备/卸下） ──</div>`;
      for (const skId of actives) {
        const sk = SKILLS[skId];
        if (!sk) continue;
        const equipped = p.equippedSkills.includes(skId);
        listHtml += `<div class="skill-item ${equipped ? 'equipped' : ''}" data-toggle-skill="${skId}">
          <span class="skill-icon">${sk.icon}</span>
          <div class="skill-info">
            <div class="skill-name">${sk.name} ${equipped ? '✓' : ''}</div>
            <div class="skill-desc">${sk.desc}</div>
          </div>
          <span class="skill-tag ${TYPE_CLASS[sk.type] ?? ''}">${TYPE_TAG[sk.type] ?? sk.type}</span>
          <span class="skill-mp">${sk.mp > 0 ? '💧' + sk.mp : '被动'}</span>
        </div>`;
      }
    }
  }
  listHtml += '</div>';

  content.innerHTML = `
    <div class="title-deco"><h2>技能配置</h2></div>
    <p style="font-size:12px;color:var(--text-dim);letter-spacing:1px;margin-bottom:8px;">点击技能可装备/卸下（最多4个上阵技能）</p>
    <p style="font-size:12px;color:var(--text-dim);letter-spacing:1px;margin-bottom:16px;">📜 当前武学经验：<strong style="color:#5dade2;">${p.exp}</strong> 点</p>
    ${equippedHtml}
    <div class="title-deco" style="margin-top:8px;margin-bottom:8px;"><h2 style="font-size:15px;">已学武功</h2></div>
    ${listHtml}
  `;

  // unequip from slot
  content.querySelectorAll<HTMLElement>('[data-unequip]').forEach(el => {
    el.addEventListener('click', () => {
      const skId = el.dataset['unequip'];
      if (!skId) return;
      const player = getPlayer();
      const updated = {
        ...player,
        equippedSkills: player.equippedSkills.map(s => s === skId ? null : s) as typeof player.equippedSkills,
      };
      setPlayer(updated);
      saveGame(updated);
      showToast(`已卸下 ${SKILLS[skId as SkillId]?.name ?? skId}`);
      renderSkillPanel(content);
    });
  });

  // toggle equip from list
  content.querySelectorAll<HTMLElement>('[data-toggle-skill]').forEach(el => {
    el.addEventListener('click', () => {
      const skId = el.dataset['toggleSkill'] as SkillId;
      if (!skId) return;
      const player = getPlayer();
      const idx = player.equippedSkills.indexOf(skId);
      if (idx >= 0) {
        const updated = {
          ...player,
          equippedSkills: player.equippedSkills.map(s => s === skId ? null : s) as typeof player.equippedSkills,
        };
        setPlayer(updated);
        saveGame(updated);
        showToast(`已卸下 ${SKILLS[skId]?.name}`);
      } else {
        const emptyIdx = player.equippedSkills.indexOf(null);
        if (emptyIdx < 0) { showToast('技能栏已满（最多4格），请先卸下一个技能'); return; }
        const updated = {
          ...player,
          equippedSkills: player.equippedSkills.map((s, i) => i === emptyIdx ? skId : s) as typeof player.equippedSkills,
        };
        setPlayer(updated);
        saveGame(updated);
        showToast(`已装备 ${SKILLS[skId]?.name}`);
      }
      renderSkillPanel(content);
    });
  });
}
