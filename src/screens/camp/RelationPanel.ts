import { getPlayer } from '../../state/GameState';
import { getNpcStats } from '../../systems/NpcBehavior';
import { TALENTS } from '../../data/realmConfig';
import { getRealmName, getExpForLevel, isRealmMaxLevel } from '../../state/LevelSystem';
import { FABAO } from '../../data/fabao';
import type { NpcStats } from '../../data/npcStats';

interface RelationChar {
  id: string;
  name: string;
  img: string;
  affection: number;
  unlocked: boolean;
  /** NPC 数值卡 ID（对应 npcDatabase 中的 key） */
  npcDbId?: string;
}

function getRelationData(): { heroines: RelationChar[]; wudang: RelationChar[]; other: RelationChar[] } {
  const p = getPlayer();

  const heroines: RelationChar[] = [
    { id: 'liu_qinghan', name: '柳清寒', img: 'picture/Female-main/柳清寒.png', affection: 55, unlocked: p.chapter >= 1, npcDbId: 'liu_qinghan' },
    { id: 'shen_nishang', name: '沈霓裳', img: 'picture/Female-main/沈霓裳.png', affection: 15, unlocked: p.chapter >= 2 && p.act >= 4, npcDbId: 'shen_nishang' },
    { id: 'zhao_qinwei', name: '趙沁微', img: 'picture/Female-main/趙沁微.png', affection: 0,  unlocked: false },
    { id: 'mo_jiangqing', name: '墨绐青', img: 'picture/Female-main/墨绐青.png', affection: 80, unlocked: p.chapter >= 1, npcDbId: 'mo_jiangqing' },
  ];

  const wudang: RelationChar[] = [
    { id: 'zhang_xuansu', name: '张玄素', img: 'picture/NPC/张玄素.png', affection: 20, unlocked: p.chapter >= 2, npcDbId: 'zhang_xuansu' },
    { id: 'chen_jingxu', name: '陈静虚', img: 'picture/NPC/陈静虚.png', affection: 30, unlocked: p.chapter >= 2 && p.act >= 1, npcDbId: 'chen_jingxu' },
    { id: 'song_zhiyuan', name: '宋知远', img: 'picture/NPC/宋知远.png', affection: 35, unlocked: p.chapter >= 2, npcDbId: 'song_zhiyuan' },
    { id: 'gu_xiaosang', name: '顾小桑', img: 'picture/NPC/顾小桑.png', affection: 40, unlocked: p.chapter >= 2, npcDbId: 'gu_xiaosang' },
    { id: 'lu_chengzhou', name: '陆沉舟', img: 'picture/NPC/陆沉舟.png', affection: 10, unlocked: p.chapter >= 2 && p.act >= 3, npcDbId: 'lu_chengzhou' },
    { id: 'ji_wushuang', name: '纪无双', img: 'picture/NPC/纪无双.png', affection: 5, unlocked: p.chapter >= 3 && p.act >= 8, npcDbId: 'ji_wushuang_npc' },
    { id: 'su_yunxiu', name: '苏云绣', img: 'picture/NPC/苏云绣.png', affection: 5, unlocked: p.chapter >= 3 && p.act >= 8, npcDbId: 'su_yunxiu_npc' },
    { id: 'fang_zhonghe', name: '方仲和', img: 'picture/NPC/方仲和.png', affection: 5, unlocked: p.chapter >= 3 && p.act >= 8, npcDbId: 'fang_zhonghe_npc' },
    { id: 'meng_wenyuan', name: '孟文渊', img: 'picture/NPC/孟文渊.png', affection: 3, unlocked: p.chapter >= 3 && p.act >= 9, npcDbId: 'meng_wenyuan' },
    { id: 'ye_ziyi', name: '叶紫衣', img: 'picture/NPC/叶紫衣.png', affection: 5, unlocked: p.chapter >= 3 && p.act >= 9, npcDbId: 'ye_ziyi' },
    { id: 'zhou_boan', name: '周伯安', img: 'picture/NPC/周伯安.png', affection: 15, unlocked: p.chapter >= 2 },
  ];

  const other: RelationChar[] = [
  ];

  return { heroines, wudang, other };
}

function renderCharCard(char: RelationChar): string {
  if (!char.unlocked) {
    return `
      <div class="rel-card locked">
        <div class="rel-card-img-wrap">
          <div class="rel-card-placeholder">?</div>
        </div>
        <div class="rel-card-name">未解锁</div>
      </div>`;
  }
  const npcDbId = char.npcDbId || '';
  return `
    <div class="rel-card" data-npc-db-id="${npcDbId}" data-npc-name="${char.name}" data-npc-img="${char.img}">
      <div class="rel-card-img-wrap">
        <img src="${char.img}" alt="${char.name}" onerror="this.style.display='none'">
      </div>
      <div class="rel-card-name">${char.name}</div>
      <div class="rel-card-aff">❤️ ${char.affection}</div>
    </div>`;
}

function renderSection(icon: string, title: string, chars: RelationChar[]): string {
  const cards = chars.map(renderCharCard).join('');
  const unlockedCount = chars.filter(c => c.unlocked).length;
  const accentColor = title === '女主角' ? '#f0a0b0' : title === '武当派' ? '#c9a84c' : '#8ec8a0';
  return `
    <details class="rel-section" open>
      <summary class="rel-section-title" style="--accent:${accentColor}">
        <span class="rel-section-icon">${icon}</span>
        <span class="rel-section-text">${title}</span>
        <span class="rel-section-badge">✨ ${unlockedCount}/${chars.length} 已结识</span>
        <span class="rel-section-arrow">▼</span>
      </summary>
      <div class="rel-card-grid">${cards}</div>
    </details>`;
}

export function renderRelationPanel(content: HTMLElement): void {
  const { heroines, wudang, other } = getRelationData();
  content.innerHTML = `
    <div class="relation-panel">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <span style="font-size:11px;color:var(--text-dim);letter-spacing:3px;padding:3px 10px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:20px;">人物关系</span>
      </div>
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:16px;">随着剧情推进，你将结识更多江湖人物。好感度会影响后续剧情发展。<br><span style="color:var(--text-gold);">点击立绘可查看角色详细状态。</span></p>
      ${renderSection('🌸', '女主角', heroines)}
      ${renderSection('☯️', '武当派', wudang)}
      ${other.length > 0 ? renderSection('👤', '其他', other) : ''}
    </div>`;

  // 绑定立绘点击事件 → 弹出NPC状态面板
  bindNpcCardEvents(content);
}

// ═══════════════════════════════════════════════════════════
//  NPC 状态弹窗
// ═══════════════════════════════════════════════════════════

function bindNpcCardEvents(content: HTMLElement): void {
  content.querySelectorAll<HTMLElement>('.rel-card:not(.locked)').forEach(card => {
    card.addEventListener('click', () => {
      const npcDbId = card.dataset['npcDbId'];
      const npcName = card.dataset['npcName'] || '';
      const npcImg = card.dataset['npcImg'] || '';
      if (npcDbId) {
        showNpcStatsOverlay(npcDbId, npcName, npcImg);
      }
    });
  });
}

export function showNpcStatsOverlay(npcDbId: string, npcName: string, npcImg: string): void {
  // 移除旧弹窗
  document.getElementById('npc-stats-overlay')?.remove();

  const p = getPlayer();
  const npcDb = p.npcDatabase || {};
  const stats: NpcStats | null = npcDb[npcDbId] || null;

  let bodyHtml = '';
  if (!stats) {
    bodyHtml = `<p style="color:var(--text-dim);text-align:center;padding:20px;">暂无该角色的详细数据。</p>`;
  } else {
    const talent = TALENTS[stats.talent];
    const realm = getRealmName(stats.level);
    const expNeeded = getExpForLevel(stats.level);
    const atMax = isRealmMaxLevel(stats.level);
    const expPct = atMax ? 100 : Math.min(100, Math.floor(stats.exp / expNeeded * 100));
    const fabaoWeapon = stats.equippedFabao.weapon ? FABAO[stats.equippedFabao.weapon] : null;
    const fabaoArmor = stats.equippedFabao.armor ? FABAO[stats.equippedFabao.armor] : null;
    const fabaoAcc = stats.equippedFabao.accessory ? FABAO[stats.equippedFabao.accessory] : null;

    bodyHtml = `
      <div class="npc-stats-body">
        <div class="npc-stats-row">
          <span class="npc-stats-label">修为</span>
          <span class="npc-stats-value" style="color:var(--text-gold);">${realm}</span>
        </div>
        <div class="npc-stats-row">
          <span class="npc-stats-label">修为进度</span>
          <span class="npc-stats-value" style="font-size:11px;color:${atMax ? '#e74c3c' : 'var(--text-dim)'};">${atMax ? '已满（等待突破契机）' : `${stats.exp} / ${expNeeded}`}</span>
        </div>
        <div style="height:4px;background:#1a1a2e;border-radius:2px;overflow:hidden;margin:4px 0 8px;">
          <div style="height:100%;width:${expPct}%;background:${atMax ? '#e74c3c' : 'linear-gradient(90deg,#5dade2,#9b59b6)'};border-radius:2px;"></div>
        </div>
        <div class="npc-stats-row">
          <span class="npc-stats-label">天赋</span>
          <span class="npc-stats-value" style="color:#c084fc;">${talent?.name || '—'}</span>
        </div>
        <div class="npc-stats-row">
          <span class="npc-stats-label">天赋说明</span>
          <span class="npc-stats-value" style="font-size:11px;">${talent?.desc || '—'}</span>
        </div>
        <div class="npc-stats-divider"></div>
        <div class="npc-stats-row">
          <span class="npc-stats-label">❤️ 气血</span>
          <span class="npc-stats-value">${stats.hp} / ${stats.maxHp}</span>
        </div>
        <div class="npc-stats-row">
          <span class="npc-stats-label">💧 内力</span>
          <span class="npc-stats-value">${stats.mp} / ${stats.maxMp}</span>
        </div>
        <div class="npc-stats-row">
          <span class="npc-stats-label">⚔️ 攻击</span>
          <span class="npc-stats-value">${stats.atk}</span>
        </div>
        <div class="npc-stats-row">
          <span class="npc-stats-label">🛡️ 防御</span>
          <span class="npc-stats-value">${stats.def}</span>
        </div>
        <div class="npc-stats-row">
          <span class="npc-stats-label">💨 身法</span>
          <span class="npc-stats-value">${stats.agi}</span>
        </div>
        <div class="npc-stats-row">
          <span class="npc-stats-label">💥 暴击</span>
          <span class="npc-stats-value">${stats.crit}%</span>
        </div>
        <div class="npc-stats-divider"></div>
        <div class="npc-stats-row">
          <span class="npc-stats-label">⚔️ 武器</span>
          <span class="npc-stats-value" style="color:${fabaoWeapon?.colorCss || 'var(--text-dim)'};">${fabaoWeapon?.name || '无'}</span>
        </div>
        <div class="npc-stats-row">
          <span class="npc-stats-label">🛡️ 衣服</span>
          <span class="npc-stats-value" style="color:${fabaoArmor?.colorCss || 'var(--text-dim)'};">${fabaoArmor?.name || '无'}</span>
        </div>
        <div class="npc-stats-row">
          <span class="npc-stats-label">💎 饰品</span>
          <span class="npc-stats-value" style="color:${fabaoAcc?.colorCss || 'var(--text-dim)'};">${fabaoAcc?.name || '无'}</span>
        </div>
      </div>`;
  }

  const overlay = document.createElement('div');
  overlay.id = 'npc-stats-overlay';
  overlay.className = 'npc-stats-overlay';
  overlay.innerHTML = `
    <div class="npc-stats-overlay-inner">
      <div class="npc-stats-header">
        <img src="${npcImg}" alt="${npcName}" class="npc-stats-portrait" onerror="this.style.display='none'">
        <div class="npc-stats-title">${npcName}</div>
      </div>
      ${bodyHtml}
      <button class="npc-stats-close" id="npc-stats-close">关 闭</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // 关闭按钮
  overlay.querySelector('#npc-stats-close')?.addEventListener('click', () => {
    overlay.remove();
  });

  // 点击背景关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // ESC 关闭
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}