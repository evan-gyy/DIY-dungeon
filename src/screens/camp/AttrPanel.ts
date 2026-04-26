import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { checkLevelUp, getRealmName, getExpForLevel, spendCultivationPoint, ATTR_BOOST_DEFS } from '../../state/LevelSystem';
import { SECTS } from '../../data/sects';
import { showToast } from '../../ui/toast';
import type { AttrKey } from '../../data/types';

export function renderAttrPanel(content: HTMLElement): void {
  const p = getPlayer();
  const sect = SECTS[p.sect] ?? { icon: '⚔️', name: '', intro: '' };
  const lv = p.level;
  const exp = p.exp;
  const expNeeded = getExpForLevel(lv);
  const expPct = Math.min(100, Math.floor(exp / expNeeded * 100));
  const realmName = getRealmName(lv);
  const cultPt = p.cultivationPoints;
  const ab = p.attrBoosts;

  const boostBtns = (['hp', 'atk', 'def', 'agi', 'mp'] as AttrKey[]).map(attr => {
    const def = ATTR_BOOST_DEFS[attr];
    const disabled = cultPt <= 0 ? ' style="opacity:0.35;cursor:not-allowed;" disabled' : '';
    return `<button class="btn btn-xs" data-spend-attr="${attr}"${disabled}>${def.label} +${def.amount}</button>`;
  }).join('');

  const attrRows = [
    { icon: '❤️', name: '气血上限', base: p.maxHp, boost: ab.hp },
    { icon: '💧', name: '内力上限', base: p.maxMp, boost: ab.mp },
    { icon: '⚔️', name: '攻击力',    base: p.atk,   boost: ab.atk },
    { icon: '🛡️', name: '防御力',    base: p.def,   boost: ab.def },
    { icon: '⚡', name: '速度',      base: p.agi,   boost: ab.agi },
  ];

  content.innerHTML = `
    <div class="title-deco"><h2>角色属性</h2></div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
      <span style="font-size:36px;">${sect.icon}</span>
      <div>
        <div style="font-size:18px;color:var(--text-gold);letter-spacing:3px;">${p.name}</div>
        <div style="font-size:12px;color:var(--text-dim);letter-spacing:2px;margin-top:4px;">${sect.name} · ${realmName}</div>
        <div style="font-size:12px;color:var(--text-dim);margin-top:4px;line-height:1.6;">${sect.intro}</div>
      </div>
    </div>
    ${cultPt > 0 ? `
    <div style="margin-bottom:10px;padding:10px 14px;background:rgba(155,89,182,0.12);border:1px solid rgba(155,89,182,0.4);border-radius:6px;font-size:12px;color:#c39bd3;letter-spacing:1px;line-height:1.8;">
      🎁 修为突破！可用修为点：<strong>${cultPt}</strong>，请在下方进行属性突破！
    </div>` : ''}
    ${p.skills.length === 0 ? `
    <div style="margin-bottom:10px;padding:10px 14px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:6px;font-size:12px;color:#e74c3c;letter-spacing:1px;">
      ⚠️ 尚未学习任何武功！请前往「拜师学功」学习武学。
    </div>` : ''}
    ${p.skills.length > 0 && p.equippedSkills.filter(Boolean).length === 0 ? `
    <div style="margin-bottom:10px;padding:10px 14px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:6px;font-size:12px;color:#e74c3c;letter-spacing:1px;">
      ⚠️ 有 ${p.skills.length} 门武功未装备！请在「技能配置」中装备后出征。
    </div>` : ''}
    <div style="margin-bottom:20px;padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid var(--border-dim);border-radius:6px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:12px;color:var(--text-dim);letter-spacing:2px;">📖 修为进度</span>
        <span style="font-size:12px;color:var(--text-gold);">${exp} / ${expNeeded}</span>
      </div>
      <div style="height:8px;background:#1a1a2e;border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${expPct}%;background:linear-gradient(90deg,#5dade2,#9b59b6);border-radius:4px;transition:width 0.3s;"></div>
      </div>
    </div>
    ${cultPt > 0 ? `
    <div style="margin-bottom:20px;padding:12px 16px;background:rgba(155,89,182,0.08);border:1px solid rgba(155,89,182,0.3);border-radius:6px;">
      <div style="font-size:12px;color:#9b59b6;letter-spacing:2px;margin-bottom:10px;">🆙 修为突破（可用：<strong>${cultPt}</strong> 点）</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${boostBtns}</div>
    </div>` : ''}
    <div class="attr-grid">
      ${attrRows.map(a => `
        <div class="attr-card">
          <span class="attr-icon">${a.icon}</span>
          <div class="attr-info">
            <div class="attr-name">${a.name}</div>
            <div class="attr-value">${a.base}${a.boost > 0 ? ` <span style="color:#9b59b6;font-size:11px;">(+${a.boost})</span>` : ''}</div>
          </div>
        </div>`).join('')}
      <div class="attr-card"><span class="attr-icon">🎯</span><div class="attr-info"><div class="attr-name">暴击率</div><div class="attr-value">${p.crit}%</div></div></div>
      <div class="attr-card"><span class="attr-icon">⭐</span><div class="attr-info"><div class="attr-name">境界</div><div class="attr-value">Lv.${lv} ${realmName}</div></div></div>
      <div class="attr-card"><span class="attr-icon">💰</span><div class="attr-info"><div class="attr-name">金两</div><div class="attr-value">${p.gold}</div></div></div>
    </div>
  `;

  // bind spend buttons
  content.querySelectorAll<HTMLButtonElement>('[data-spend-attr]').forEach(btn => {
    btn.addEventListener('click', () => {
      const attr = btn.dataset['spendAttr'] as AttrKey;
      const updated = spendCultivationPoint(getPlayer(), attr);
      if (!updated) { showToast('修为点数不足！'); return; }
      setPlayer(updated);
      const lvResult = checkLevelUp(updated);
      if (lvResult.leveled) setPlayer(lvResult.updatedPlayer);
      saveGame(getPlayer());
      const def = ATTR_BOOST_DEFS[attr];
      showToast(`修为精进！${def.label} +${def.amount}`);
      renderAttrPanel(content);
    });
  });
}
