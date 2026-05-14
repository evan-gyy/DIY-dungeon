import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { getNpcStats } from '../../systems/NpcBehavior';
import { TALENTS, TALENT_TIER, TALENT_TIER_CONFIG, type TalentId } from '../../data/realmConfig';
import { getRealmName, getExpForLevel, isRealmMaxLevel } from '../../state/LevelSystem';
import { FABAO } from '../../data/fabao';
import type { NpcStats, NpcPersonality } from '../../data/npcStats';
import { PERSONALITY } from '../../data/npcStats';
import {
  canRecommend, executeRecommend,
  canRecruit, executeRecruit,
  canDismiss, executeDismiss,
  canAssign, executeAssign,
  getRankLabel, getAssignmentLabel,
  getMaxRecruitSlots,
} from '../../systems/NPCManager';
import type { DiscipleRank, NpcAssignment } from '../../data/sandboxTypes';
import {
  ASSIGNMENT_LABEL, RECOMMEND_MIN_AFFECTION, RECRUIT_MIN_AFFECTION,
  COURT_RANK_LABEL, type CourtRank,
} from '../../data/sandboxTypes';
import {
  talkWithNpc, giveGiftToNpc, sparWithNpc,
  getInteractionInfo, GIFT_TIERS,
  type TalkResult, type GiftResult, type SparResult,
} from '../../systems/NPCInteraction';

interface RelationChar {
  id: string;
  name: string;
  img: string;
  affection: number;
  unlocked: boolean;
  /** NPC 数值卡 ID（对应 npcDatabase 中的 key） */
  npcDbId?: string;
}

/**
 * NPC 好感度初始值定义
 * - 柳清寒：30（师姐，初始好感稍高）
 * - 墨绐青：80（前朝国师，守护主角多年）
 * - 武当派 NPC：统一 20（点头之交）
 * - 沈霓裳：15（初识）
 * - 趙沁微：0（未解锁）
 * - 第三章 NPC：5（初识）
 */
const AFFECTION_INITIAL: Record<string, number> = {
  'liu_qinghan':      30,
  'shen_nishang':     15,
  'zhao_qinwei':      0,
  'mo_jiangqing':     80,
  'zhang_xuansu':     20,
  'chen_jingxu':      20,
  'song_zhiyuan':     20,
  'gu_xiaosang':      20,
  'lu_chengzhou':     20,
  'ji_wushuang_npc':  5,
  'su_yunxiu_npc':    5,
  'fang_zhonghe_npc': 5,
  'meng_wenyuan':     5,
  'ye_ziyi':          5,
  'zhou_boan':        20,
};

/**
 * 确保 npcAffection 中有该 NPC 的初始值
 * 在 enterCamp 时调用一次即可
 */
export function initNpcAffection(): void {
  const p = getPlayer();
  const affection = { ...p.npcAffection };
  let changed = false;
  for (const [id, val] of Object.entries(AFFECTION_INITIAL)) {
    if (!(id in affection)) {
      affection[id] = val;
      changed = true;
    }
  }
  if (changed) {
    setPlayer({ ...p, npcAffection: affection });
  }
}

/**
 * 获取指定 NPC 的好感度
 */
export function getNpcAffection(npcDbId: string): number {
  const p = getPlayer();
  return p.npcAffection?.[npcDbId] ?? AFFECTION_INITIAL[npcDbId] ?? 0;
}

/**
 * 修改指定 NPC 的好感度（delta 可正可负）
 */
export function changeNpcAffection(npcDbId: string, delta: number): void {
  const p = getPlayer();
  const current = getNpcAffection(npcDbId);
  const newVal = Math.max(0, Math.min(100, current + delta));
  const updated = { ...p, npcAffection: { ...p.npcAffection, [npcDbId]: newVal } };
  setPlayer(updated);
  saveGame(updated);
}

function getRelationData(): { heroines: RelationChar[]; wudang: RelationChar[]; other: RelationChar[]; recruited: RelationChar[] } {
  const p = getPlayer();
  const aff = (id: string) => getNpcAffection(id);
  const isSandbox = p.gameMode === 'sandbox';

  const heroines: RelationChar[] = [
    { id: 'liu_qinghan', name: '柳清寒', img: 'picture/Female-main/柳清寒.png', affection: aff('liu_qinghan'), unlocked: isSandbox || p.chapter >= 1, npcDbId: 'liu_qinghan' },
    { id: 'shen_nishang', name: '沈霓裳', img: 'picture/Female-main/沈霓裳.png', affection: aff('shen_nishang'), unlocked: isSandbox || (p.chapter >= 2 && p.act >= 4), npcDbId: 'shen_nishang' },
    { id: 'zhao_qinwei', name: '趙沁微', img: 'picture/Female-main/趙沁微.png', affection: aff('zhao_qinwei'),  unlocked: false },
    { id: 'mo_jiangqing', name: '墨绐青', img: 'picture/Female-main/墨绐青.png', affection: aff('mo_jiangqing'), unlocked: isSandbox || p.chapter >= 1, npcDbId: 'mo_jiangqing' },
  ];

  const wudang: RelationChar[] = [
    { id: 'zhang_xuansu', name: '张玄素', img: 'picture/NPC/张玄素.png', affection: aff('zhang_xuansu'), unlocked: isSandbox || p.chapter >= 2, npcDbId: 'zhang_xuansu' },
    { id: 'chen_jingxu', name: '陈静虚', img: 'picture/NPC/陈静虚.png', affection: aff('chen_jingxu'), unlocked: isSandbox || (p.chapter >= 2 && p.act >= 1), npcDbId: 'chen_jingxu' },
    { id: 'song_zhiyuan', name: '宋知远', img: 'picture/NPC/宋知远.png', affection: aff('song_zhiyuan'), unlocked: isSandbox || p.chapter >= 2, npcDbId: 'song_zhiyuan' },
    { id: 'gu_xiaosang', name: '顾小桑', img: 'picture/NPC/顾小桑.png', affection: aff('gu_xiaosang'), unlocked: isSandbox || p.chapter >= 2, npcDbId: 'gu_xiaosang' },
    { id: 'lu_chengzhou', name: '陆沉舟', img: 'picture/NPC/陆沉舟.png', affection: aff('lu_chengzhou'), unlocked: isSandbox || (p.chapter >= 2 && p.act >= 3), npcDbId: 'lu_chengzhou' },
    { id: 'ji_wushuang', name: '纪无双', img: 'picture/NPC/纪无双.png', affection: aff('ji_wushuang_npc'), unlocked: isSandbox || (p.chapter >= 3 && p.act >= 8), npcDbId: 'ji_wushuang_npc' },
    { id: 'su_yunxiu', name: '苏云绣', img: 'picture/NPC/苏云绣.png', affection: aff('su_yunxiu_npc'), unlocked: isSandbox || (p.chapter >= 3 && p.act >= 8), npcDbId: 'su_yunxiu_npc' },
    { id: 'fang_zhonghe', name: '方仲和', img: 'picture/NPC/方仲和.png', affection: aff('fang_zhonghe_npc'), unlocked: isSandbox || (p.chapter >= 3 && p.act >= 8), npcDbId: 'fang_zhonghe_npc' },
    { id: 'meng_wenyuan', name: '孟文渊', img: 'picture/NPC/孟文渊.png', affection: aff('meng_wenyuan'), unlocked: isSandbox || (p.chapter >= 3 && p.act >= 9), npcDbId: 'meng_wenyuan' },
    { id: 'ye_ziyi', name: '叶紫衣', img: 'picture/NPC/叶紫衣.png', affection: aff('ye_ziyi'), unlocked: isSandbox || (p.chapter >= 3 && p.act >= 9), npcDbId: 'ye_ziyi' },
    { id: 'zhou_boan', name: '周伯安', img: 'picture/NPC/周伯安.png', affection: aff('zhou_boan'), unlocked: isSandbox || p.chapter >= 2 },
  ];

  const other: RelationChar[] = [
  ];

  // 🆕 已招募的随从
  const recruitedIds = p.npcCollection?.recruited ?? [];
  const recruited: RelationChar[] = recruitedIds.map(npcId => {
    const stats = p.npcDatabase?.[npcId];
    const imgMap: Record<string, string> = {
      song_zhiyuan: 'picture/NPC/宋知远.png',
      gu_xiaosang: 'picture/NPC/顾小桑.png',
      lu_chengzhou: 'picture/NPC/陆沉舟.png',
      ji_wushuang_npc: 'picture/NPC/纪无双.png',
      su_yunxiu_npc: 'picture/NPC/苏云绣.png',
      fang_zhonghe_npc: 'picture/NPC/方仲和.png',
      meng_wenyuan: 'picture/NPC/孟文渊.png',
      ye_ziyi: 'picture/NPC/叶紫衣.png',
      liu_qinghan: 'picture/Female-main/柳清寒.png',
      shen_nishang: 'picture/Female-main/沈霓裳.png',
      mo_jiangqing: 'picture/Female-main/墨绐青.png',
    };
    return {
      id: npcId,
      name: stats?.name ?? npcId,
      img: imgMap[npcId] ?? '',
      affection: aff(npcId),
      unlocked: true,
      npcDbId: npcId,
    };
  });

  return { heroines, wudang, other, recruited };
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
  const p = getPlayer();
  const { heroines, wudang, other, recruited } = getRelationData();

  // 随从槽位信息
  const currentSlots = p.npcCollection?.recruited?.length ?? 0;
  const maxSlots = p.npcCollection?.maxSlots ?? 0;
  const slotInfo = maxSlots > 0
    ? `<span style="font-size:10px;color:var(--text-dim);">（${currentSlots}/${maxSlots}）</span>`
    : '';

  content.innerHTML = `
    <div class="relation-panel">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <span style="font-size:11px;color:var(--text-dim);letter-spacing:3px;padding:3px 10px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:20px;">人物关系</span>
      </div>
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:16px;">随着剧情推进，你将结识更多江湖人物。好感度会影响后续剧情发展。<br><span style="color:var(--text-gold);">点击立绘可查看角色详细状态与操作。</span></p>
      ${recruited.length > 0 ? renderSection('👥', `随从${slotInfo}`, recruited) : ''}
      ${renderSection('🌸', '女主角', heroines)}
      ${renderSection('☯️', '武当派', wudang)}
      ${other.length > 0 ? renderSection('🌏', '江湖', other) : ''}
    </div>`;

  // 绑定立绘点击事件 → 弹出NPC状态面板（含招募/指派）
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
  const npcSect = stats?.sect ?? '';
  const playerSect = p.sect;
  const affection = getNpcAffection(npcDbId);
  const isRecruited = p.npcCollection?.recruited?.includes(npcDbId) ?? false;

  // ── 宗门名称映射 ──
  const sectNames: Record<string, string> = {
    wudang: '武当', shaolin: '少林', emei: '峨眉', beggar: '丐帮',
    huashan: '华山', demon: '黑月教', maoshan: '茅山', kunlun: '昆仑',
    qingcheng: '青城', tangmen: '唐门', xiaoyao: '逍遥',
    quanzhen: '全真', kongtong: '崆峒', diancang: '点苍',
    riyue: '日月教', tiezhang: '铁掌帮', wudu: '五毒教', xuedao: '血刀门', haisha: '海沙派',
    none: '散修',
  };

  // ── 境界颜色映射（用于立绘光环） ──
  const realmColors: Record<string, string> = {
    '炼气': '#e8e8e8', '筑基': '#4caf50', '结丹': '#42a5f5',
    '元婴': '#ab47bc', '化神': '#ffd700', '渡劫': '#ef5350',
    '大乘': '#daa520', '飞升': '#7b68ee',
  };

  let bodyHtml = '';
  if (!stats) {
    bodyHtml = `<p style="color:var(--text-dim);text-align:center;padding:20px;">暂无该角色的详细数据。</p>`;
  } else {
    const talentIds = (stats.talents?.length ? stats.talents : (stats.talent ? [stats.talent] : ['normal'])) as string[];
    const npcTalents = talentIds.map((tid: string) => {
      const id = tid as TalentId;
      return { id, data: TALENTS[id], tier: TALENT_TIER[id] ?? 'common' };
    });
    const realm = getRealmName(stats.level);
    const realmColor = realmColors[realm] ?? '#c9a84c';
    const expNeeded = getExpForLevel(stats.level);
    const atMax = isRealmMaxLevel(stats.level);
    const expPct = atMax ? 100 : Math.min(100, Math.floor(stats.exp / expNeeded * 100));
    const fabaoWeapon = stats.equippedFabao.weapon ? FABAO[stats.equippedFabao.weapon] : null;
    const fabaoArmor = stats.equippedFabao.armor ? FABAO[stats.equippedFabao.armor] : null;
    const fabaoAcc = stats.equippedFabao.accessory ? FABAO[stats.equippedFabao.accessory] : null;
    const sectName = sectNames[stats.sect] ?? stats.sect;
    const discipleLabel = getRankLabel(stats.discipleRank);
    const courtLabel = COURT_RANK_LABEL[stats.courtRank as CourtRank] ?? '平民';
    const personality = stats.personality ?? 'gentle';
    const persCfg = PERSONALITY[personality];

    bodyHtml = `
      <!-- 身份双栏 -->
      <div class="npc-stats-identity-row">
        <span class="npc-stats-identity-tag sect">🏛️ ${sectName} · ${discipleLabel}</span>
        <span class="npc-stats-identity-tag court">🏯 ${courtLabel}</span>
      </div>

      <!-- 修为 -->
      <div class="npc-stats-section">
        <div class="npc-stats-section-title"><span class="icon">☯️</span>修为境界</div>
        <div class="npc-stats-attr-row">
          <span class="npc-stats-attr-label">境界</span>
          <span class="npc-stats-attr-value" style="color:${realmColor};">${realm}</span>
        </div>
        <div class="npc-stats-exp-bar-wrap">
          <div class="npc-stats-attr-row">
            <span class="npc-stats-attr-label">修为进度</span>
            <span class="npc-stats-attr-value" style="font-size:11px;color:${atMax ? '#e74c3c' : 'var(--text-dim)'};">${atMax ? '已满' : `${stats.exp} / ${expNeeded}`}</span>
          </div>
          <div class="npc-stats-exp-bar">
            <div class="npc-stats-exp-fill" style="width:${expPct}%;background:${atMax ? '#e74c3c' : `linear-gradient(90deg,${realmColor},#9b59b6)`};"></div>
          </div>
        </div>
      </div>

      <!-- 六维属性 -->
      <div class="npc-stats-section">
        <div class="npc-stats-section-title"><span class="icon">📊</span>基础属性</div>
        <div class="npc-stats-attr-grid">
          <div class="npc-stats-attr-row">
            <span class="npc-stats-attr-label">❤️ 气血</span>
            <span class="npc-stats-attr-value">${stats.hp} / ${stats.maxHp}</span>
          </div>
          <div class="npc-stats-attr-row">
            <span class="npc-stats-attr-label">💧 内力</span>
            <span class="npc-stats-attr-value">${stats.mp} / ${stats.maxMp}</span>
          </div>
          <div class="npc-stats-attr-row">
            <span class="npc-stats-attr-label">⚔️ 攻击</span>
            <span class="npc-stats-attr-value">${stats.atk}</span>
          </div>
          <div class="npc-stats-attr-row">
            <span class="npc-stats-attr-label">🛡️ 防御</span>
            <span class="npc-stats-attr-value">${stats.def}</span>
          </div>
          <div class="npc-stats-attr-row">
            <span class="npc-stats-attr-label">💨 身法</span>
            <span class="npc-stats-attr-value">${stats.agi}</span>
          </div>
          <div class="npc-stats-attr-row">
            <span class="npc-stats-attr-label">💥 暴击</span>
            <span class="npc-stats-attr-value">${stats.crit}%</span>
          </div>
        </div>
      </div>

      <!-- 天赋 -->
      <div class="npc-stats-section">
        <div class="npc-stats-section-title"><span class="icon">🌟</span>天赋</div>
        <div class="npc-stats-talents">
          ${npcTalents.map(t => {
            const tierCfg = TALENT_TIER_CONFIG[t.tier];
            return `<span class="npc-stats-talent-tag ${t.tier}" title="${t.data?.desc ?? ''}">${tierCfg?.label ? `[${tierCfg.label}] ` : ''}${t.data?.name ?? t.id}</span>`;
          }).join('')}
        </div>
      </div>

      <!-- 法宝 -->
      <div class="npc-stats-section">
        <div class="npc-stats-section-title"><span class="icon">💎</span>装备法宝</div>
        <div class="npc-stats-fabao-row">
          <span class="npc-stats-fabao-item" style="color:${fabaoWeapon?.colorCss || 'var(--text-dim)'};">⚔️ ${fabaoWeapon?.name || '无'}</span>
          <span class="npc-stats-fabao-item" style="color:${fabaoArmor?.colorCss || 'var(--text-dim)'};">🛡️ ${fabaoArmor?.name || '无'}</span>
          <span class="npc-stats-fabao-item" style="color:${fabaoAcc?.colorCss || 'var(--text-dim)'};">💎 ${fabaoAcc?.name || '无'}</span>
        </div>
      </div>

      <!-- 好感度 + 性格 -->
      <div class="npc-stats-section">
        <div class="npc-stats-section-title"><span class="icon">💝</span>关系</div>
        <div class="npc-stats-aff-row">
          <span style="font-size:12px;color:#f0a0b0;white-space:nowrap;">❤️ ${affection}/100</span>
          <div class="npc-stats-aff-bar-wrap">
            <div class="npc-stats-aff-bar-fill" style="width:${affection}%;"></div>
          </div>
          <span class="npc-stats-personality">${persCfg.icon} ${persCfg.name}</span>
        </div>
        <div style="font-size:11px;color:var(--text-dim);margin-top:3px;">${persCfg.desc}</div>
      </div>

      ${isRecruited ? renderRecruitedActions(npcDbId, p) : ''}
    `;
  }

  // 操作按钮区
  const actionButtons = renderActionButtons(npcDbId, stats, p, affection, isRecruited);

  const overlay = document.createElement('div');
  overlay.id = 'npc-stats-overlay';
  overlay.className = 'npc-stats-overlay';
  overlay.dataset['npcDbId'] = npcDbId;
  overlay.dataset['npcName'] = npcName;
  overlay.dataset['npcImg'] = npcImg;

  const tianjiaoBadge = stats?.isTianjiao ? '<span class="npc-stats-tianjiao-badge">天骄</span>' : '';
  const realm = stats ? getRealmName(stats.level) : '';
  const realmColor = stats ? (realmColors[realm] ?? '#c9a84c') : '#c9a84c';
  const tianjiaoClass = stats?.isTianjiao ? ' tianjiao' : '';

  overlay.innerHTML = `
    <div class="npc-stats-overlay-inner">
      <!-- 左侧：立绘 -->
      <div class="npc-stats-left">
        <div class="npc-stats-portrait-wrap${tianjiaoClass}" style="--realm-glow:${realmColor};">
          <img src="${npcImg}" alt="${npcName}" class="npc-stats-portrait" onerror="this.style.display='none'">
        </div>
        <div class="npc-stats-realm-tag" style="background:${realmColor}22;border:1px solid ${realmColor}44;">
          ${realm}
        </div>
      </div>
      <!-- 右侧：属性 -->
      <div class="npc-stats-right">
        <div class="npc-stats-name-row">
          <span class="npc-stats-name">${npcName}</span>
          ${tianjiaoBadge}
        </div>
        ${bodyHtml}
        <div class="npc-stats-actions">${actionButtons}</div>
        <button class="npc-stats-close" id="npc-stats-close">关 闭</button>
      </div>
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

  // 绑定操作按钮事件
  bindActionEvents(overlay, npcDbId, npcName, stats);
}

// ──── 操作按钮渲染 ────

function renderActionButtons(
  npcDbId: string,
  stats: NpcStats | null,
  p: ReturnType<typeof getPlayer>,
  affection: number,
  isRecruited: boolean,
): string {
  if (!stats) return '';

  const buttons: string[] = [];

  // ── 管理操作（招募/推荐/解除/指派） ──
  if (isRecruited) {
    const currentAssignment = p.npcCollection?.assignments?.[npcDbId] ?? 'idle';
    buttons.push(`
      <div class="npc-action-row">
        <span style="font-size:11px;color:var(--text-dim);">当前指派：</span>
        <select class="npc-assign-select" data-npc-id="${npcDbId}" style="flex:1;">
          ${Object.entries(ASSIGNMENT_LABEL).map(([key, label]) =>
            `<option value="${key}" ${key === currentAssignment ? 'selected' : ''}>${label}</option>`
          ).join('')}
        </select>
      </div>`);
    buttons.push(`<button class="npc-action-btn danger" data-action="dismiss" data-npc-id="${npcDbId}">解除随从</button>`);
  } else if (stats.sect === p.sect) {
    const check = canRecruit(p, stats, affection);
    if (check.success) {
      buttons.push(`<button class="npc-action-btn primary" data-action="recruit" data-npc-id="${npcDbId}">招募为随从</button>`);
    } else {
      buttons.push(`<button class="npc-action-btn disabled" disabled title="${check.message}">招募为随从（${check.message.slice(0, 15)}…）</button>`);
    }
  } else {
    const check = canRecommend(p, stats, affection);
    if (check.success) {
      buttons.push(`<button class="npc-action-btn primary" data-action="recommend" data-npc-id="${npcDbId}">推荐加入${getSectShortName(p.sect)}</button>`);
    } else {
      buttons.push(`<button class="npc-action-btn disabled" disabled title="${check.message}">推荐入宗（${check.message.slice(0, 15)}…）</button>`);
    }
  }

  // ── NPC交互操作（交谈/送礼/切磋） ──
  const info = getInteractionInfo(npcDbId);
  buttons.push('<div class="npc-interact-divider"></div>');
  buttons.push(`<div style="font-size:11px;color:var(--text-dim);letter-spacing:2px;margin-bottom:4px;">互动</div>`);

  // 交谈
  buttons.push(`<button class="npc-action-btn npc-action-talk" data-action="talk" data-npc-id="${npcDbId}">💬 交谈${info ? `（×${info.talkTotalMult.toFixed(1)}）` : ''}</button>`);

  // 送礼（档次选择 + 按钮）
  buttons.push(`
    <div class="npc-action-row">
      <select class="npc-gift-select" data-npc-id="${npcDbId}" style="flex:1;">
        ${GIFT_TIERS.map((t, i) => `<option value="${i}">${t.label}（${t.cost}两，+${info ? Math.round(t.baseAffection * info.giftTotalMult) : t.baseAffection}好感）</option>`).join('')}
      </select>
      <button class="npc-action-btn npc-action-gift" data-action="gift" data-npc-id="${npcDbId}" style="width:auto;padding:8px 14px;">🎁 送礼</button>
    </div>`);

  // 切磋
  buttons.push(`<button class="npc-action-btn npc-action-spar" data-action="spar" data-npc-id="${npcDbId}">⚔️ 切磋</button>`);

  return buttons.join('');
}

function renderRecruitedActions(npcDbId: string, p: ReturnType<typeof getPlayer>): string {
  const assignment = p.npcCollection?.assignments?.[npcDbId] ?? 'idle';
  const target = p.npcCollection?.assignmentTargets?.[npcDbId] ?? '';
  const label = ASSIGNMENT_LABEL[assignment as NpcAssignment] ?? '闲置';
  const targetText = target ? ` → ${target}` : '';
  return `
    <div class="npc-stats-divider"></div>
    <div class="npc-stats-row">
      <span class="npc-stats-label">👥 随从状态</span>
      <span class="npc-stats-value" style="color:#8ec8a0;">${label}${targetText}</span>
    </div>`;
}

// ──── 操作事件绑定 ────

function bindActionEvents(overlay: HTMLElement, npcDbId: string, npcName: string, stats: NpcStats | null): void {
  if (!stats) return;

  // 招募按钮
  overlay.querySelector<HTMLElement>('[data-action="recruit"]')?.addEventListener('click', () => {
    doRecruit(npcDbId, npcName, stats);
    overlay.remove();
  });

  // 推荐入宗按钮
  overlay.querySelector<HTMLElement>('[data-action="recommend"]')?.addEventListener('click', () => {
    doRecommend(npcDbId, npcName, stats);
    overlay.remove();
  });

  // 解除按钮
  overlay.querySelector<HTMLElement>('[data-action="dismiss"]')?.addEventListener('click', () => {
    doDismiss(npcDbId, npcName);
    overlay.remove();
  });

  // 指派下拉
  overlay.querySelector<HTMLSelectElement>('.npc-assign-select')?.addEventListener('change', (e) => {
    const select = e.target as HTMLSelectElement;
    const assignment = select.value as NpcAssignment;
    doAssign(npcDbId, npcName, assignment);
    overlay.remove();
  });

  // ── 互动操作 ──

  // 交谈
  overlay.querySelector<HTMLElement>('[data-action="talk"]')?.addEventListener('click', () => {
    const result = talkWithNpc(npcDbId);
    showToast(result.message);
    refreshNpcOverlay(overlay);
  });

  // 送礼
  overlay.querySelector<HTMLElement>('[data-action="gift"]')?.addEventListener('click', () => {
    const select = overlay.querySelector<HTMLSelectElement>('.npc-gift-select') as HTMLSelectElement | null;
    const tierIndex = select ? parseInt(select.value, 10) : 0;
    const result = giveGiftToNpc(npcDbId, tierIndex);
    showToast(result.message);
    refreshNpcOverlay(overlay);
  });

  // 切磋
  overlay.querySelector<HTMLElement>('[data-action="spar"]')?.addEventListener('click', () => {
    const result = sparWithNpc(npcDbId);
    showToast(result.message);
    refreshNpcOverlay(overlay);
  });
}

/** 互动后刷新弹窗（重新读取最新好感度/铜钱） */
function refreshNpcOverlay(overlay: HTMLElement): void {
  const npcDbId = overlay.dataset['npcDbId'] ?? '';
  const npcName = overlay.dataset['npcName'] ?? '';
  const npcImg = overlay.dataset['npcImg'] ?? '';
  if (npcDbId) {
    overlay.remove();
    showNpcStatsOverlay(npcDbId, npcName, npcImg);
  }
}

// ──── 核心操作函数 ────

function doRecommend(npcDbId: string, npcName: string, stats: NpcStats): void {
  const p = getPlayer();
  const affection = getNpcAffection(npcDbId);
  const check = canRecommend(p, stats, affection);
  if (!check.success) {
    showToast(check.message);
    return;
  }

  const result = executeRecommend(p, stats);
  const updated = {
    ...p,
    npcDatabase: { ...p.npcDatabase, [npcDbId]: result.npc },
    sectContribution: (p.sectContribution ?? 0) + result.contributionGain,
  };
  setPlayer(updated);
  saveGame(updated);

  // 刷新面板
  refreshRelationPanel();
  showToast(`✅ ${npcName}已加入${getSectShortName(p.sect)}！贡献 +${result.contributionGain}`);
}

function doRecruit(npcDbId: string, npcName: string, stats: NpcStats): void {
  const p = getPlayer();
  const affection = getNpcAffection(npcDbId);
  const check = canRecruit(p, stats, affection);
  if (!check.success) {
    showToast(check.message);
    return;
  }

  const result = executeRecruit(p, npcDbId);
  const updated = {
    ...p,
    npcCollection: { ...p.npcCollection, ...result },
  };
  setPlayer(updated);
  saveGame(updated);

  refreshRelationPanel();
  showToast(`✅ ${npcName}已成为你的随从！`);
}

function doDismiss(npcDbId: string, npcName: string): void {
  const p = getPlayer();
  const check = canDismiss(p, npcDbId);
  if (!check.success) {
    showToast(check.message);
    return;
  }

  const result = executeDismiss(p, npcDbId);
  const updated = {
    ...p,
    npcCollection: { ...p.npcCollection, ...result },
  };
  setPlayer(updated);
  saveGame(updated);

  refreshRelationPanel();
  showToast(`${npcName}已不再是你的随从。`);
}

function doAssign(npcDbId: string, npcName: string, assignment: NpcAssignment): void {
  const p = getPlayer();
  const check = canAssign(p, npcDbId, assignment);
  if (!check.success) {
    showToast(check.message);
    return;
  }

  const result = executeAssign(p, npcDbId, assignment);
  const updated = {
    ...p,
    npcCollection: { ...p.npcCollection, ...result },
  };
  setPlayer(updated);
  saveGame(updated);

  refreshRelationPanel();
  showToast(`${npcName} → ${ASSIGNMENT_LABEL[assignment]}`);
}

function getSectShortName(sect: string): string {
  const names: Record<string, string> = {
    wudang: '武当', emei: '峨眉', shaolin: '少林',
    beggar: '丐帮', huashan: '华山', demon: '魔教',
  };
  return names[sect] ?? sect;
}

function showToast(msg: string): void {
  import('../../ui/toast').then(m => m.showToast(msg));
}

/** 强制刷新关系面板 */
function refreshRelationPanel(): void {
  const contentEl = document.querySelector<HTMLElement>('.camp-main-content, #camp-content');
  if (contentEl) {
    import('./AttrPanel');
    renderRelationPanel(contentEl);
  }
}