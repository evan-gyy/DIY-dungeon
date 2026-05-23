import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { checkLevelUp, getRealmName, getExpForLevel, spendCultivationPoint, ATTR_BOOST_DEFS, isRealmMaxLevel, canBreakThrough, breakThroughRealm, getMajorRealmId, MAJOR_REALM_NAMES } from '../../state/LevelSystem';
import { SECTS } from '../../data/sects';
import { showToast } from '../../ui/toast';
import type { AttrKey, EnemyId } from '../../data/types';
import { canPromote, executePromotion, getRankLabel, getContributionProgress } from '../../systems/PromotionSystem';
import { initBattle } from '../../systems/BattleEngine';
import { bus } from '../../ui/events';
import { getActiveTitle, hasTitle, activateTitle, deactivateTitle, getTitleBonus } from '../../systems/TitleSystem';
import { ALL_TITLES, type TitleDef } from '../../data/titles';

/** 称号选择区 */
function renderTitleSection(): string {
  const p = getPlayer();
  const active = getActiveTitle(p);
  const unlocked = ALL_TITLES.filter(t => hasTitle(p, t.id));
  const locked = ALL_TITLES.filter(t => !hasTitle(p, t.id)).slice(0, 5); // 只显示前5个未解锁的

  const activeHtml = active
    ? `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(46,204,113,0.12);border:1px solid rgba(46,204,113,0.3);border-radius:6px;margin-bottom:10px;">
        <span style="font-size:18px;">🏆</span>
        <div style="flex:1;">
          <div style="font-size:13px;color:#2ecc71;letter-spacing:1px;">${active.name}</div>
          <div style="font-size:10px;color:var(--text-dim);">${active.desc}</div>
        </div>
        <button class="btn btn-xs" data-title-deactivate style="opacity:0.7;">✕ 卸下</button>
      </div>`
    : `<div style="padding:6px 10px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08);border-radius:6px;margin-bottom:10px;text-align:center;font-size:11px;color:var(--text-dim);">
        🏷️ 尚未激活称号
      </div>`;

  const unlockedHtml = unlocked.length > 0
    ? `<div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;margin-bottom:4px;">已解锁称号（${unlocked.length}）：</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
        ${unlocked.filter(t => t.id !== (active?.id ?? '')).map(t => `
          <button class="btn btn-xs" data-title-activate="${t.id}" style="font-size:10px;padding:3px 8px;background:rgba(52,152,219,0.1);border:1px solid rgba(52,152,219,0.25);border-radius:4px;color:#3498db;cursor:pointer;">
            ${t.name}
          </button>`).join('')}
      </div>`
    : '';

  const lockedHtml = locked.length > 0
    ? `<div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;">未解锁：${locked.map(t => t.name).join(' · ')}${ALL_TITLES.length - unlocked.length > 5 ? ' …' : ''}</div>`
    : '';

  return `<div style="margin-bottom:20px;padding:12px 16px;background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:6px;">
    <div style="font-size:12px;color:#c9a84c;letter-spacing:2px;margin-bottom:10px;">🏆 称号</div>
    ${activeHtml}
    ${unlockedHtml}
    ${lockedHtml}
  </div>`;
}

export function renderAttrPanel(content: HTMLElement): void {
  const p = getPlayer();
  const sect = SECTS[p.sect] ?? { icon: '⚔️', name: '', intro: '' };
  const lv = p.level;
  const exp = p.exp;
  const expNeeded = getExpForLevel(lv);
  const atRealmMax = isRealmMaxLevel(lv);
  const expPct = atRealmMax ? 100 : Math.min(100, Math.floor(exp / expNeeded * 100));
  const realmName = getRealmName(lv);
  const cultPt = p.cultivationPoints;
  const ab = p.attrBoosts;

  // 🆕 检查是否可以突破大境界
  const breakCheck = canBreakThrough(p);
  const canBreak = breakCheck.success;
  const breakBlocked = atRealmMax && !canBreak && lv > 0;

  const boostBtns = (['hp', 'atk', 'def', 'agi', 'mp'] as AttrKey[]).map(attr => {
    const def = ATTR_BOOST_DEFS[attr];
    const disabled = cultPt <= 0 ? ' style="opacity:0.35;cursor:not-allowed;" disabled' : '';
    return `<button class="btn btn-xs" data-spend-attr="${attr}"${disabled}>${def.label} +${def.amount}</button>`;
  }).join('');

  const tb = getTitleBonus(p);
  const titleBonusVals = {
    hp:  Math.floor(p.maxHp * tb.hpMul),
    mp:  Math.floor(p.maxMp * tb.mpMul),
    atk: Math.floor(p.atk   * tb.atkMul),
    def: Math.floor(p.def   * tb.defMul),
    agi: Math.floor(p.agi   * tb.agiMul),
    crit: tb.critBonus,
  };
  const attrRows = [
    { icon: '❤️', name: '气血上限', base: p.maxHp, boost: ab.hp, tBoost: titleBonusVals.hp },
    { icon: '💧', name: '内力上限', base: p.maxMp, boost: ab.mp, tBoost: titleBonusVals.mp },
    { icon: '⚔️', name: '攻击力',    base: p.atk,   boost: ab.atk, tBoost: titleBonusVals.atk },
    { icon: '🛡️', name: '防御力',    base: p.def,   boost: ab.def, tBoost: titleBonusVals.def },
    { icon: '⚡', name: '速度',      base: p.agi,   boost: ab.agi, tBoost: titleBonusVals.agi },
  ];

  const contrib = p.sectContribution ?? 0;
  const rankLabel = getRankLabel(p.discipleRank);
  const promoCheck = canPromote(p);
  const contribProgress = getContributionProgress(p);
  const contribNeeded = promoCheck.requirement?.minContribution ?? 0;

  // 晋升面板 HTML
  let promoHtml = '';
  if (promoCheck.nextRank) {
    const nextLabel = getRankLabel(promoCheck.nextRank);
    const progPct = Math.floor(contribProgress * 100);
    const progBarColor = contribProgress >= 1 ? '#27ae60' : '#f39c12';

    promoHtml = `
    <div style="margin-bottom:20px;padding:12px 16px;background:rgba(243,156,18,0.06);border:1px solid rgba(243,156,18,0.25);border-radius:6px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:12px;color:#f0b27a;letter-spacing:2px;">🏅 宗门晋升</span>
        <span style="font-size:12px;color:var(--text-dim);">${rankLabel} → <span style="color:#f0b27a;">${nextLabel}</span></span>
      </div>
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:6px;">
        贡献进度：<span style="color:${contribProgress >= 1 ? '#27ae60' : '#f39c12'};">${contrib} / ${contribNeeded}</span>
      </div>
      <div style="height:6px;background:#1a1a2e;border-radius:3px;overflow:hidden;margin-bottom:8px;">
        <div style="height:100%;width:${progPct}%;background:${progBarColor};border-radius:3px;transition:width 0.3s;"></div>
      </div>
      ${promoCheck.trial ? `
      <div style="font-size:11px;color:${promoCheck.trialCompleted ? '#27ae60' : '#e67e22'};margin-bottom:8px;letter-spacing:1px;">
        ${promoCheck.trialCompleted ? '✅' : '⚔️'} 晋升试炼：${promoCheck.trial.title}
        ${!promoCheck.trialCompleted ? '<span style="color:var(--text-dim);">（未完成）</span>' : '<span style="color:#27ae60;">（已完成）</span>'}
        ${promoCheck.trial.description ? `<div style="color:var(--text-dim);font-size:10px;margin-top:3px;">${promoCheck.trial.description}</div>` : ''}
      </div>` : ''}
      ${promoCheck.canPromote ? `
      <button class="btn" id="btn-execute-promotion" style="width:100%;background:linear-gradient(135deg,#27ae60,#2ecc71);color:#fff;padding:8px 16px;font-size:13px;letter-spacing:2px;border:none;border-radius:6px;cursor:pointer;box-shadow:0 0 15px rgba(39,174,96,0.3);">
        🎖️ 申 请 晋 升
      </button>` : (promoCheck.contributionMet && !promoCheck.trialCompleted ? `
      <button class="btn" id="btn-start-trial" style="width:100%;background:linear-gradient(135deg,#e67e22,#d35400);color:#fff;padding:8px 16px;font-size:13px;letter-spacing:2px;border:none;border-radius:6px;cursor:pointer;box-shadow:0 0 15px rgba(230,126,34,0.3);">
        ⚔️ 开 始 试 炼
      </button>` : `
      <div style="font-size:11px;color:#e74c3c;text-align:center;letter-spacing:1px;">⚠ ${promoCheck.reason}</div>`)}
    </div>`;
  }

  content.innerHTML = `
    <div class="title-deco"><h2>角色属性</h2></div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
      <span style="font-size:36px;">${sect.icon}</span>
      <div>
        <div style="font-size:18px;color:var(--text-gold);letter-spacing:3px;">${p.name}</div>
        <div style="font-size:12px;color:var(--text-dim);letter-spacing:2px;margin-top:4px;">${sect.name} · ${rankLabel} · ${realmName}</div>
        <div style="font-size:12px;color:var(--text-dim);margin-top:4px;line-height:1.6;">${sect.intro}</div>
        <div style="font-size:12px;color:#f0b27a;letter-spacing:1px;margin-top:6px;">🏅 宗门贡献：<strong>${contrib}</strong></div>
      </div>
    </div>
    ${promoHtml}
    ${renderTitleSection()}
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
        <span style="font-size:12px;color:${atRealmMax ? '#e74c3c' : 'var(--text-gold)'};">${atRealmMax ? '已满（需突破契机）' : `${exp} / ${expNeeded}`}</span>
      </div>
      <div style="height:8px;background:#1a1a2e;border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${expPct}%;background:${atRealmMax ? 'linear-gradient(90deg,#e74c3c,#c0392b)' : 'linear-gradient(90deg,#5dade2,#9b59b6)'};border-radius:4px;transition:width 0.3s;"></div>
      </div>
      ${breakBlocked ? `<div style="font-size:11px;color:#e74c3c;margin-top:6px;letter-spacing:1px;">⚠ ${breakCheck.reason}</div>` : ''}
      ${canBreak ? `
      <div style="margin-top:10px;text-align:center;">
        <button class="btn" id="btn-break-through" style="background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;padding:8px 24px;font-size:14px;letter-spacing:3px;border:none;border-radius:6px;cursor:pointer;box-shadow:0 0 20px rgba(231,76,60,0.4);">
          ⚡ 突 破 境 界
        </button>
      </div>` : ''}
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
            <div class="attr-value">${a.base}${a.boost > 0 ? ` <span style="color:#9b59b6;font-size:11px;">(+${a.boost})</span>` : ''}${a.tBoost > 0 ? ` <span style="color:#c9a84c;font-size:11px;">(+${a.tBoost}称号)</span>` : ''}</div>
          </div>
        </div>`).join('')}
      <div class="attr-card"><span class="attr-icon">🎯</span><div class="attr-info"><div class="attr-name">暴击率</div><div class="attr-value">${p.crit}%${titleBonusVals.crit > 0 ? ` <span style="color:#c9a84c;font-size:11px;">(+${(titleBonusVals.crit * 100).toFixed(0)}%称号)</span>` : ''}</div></div></div>
      <div class="attr-card"><span class="attr-icon">⭐</span><div class="attr-info"><div class="attr-name">境界</div><div class="attr-value">Lv.${lv} ${realmName}</div></div></div>
      <div class="attr-card"><span class="attr-icon">💰</span><div class="attr-info"><div class="attr-name">金两</div><div class="attr-value">${p.gold}</div></div></div>
    </div>
  `;

  // 🆕 绑定突破按钮
  const breakBtn = content.querySelector('#btn-break-through');
  if (breakBtn) {
    breakBtn.addEventListener('click', () => {
      const result = breakThroughRealm(getPlayer());
      if (!result.success) {
        showToast(result.reason || '突破失败。');
        return;
      }
      setPlayer(result.updatedPlayer!);
      saveGame(getPlayer());
      const newRealm = getRealmName(result.newLevel!);
      showToast(`⚡ 突破成功！晋升至 ${newRealm}！`);
      renderAttrPanel(content);
    });
  }

  // 🆕 绑定晋升试炼按钮
  const trialBtn = content.querySelector('#btn-start-trial');
  if (trialBtn) {
    trialBtn.addEventListener('click', () => {
      const player = getPlayer();
      const check = canPromote(player);
      if (!check.trial || !check.nextRank) {
        showToast('无法开始试炼。');
        return;
      }

      // 设置一次性试炼胜利监听
      const onBattleEnd = (data: { result: string }) => {
        bus.off('battle:end', onBattleEnd);
        if (data.result !== 'win') {
          showToast('试炼失败，再接再厉！');
          renderAttrPanel(content);
          return;
        }

        // 胜利 → 标记试炼完成
        if (check.trial) {
          const currentPlayer = getPlayer();
          const trialId = check.requirement?.trialId ?? check.trial.id;
          const updated: typeof currentPlayer = {
            ...currentPlayer,
            completedTrials: [...(currentPlayer.completedTrials || []), trialId],
            contributionLog: [
              ...(currentPlayer.contributionLog || []),
              {
                amount: check.trial.rewardContribution,
                source: 'promotion_trial',
                reason: `完成晋升试炼「${check.trial.title}」`,
                timestamp: Date.now(),
              },
            ],
            sectContribution: (currentPlayer.sectContribution || 0) + check.trial.rewardContribution,
            exp: (currentPlayer.exp || 0) + check.trial.rewardExp,
          };
          setPlayer(updated);
          saveGame(updated);
          showToast(`试炼通过！获得贡献 +${check.trial.rewardContribution}，经验 +${check.trial.rewardExp}`);
        }
        renderAttrPanel(content);
      };

      bus.on('battle:end', onBattleEnd);

      // 启动战斗
      const enemyId = (check.trial.enemyId ?? 'shadow_scout') as EnemyId;
      initBattle(enemyId);
      showToast(`⚔️ 试炼开始：「${check.trial.title}」`);
    });
  }

  // 🆕 绑定直接晋升按钮（试炼已完成的情况）
  const promoBtn = content.querySelector('#btn-execute-promotion');
  if (promoBtn) {
    promoBtn.addEventListener('click', () => {
      const player = getPlayer();
      const result = executePromotion(player);
      if (!result.success) {
        showToast(result.reason || '晋升失败。');
        return;
      }
      setPlayer(result.updatedPlayer!);
      saveGame(getPlayer());
      checkLevelUp(getPlayer());
      const newLabel = getRankLabel(result.newRank!);
      showToast(`🎖️ 晋升成功！你已是${newLabel}！`);
      renderAttrPanel(content);
    });
  }

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

  // bind title activate buttons
  content.querySelectorAll<HTMLButtonElement>('[data-title-activate]').forEach(btn => {
    btn.addEventListener('click', () => {
      const titleId = btn.dataset['titleActivate'];
      if (!titleId) return;
      const result = activateTitle(getPlayer(), titleId);
      showToast(result.message);
      if (result.success) {
        saveGame(getPlayer());
        renderAttrPanel(content);
      }
    });
  });

  // bind title deactivate button
  const deactivateBtn = content.querySelector<HTMLButtonElement>('[data-title-deactivate]');
  if (deactivateBtn) {
    deactivateBtn.addEventListener('click', () => {
      deactivateTitle(getPlayer());
      saveGame(getPlayer());
      showToast('已卸下称号。');
      renderAttrPanel(content);
    });
  }
}
