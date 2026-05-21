// ============================================================
//  src/systems/BattleBondDialog.ts — 战前羁绊对话
// ============================================================
//  团队战前，若队友与主角有特殊关系，展示一段简短对话。
//  灵感来源：三国志13 绊事件 + 太阁立志传 战场对话
// ============================================================

import type { PlayerNpcRelation } from '../data/types';
import { getPlayer } from '../state/GameState';

interface BondDialogLine {
  /** 台词 */
  line: string;
  /** 说话者名字 */
  speaker: string;
  /** 关系类型 */
  relation: PlayerNpcRelation | 'friend_high';
}

const LOVER_LINES_MALE = [
  '愿与君同生共死，此战无悔。',
  '有你在身边，妾身无所畏惧。',
  '这一战，我会守在你身后。',
];
const LOVER_LINES_FEMALE = [
  '有你在身边，我便无所畏惧。',
  '执子之手，与子同战。',
  '此去经年，愿与君共赴沙场。',
];

const SWORN_LINES = [
  '大哥！今日你我兄弟并肩，便是千军万马又何惧！',
  '说好了同年同月同日死的，可不能食言！',
  '二哥放心，背后交给我！',
];

const MASTER_LINES = [
  '徒儿，用为师教你的那一招。',
  '让为师看看你这段时间的修行成果。',
  '跟紧为师，莫要冒进。',
];

const STUDENT_LINES = [
  '师父！弟子定不负所教！',
  '谨遵师父教诲，此战必胜！',
  '今日便让师父看看弟子的修行成果！',
];

const HIGH_AFFECTION_LINES_MALE = [
  '放心，这一战你我同进退。',
  '兄弟，我信你。',
];

const HIGH_AFFECTION_LINES_FEMALE = [
  '姐姐，我们一起上。',
  '我虽力薄，但也愿与姐姐并肩。',
];

const FRIEND_LINES = [
  '那么，一起上吧。',
  '彼此照应。',
];

/** 为团队战生成羁绊对话（最多 3 条） */
export function generateBondDialog(
  allyNames: string[],
): BondDialogLine[] {
  const p = getPlayer();
  const db = p.npcDatabase ?? {};
  const affection = p.npcAffection ?? {};
  const relations = p.npcRelations ?? {};
  const lines: BondDialogLine[] = [];

  for (const allyName of allyNames) {
    // 通过名字匹配 NPC
    const npcEntry = Object.entries(db).find(([, n]) => n.name === allyName);
    if (!npcEntry) continue;
    const [npcId, npc] = npcEntry;
    const aff = affection[npcId] ?? 0;
    const rels = relations[npcId] ?? [];
    const npcGender = npc.gender ?? 'male';

    // 优先级：道侣 > 结义 > 师徒 > 高好感 > 普通友好
    if (rels.includes('lover')) {
      const pool = npcGender === 'female' ? LOVER_LINES_FEMALE : LOVER_LINES_MALE;
      lines.push({ speaker: allyName, line: pool[Math.floor(Math.random() * pool.length)]!, relation: 'lover' });
      continue;
    }
    if (rels.includes('sworn_brother')) {
      lines.push({ speaker: allyName, line: SWORN_LINES[Math.floor(Math.random() * SWORN_LINES.length)]!, relation: 'sworn_brother' });
      continue;
    }
    if (rels.includes('master')) {
      lines.push({ speaker: allyName, line: MASTER_LINES[Math.floor(Math.random() * MASTER_LINES.length)]!, relation: 'master' });
      continue;
    }
    if (rels.includes('student')) {
      lines.push({ speaker: allyName, line: STUDENT_LINES[Math.floor(Math.random() * STUDENT_LINES.length)]!, relation: 'student' });
      continue;
    }
    if (aff >= 60) {
      const pool = npcGender === 'female' ? HIGH_AFFECTION_LINES_FEMALE : HIGH_AFFECTION_LINES_MALE;
      lines.push({ speaker: allyName, line: pool[Math.floor(Math.random() * pool.length)]!, relation: 'friend_high' });
      continue;
    }
    if (aff >= 30 && Math.random() < 0.5) {
      lines.push({ speaker: allyName, line: FRIEND_LINES[Math.floor(Math.random() * FRIEND_LINES.length)]!, relation: 'friend_high' });
    }
  }

  return lines.slice(0, 3);
}

/** 显示战前羁绊对话弹窗，返回 Promise 在弹窗关闭后 resolve */
export function showBondDialogOverlay(lines: BondDialogLine[]): Promise<void> {
  return new Promise(resolve => {
    if (lines.length === 0) { resolve(); return; }

    const overlay = document.createElement('div');
    overlay.id = 'bond-dialog-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:500;animation:bond-fadein 0.5s ease;';

    const dialogHtml = lines.map((l, i) => {
      const isPlayer = i === 0; // 第一句是主角的回应（如果需要）
      const colorMap: Record<string, string> = {
        lover: '#FF69B4',
        sworn_brother: '#FFD700',
        master: '#9A7CFF',
        student: '#78BE00',
        friend_high: '#4CAF50',
      };
      const color = colorMap[l.relation] ?? '#ccc';
      const iconMap: Record<string, string> = {
        lover: '💕',
        sworn_brother: '🤝',
        master: '👨‍🏫',
        student: '📚',
        friend_high: '💚',
      };
      const icon = iconMap[l.relation] ?? '';

      return `
        <div class="bond-dialog-line" style="animation-delay:${i * 0.6}s">
          <span class="bond-dialog-speaker" style="color:${color}">${icon} ${l.speaker}</span>
          <span class="bond-dialog-text">「${l.line}」</span>
        </div>`;
    }).join('');

    overlay.innerHTML = `
      <div class="bond-dialog-box">
        <div class="bond-dialog-title">⚔️ 战前</div>
        ${dialogHtml}
        <div class="bond-dialog-continue">点击任意位置继续</div>
      </div>
    `;

    // 添加动画 CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bond-fadein { from { opacity: 0; } to { opacity: 1; } }
      @keyframes bond-slidein { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    `;
    document.head.appendChild(style);

    document.body.appendChild(overlay);

    const close = () => {
      overlay.remove();
      style.remove();
      resolve();
    };
    overlay.addEventListener('click', close);

    // 3 秒自动关闭
    setTimeout(close, 3500);
  });
}
