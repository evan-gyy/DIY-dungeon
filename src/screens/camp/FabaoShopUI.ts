/**
 * src/screens/camp/FabaoShopUI.ts — 法器商店 UI 覆盖层
 *
 * 两个商店：
 * 1. 宗门贡献兑换（sect_fabao_shop）：全图鉴，贡献购买
 * 2. 城池灵宝阁（city_fabao_shop）：随机商品，铜钱购买
 */

import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { showToast } from '../../ui/toast';
import { getRealmByLevel } from '../../data/types';
import { REALM_COLORS } from '../../data/types';
import { FABAO } from '../../data/fabao';
import type { FabaoId, FabaoRealm } from '../../data/types';
import type { FabaoData } from '../../data/types';
import {
  getSectShopCatalog,
  generateCityShop,
  buyFabaoByContribution,
  buyFabaoByGold,
} from '../../systems/FabaoShop';
import {
  getSectPillShop,
  getCityPillShop,
  buyPillByContribution,
  buyPillByGold,
  PILL_UNLOCK_NAMES,
} from '../../systems/BreakthroughPill';

// ═════════════════════════════════════════════════════════
//  通用渲染函数
// ═════════════════════════════════════════════════════════

/** 更新玩家法器列表 & 保存 */
function addFabaoToPlayer(fabaoId: FabaoId): void {
  const p = getPlayer();
  const updated = {
    ...p,
    ownedFabao: [...(p.ownedFabao ?? []), fabaoId],
  };
  setPlayer(updated);
  saveGame(updated);
}

/** 扣除贡献值 */
function deductContribution(amount: number): void {
  const p = getPlayer();
  const updated = {
    ...p,
    sectContribution: (p.sectContribution ?? 0) - amount,
    contributionLog: [
      ...(p.contributionLog ?? []),
      { amount: -amount, source: 'fabao_shop', reason: '法器兑换', timestamp: Date.now() },
    ],
  };
  setPlayer(updated);
  saveGame(updated);
}

/** 扣除铜钱 */
function deductGold(amount: number): void {
  const p = getPlayer();
  const updated = { ...p, gold: p.gold - amount };
  setPlayer(updated);
  saveGame(updated);
}

/** 渲染法宝属性标签 */
function renderStatTags(f: FabaoData): string {
  const parts: string[] = [];
  if (f.atkBonus) parts.push(`<span class="fshop-stat-tag atk">⚔️ +${f.atkBonus}</span>`);
  if (f.defBonus) parts.push(`<span class="fshop-stat-tag def">🛡️ +${f.defBonus}</span>`);
  if (f.hpBonus) parts.push(`<span class="fshop-stat-tag hp">❤️ +${f.hpBonus}</span>`);
  if (f.specialEffect) parts.push(`<span class="fshop-stat-tag spe">✨ ${f.specialEffect.desc}</span>`);
  return parts.join('');
}

/** 获取境界中文名 */
function realmName(r: FabaoRealm): string {
  return REALM_COLORS[r]?.name ?? r;
}

/** 渲染突破丹药区域 */
function renderPillSection(
  pills: Array<{ pill: import('../../systems/BreakthroughPill').PillDef; cost: number; alreadyUsed: boolean }>,
  currency: 'contribution' | 'gold',
): string {
  if (pills.length === 0) return '';

  const currencyIcon = currency === 'contribution' ? '🏅' : '💰';
  const currencyLabel = currency === 'contribution' ? '贡献' : '铜钱';
  const unitLabel = currency === 'gold' ? ' 两' : '';

  const itemsHtml = pills.map(({ pill, cost, alreadyUsed }) => {
    const unlockName = PILL_UNLOCK_NAMES[pill.unlockRealm] || pill.unlockRealm;
    return `<div class="fshop-item pill-item ${alreadyUsed ? 'owned' : ''}">
      <div class="fshop-item-icon pill-icon">${pill.icon}</div>
      <div class="fshop-item-info">
        <div class="fshop-item-name" style="color:#ff9800">${pill.name}</div>
        <div class="fshop-item-desc">${pill.desc}</div>
        <div class="fshop-item-stats">
          <span class="fshop-stat-tag spe">✨ 解锁${unlockName}突破</span>
        </div>
      </div>
      <div class="fshop-item-price">
        <span class="fshop-price-label">${currencyLabel}</span>
        <span class="fshop-price-value">${currencyIcon} ${cost}${unitLabel}</span>
        ${alreadyUsed
          ? '<button class="fshop-buy-btn owned" disabled>已解锁</button>'
          : `<button class="fshop-buy-btn pill-buy-btn" data-pill-id="${pill.id}" data-cost="${cost}" data-currency="${currency}">兑 换</button>`
        }
      </div>
    </div>`;
  }).join('');

  return `<div class="fshop-realm-group pill-group">
    <div class="fshop-realm-header pill-header" style="border-left:3px solid #ff9800; color:#ff9800">
      💊 突破丹药
    </div>
    ${itemsHtml}
  </div>`;
}

// ═════════════════════════════════════════════════════════
//  宗门贡献兑换 覆盖层
// ═════════════════════════════════════════════════════════

export function showSectShopOverlay(): void {
  const p = getPlayer();
  const realm = getRealmByLevel(p.level);
  const catalog = getSectShopCatalog(realm);
  const contribution = p.sectContribution ?? 0;
  const owned = new Set(p.ownedFabao ?? []);

  // 移除旧弹窗
  document.getElementById('fabao-shop-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'fabao-shop-overlay';
  overlay.className = 'fabao-shop-overlay';

  // 按境界分组
  const groups = new Map<FabaoRealm, typeof catalog>();
  const realmOrder: FabaoRealm[] = ['lianqi', 'zhuji', 'jiedan', 'yuanying', 'huashen', 'dujie', 'dacheng', 'feisheng'];
  for (const r of realmOrder) {
    groups.set(r, []);
  }
  for (const item of catalog) {
    groups.get(item.fabao.realm)?.push(item);
  }

  // 获取突破丹药
  const pillShop = getSectPillShop();
  const pillEntries = pillShop.map(p => ({
    pill: p.pill,
    cost: p.contributionCost,
    alreadyUsed: p.alreadyUsed,
  }));
  const pillSectionHtml = renderPillSection(pillEntries, 'contribution');

  // 渲染分组
  let catalogHtml = '';
  for (const r of realmOrder) {
    const items = groups.get(r);
    if (!items || items.length === 0) continue;
    const rc = REALM_COLORS[r];
    const itemsHtml = items.map(item => {
      const f = item.fabao;
      const alreadyOwned = owned.has(f.id);
      return `<div class="fshop-item ${alreadyOwned ? 'owned' : ''}">
        <div class="fshop-item-icon">${f.icon}</div>
        <div class="fshop-item-info">
          <div class="fshop-item-name" style="color:${f.colorCss}">${f.name}</div>
          <div class="fshop-item-desc">${f.desc}</div>
          <div class="fshop-item-stats">${renderStatTags(f)}</div>
        </div>
        <div class="fshop-item-price">
          <span class="fshop-price-label">贡献</span>
          <span class="fshop-price-value">🏅 ${item.contributionCost}</span>
          ${alreadyOwned
            ? '<button class="fshop-buy-btn owned" disabled>已拥有</button>'
            : contribution < item.contributionCost
              ? '<button class="fshop-buy-btn poor" disabled>贡献不足</button>'
              : `<button class="fshop-buy-btn" data-fabao-id="${f.id}" data-cost="${item.contributionCost}" data-currency="contribution">兑 换</button>`
          }
        </div>
      </div>`;
    }).join('');

    catalogHtml += `<div class="fshop-realm-group">
      <div class="fshop-realm-header" style="border-left:3px solid ${rc.css}; color:${rc.css}">
         ${rc.name}期 · ${rc.color}
      </div>
      ${itemsHtml}
    </div>`;
  }

  overlay.innerHTML = `
    <div class="fshop-container">
      <div class="fshop-header">
        <div class="fshop-title">🏪 宗门贡献兑换</div>
        <div class="fshop-player-contrib">
          <span class="fshop-contrib-icon">🏅</span>
          当前贡献：<strong>${contribution}</strong>
        </div>
      </div>
      <div class="fshop-body">${pillSectionHtml}${catalogHtml || '<p class="fshop-empty">暂无可兑换的法宝</p>'}</div>
      <button class="fshop-close-btn">关 闭</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // 绑定购买按钮（法器和丹药）
  overlay.querySelectorAll<HTMLElement>('.fshop-buy-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pillId = btn.dataset['pillId'];
      const fabaoId = btn.dataset['fabaoId'] as FabaoId | undefined;
      const cost = Number(btn.dataset['cost']);

      // 丹药购买
      if (pillId) {
        const result = buyPillByContribution(pillId, cost);
        showToast(result.message);
        if (result.success) {
          overlay.remove();
          showSectShopOverlay();
        }
        return;
      }

      // 法器购买
      if (!fabaoId) return;
      const current = getPlayer();
      const result = buyFabaoByContribution(
        current.ownedFabao ?? [], current.sectContribution ?? 0, fabaoId, cost,
      );

      if (!result.success) {
        showToast(result.message);
        return;
      }

      deductContribution(cost);
      addFabaoToPlayer(fabaoId);
      const fabao = FABAO[fabaoId];
      showToast(`✅ 兑换成功！获得了【${fabao?.name ?? fabaoId}】`);

      // 刷新弹窗
      overlay.remove();
      showSectShopOverlay();
    });
  });

  // 关闭
  bindOverlayClose(overlay);
}

// ═════════════════════════════════════════════════════════
//  城池灵宝阁 覆盖层
// ═════════════════════════════════════════════════════════

export function showCityShopOverlay(): void {
  const p = getPlayer();
  const realm = getRealmByLevel(p.level);
  const items = generateCityShop(realm);
  const owned = new Set(p.ownedFabao ?? []);

  // 获取突破丹药
  const cityPillShop = getCityPillShop();
  const cityPillEntries = cityPillShop.map(p => ({
    pill: p.pill,
    cost: p.goldCost,
    alreadyUsed: p.alreadyUsed,
  }));
  const cityPillSectionHtml = renderPillSection(cityPillEntries, 'gold');

  document.getElementById('fabao-shop-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'fabao-shop-overlay';
  overlay.className = 'fabao-shop-overlay';

  const itemsHtml = items.length === 0
    ? '<p class="fshop-empty">灵宝阁暂时无货，请改日再来。</p>'
    : items.map(item => {
        const f = item.fabao;
        const alreadyOwned = owned.has(f.id);
        const rc = REALM_COLORS[f.realm];
        return `<div class="fshop-item ${alreadyOwned ? 'owned' : ''}">
          <div class="fshop-item-icon">${f.icon}</div>
          <div class="fshop-item-info">
            <div class="fshop-item-name" style="color:${f.colorCss}">${f.name}</div>
            <span class="fshop-item-realm-badge" style="background:${rc.css}20;color:${rc.css};border:1px solid ${rc.css}40">${rc.name}期</span>
            <div class="fshop-item-desc">${f.desc}</div>
            <div class="fshop-item-stats">${renderStatTags(f)}</div>
          </div>
          <div class="fshop-item-price">
            <span class="fshop-price-label">铜钱</span>
            <span class="fshop-price-value">💰 ${item.goldCost} 两</span>
            ${alreadyOwned
              ? '<button class="fshop-buy-btn owned" disabled>已拥有</button>'
              : p.gold < item.goldCost
                ? '<button class="fshop-buy-btn poor" disabled>铜钱不足</button>'
                : `<button class="fshop-buy-btn" data-fabao-id="${f.id}" data-cost="${item.goldCost}" data-currency="gold">购 买</button>`
            }
          </div>
        </div>`;
      }).join('');

  overlay.innerHTML = `
    <div class="fshop-container">
      <div class="fshop-header city">
        <div class="fshop-title">🏬 灵 宝 阁</div>
        <div class="fshop-subtitle">随机法宝 · 铜钱交易 · 淘到就是赚到</div>
        <div class="fshop-player-gold">
          💰 持有铜钱：<strong>${p.gold} 两</strong>
        </div>
      </div>
      <div class="fshop-body">${cityPillSectionHtml}${itemsHtml}</div>
      <button class="fshop-close-btn">关 闭</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // 绑定购买按钮（法器和丹药）
  overlay.querySelectorAll<HTMLElement>('.fshop-buy-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pillId = btn.dataset['pillId'];
      const fabaoId = btn.dataset['fabaoId'] as FabaoId | undefined;
      const cost = Number(btn.dataset['cost']);

      // 丹药购买
      if (pillId) {
        const result = buyPillByGold(pillId, cost);
        showToast(result.message);
        if (result.success) {
          overlay.remove();
          showCityShopOverlay();
        }
        return;
      }

      // 法器购买
      if (!fabaoId) return;

      const current = getPlayer();
      const result = buyFabaoByGold(
        current.ownedFabao ?? [], current.gold, fabaoId, cost,
      );

      if (!result.success) {
        showToast(result.message);
        return;
      }

      deductGold(cost);
      addFabaoToPlayer(fabaoId);
      const fabao = FABAO[fabaoId];
      showToast(`✅ 购买成功！获得了【${fabao?.name ?? fabaoId}】`);

      // 刷新弹窗
      overlay.remove();
      showCityShopOverlay();
    });
  });

  bindOverlayClose(overlay);
}

// ═════════════════════════════════════════════════════════
//  通用关闭逻辑
// ═════════════════════════════════════════════════════════

function bindOverlayClose(overlay: HTMLElement): void {
  overlay.querySelector('.fshop-close-btn')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
